#!/usr/bin/env bash
# Pull, install, build, restart the PM2 app.
#
#   scripts/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."

git pull --ff-only
bun install --frozen-lockfile

# Build before restarting: a failed build leaves the site on the old code.
# The build prerenders the latest movies, so the API must be up.
bun run build

pm2 startOrRestart ecosystem.config.cjs --update-env
pm2 save
