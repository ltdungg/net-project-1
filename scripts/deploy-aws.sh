#!/usr/bin/env bash
set -euo pipefail
umask 077

ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
INFRA="$ROOT/infra/aws"
fail() { printf 'Lỗi: %s\n' "$*" >&2; exit 1; }

case "${1:-}" in
  ""|--app-only) ;;
  --help|-h)
    printf 'Dùng: bash scripts/deploy-aws.sh [--app-only]\nĐiền .envrc trước. --app-only cập nhật ứng dụng trên EC2 đã tạo.\n'
    exit 0 ;;
  *) fail "Tham số không hợp lệ. Dùng --help." ;;
esac
[[ $# -le 1 ]] || fail "Chỉ nhận tối đa một tham số."

[[ -f "$ROOT/.envrc" ]] || fail "Chép .envrc.example thành .envrc và điền tham số trước."
# shellcheck source=../.envrc.example
source "$ROOT/.envrc"

for tool in terraform ssh tar curl; do
  command -v "$tool" >/dev/null || fail "Thiếu lệnh $tool."
done
bash -n "$INFRA/deploy-app.sh"
for name in SSH_PRIVATE_KEY TF_VAR_key_pair_name POSTGRES_PASSWORD JWT_SECRET PAYMENT_WEBHOOK_SECRET ADMIN_EMAILS; do
  value=${!name:-}
  [[ -n "$value" && "$value" != *CHANGE_ME* ]] || fail "Hãy điền $name trong .envrc."
done
[[ -f "$SSH_PRIVATE_KEY" && -r "$SSH_PRIVATE_KEY" ]] || fail "Không đọc được file private key .pem. Kiểm tra SSH_PRIVATE_KEY trong .envrc."
for name in POSTGRES_PASSWORD JWT_SECRET PAYMENT_WEBHOOK_SECRET; do
  value=${!name}
  [[ "$value" =~ ^[a-zA-Z0-9_-]{32,}$ ]] || fail "$name cần ít nhất 32 ký tự chữ/số/_/-. Có thể dùng openssl rand -hex 32."
done
[[ "$ADMIN_EMAILS" != "your-email@example.com" ]] || fail "Điền email tài khoản quản trị trong ADMIN_EMAILS."
DOMAIN=${DOMAIN:-}
if [[ -n "$DOMAIN" ]]; then
  [[ "$DOMAIN" =~ ^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$ ]] || fail "DOMAIN chỉ chứa tên miền, không có https://, cổng hoặc đường dẫn."
fi

terraform -chdir="$INFRA" init -input=false
terraform -chdir="$INFRA" validate
if [[ "${1:-}" != --app-only ]]; then
  # Terraform displays the changes and asks for 'yes' before creating resources.
  terraform -chdir="$INFRA" apply
fi
PUBLIC_IP=$(terraform -chdir="$INFRA" output -raw public_ip)
[[ "$PUBLIC_IP" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail "Chưa có public_ip; hãy tạo hạ tầng trước."

APP_ENV=local
PUBLIC_ORIGIN="http://$PUBLIC_IP"
SITE_ADDRESS="http://$PUBLIC_IP"
if [[ -n "$DOMAIN" ]]; then
  APP_ENV=production
  PUBLIC_ORIGIN="https://$DOMAIN"
  SITE_ADDRESS="$DOMAIN"
  printf 'HTTPS: bản ghi DNS A của %s cần trỏ về %s.\n' "$DOMAIN" "$PUBLIC_IP"
fi

SSH=(ssh -i "$SSH_PRIVATE_KEY" -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 -o ServerAliveInterval=15 -o ServerAliveCountMax=4 "ubuntu@$PUBLIC_IP")
printf 'Đợi EC2 và Docker sẵn sàng tại %s...\n' "$PUBLIC_IP"
ready=false
for ((attempt = 1; attempt <= 60; attempt++)); do
  if "${SSH[@]}" 'test -f /var/lib/net-commerce-bootstrap-ready && docker info >/dev/null 2>&1' 2>/dev/null; then
    ready=true
    break
  fi
  sleep 10
done
[[ "$ready" == true ]] || fail "EC2 chưa sẵn sàng. Kiểm tra SSH key, kết nối cổng 22 và /var/log/cloud-init-output.log."

STAGING=$(mktemp -d)
trap 'rm -rf -- "$STAGING"' EXIT
# Escape Compose dotenv syntax without expanding values as shell code.
write_env() {
  local name=$1 value=$2
  [[ "$value" != *$'\n'* && "$value" != *$'\r'* ]] || fail "$name phải nằm trên một dòng."
  value=${value//\\/\\\\}
  value=${value//\"/\\\"}
  value=${value//\$/\$\$}
  printf '%s="%s"\n' "$name" "$value"
}
{
  write_env APP_ENV "$APP_ENV"
  write_env PUBLIC_ORIGIN "$PUBLIC_ORIGIN"
  write_env SITE_ADDRESS "$SITE_ADDRESS"
  write_env POSTGRES_PASSWORD "$POSTGRES_PASSWORD"
  write_env JWT_SECRET "$JWT_SECRET"
  write_env PAYMENT_WEBHOOK_SECRET "$PAYMENT_WEBHOOK_SECRET"
  write_env ADMIN_EMAILS "$ADMIN_EMAILS"
  write_env MANAGER_EMAILS "${MANAGER_EMAILS:-}"
  write_env GEMINI_API_KEY "${GEMINI_API_KEY:-}"
  write_env GEMINI_MODEL "${GEMINI_MODEL:-gemini-3.8-flash}"
} > "$STAGING/.env"
# Only non-secret frontend settings go into the file read by the unprivileged container.
printf '%s\n' \
  "APP_ENV=$APP_ENV" \
  'LOCAL_AUTH_BYPASS=false' \
  'COMMERCE_API_URL=http://api:8080' \
  "COMMERCE_PUBLIC_ORIGIN=$PUBLIC_ORIGIN" \
  "PUBLIC_ASSET_ORIGIN=$PUBLIC_ORIGIN" > "$STAGING/frontend.env"
chmod 644 "$STAGING/frontend.env"

# A fresh source directory avoids retaining files deleted between deployments.
# Docker volumes have fixed names under the net-commerce-aws Compose project.
RELEASE="/opt/net-commerce/release-$(date -u +%Y%m%dT%H%M%SZ)-$$"
"${SSH[@]}" "mkdir -m 700 '$RELEASE'"
tar -czf "$STAGING/source.tgz" \
  --exclude=node_modules --exclude=target --exclude=dist \
  --exclude=.git --exclude=.aws --exclude=.codex --exclude=.agents \
  --exclude=.env --exclude='.env.*' --exclude='.envrc*' \
  --exclude='.dev.vars*' --exclude=.npmrc --exclude=.netrc --exclude=.ssh \
  --exclude='*.pem' --exclude='*.key' --exclude=.terraform \
  --exclude='*.log' \
  --exclude=.wrangler --exclude=.next --exclude=.vinext \
  --exclude=work --exclude=data --exclude=coverage \
  --exclude=playwright-report --exclude=test-results \
  -C "$ROOT" platform -C "$INFRA" compose.yaml Caddyfile deploy-app.sh
"${SSH[@]}" "tar -xzf - -C '$RELEASE'" < "$STAGING/source.tgz"
tar -czf - -C "$STAGING" .env frontend.env | "${SSH[@]}" "tar -xzf - -C '$RELEASE'"

printf 'Build và khởi động ứng dụng trên EC2...\n'
"${SSH[@]}" "bash '$RELEASE/deploy-app.sh'" </dev/null

printf 'Kiểm tra %s/api/health...\n' "$PUBLIC_ORIGIN"
curl --fail --silent --show-error --retry 12 --retry-delay 10 --retry-all-errors \
  --connect-timeout 10 --max-time 20 "$PUBLIC_ORIGIN/api/health"
printf '\nĐã triển khai: %s\n' "$PUBLIC_ORIGIN"
