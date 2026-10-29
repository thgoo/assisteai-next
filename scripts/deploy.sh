#!/usr/bin/env bash
# Pull, install, build, restart the PM2 app, check it answers. Run on the server from the repo.
#
#   scripts/deploy.sh
#
# Production by default (PM2 `assisteai.com.br`, port 3003). Another copy of the site, like staging, sets APP_NAME and
# PORT in a `.env.deploy` file next to package.json (not committed).
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -f .env.deploy ]; then
  set -a
  . ./.env.deploy
  set +a
fi
export APP_NAME="${APP_NAME:-assisteai.com.br}"
export PORT="${PORT:-3003}"

git pull --ff-only
bun install --frozen-lockfile

# Build before restarting: a failed build leaves the site on the old code.
# The build prerenders the latest movies, so the API must be up.
bun run build

pm2 startOrRestart ecosystem.config.cjs --update-env
pm2 save

for _ in $(seq 1 30); do
  # Silent: the first tries can land before the server listens
  if curl -fs -o /dev/null "http://127.0.0.1:${PORT}/"; then
    echo "deploy ok: ${APP_NAME} at $(git rev-parse --short HEAD)"
    exit 0
  fi
  sleep 1
done
echo "${APP_NAME} didn't answer on port ${PORT}: pm2 logs ${APP_NAME}" >&2
exit 1
