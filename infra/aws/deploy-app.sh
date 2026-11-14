#!/usr/bin/env bash
set -euo pipefail
umask 077

# Uploaded with the release; execute a file instead of streaming shell code over SSH.
RELEASE=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
cd "$RELEASE"
docker compose config --quiet
# Serial builds reduce peak memory use on a single EC2.
docker compose build api
docker compose build commerce
docker compose up -d --wait --wait-timeout 300

# Reuse the local demo seed after migrations and health checks have completed.
runtime_env=$(docker compose exec -T api printenv APP_ENV)
if [[ "$runtime_env" == local ]]; then
  if ! command -v node >/dev/null; then
    sudo apt-get -o Acquire::Retries=5 update
    sudo env DEBIAN_FRONTEND=noninteractive apt-get -o Acquire::Retries=5 -o DPkg::Lock::Timeout=120 install -y --no-install-recommends nodejs
  fi
  printf 'Nạp dữ liệu demo (đã có thì giữ nguyên)...\n'
  COMPOSE_FILE="$RELEASE/compose.yaml" node platform/backend/scripts/seed-demo.mjs --project net-commerce-aws
else
  printf 'APP_ENV=production: bỏ qua seed demo.\n'
fi

ln -sfn "$RELEASE" /opt/net-commerce/current
docker compose ps
