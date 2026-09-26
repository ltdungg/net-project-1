#!/bin/sh
set -eu

PERSIST_DIR="/app/.wrangler/state"

echo "Applying local D1 migrations..."
npx wrangler d1 migrations apply site-creator-d1 \
  --local \
  --config=wrangler.local.jsonc \
  --persist-to="$PERSIST_DIR"

echo "Starting NÉT Commerce on port 8787..."
exec npm run start -- \
  --ip 0.0.0.0 \
  --port 8787 \
  --persist-to="$PERSIST_DIR" \
  --env-file /app/.env
