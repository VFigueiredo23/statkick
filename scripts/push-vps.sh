#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VPS_HOST_ALIAS="${VPS_HOST_ALIAS:-statkick-vps}"
VPS_PATH="${VPS_PATH:-/opt/statkick}"
DEPLOY_GIT_SHA="${DEPLOY_GIT_SHA:-$(git -C "$ROOT_DIR" rev-parse --short HEAD 2>/dev/null || echo local)}"
DEPLOY_GIT_REF="${DEPLOY_GIT_REF:-$(git -C "$ROOT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo local)}"

cd "$ROOT_DIR"

rsync -az --delete \
  --exclude '.env' \
  --exclude '.git' \
  --exclude '.github' \
  --exclude 'node_modules' \
  --exclude 'frontend/node_modules' \
  --exclude 'frontend/.next' \
  --exclude '__pycache__' \
  --exclude 'backend/__pycache__' \
  --exclude 'backend/**/*.pyc' \
  --exclude 'media/' \
  --exclude '.deploy-version' \
  ./ "${VPS_HOST_ALIAS}:${VPS_PATH}"

ssh "${VPS_HOST_ALIAS}" "cd '${VPS_PATH}' && DEPLOY_GIT_SHA='${DEPLOY_GIT_SHA}' DEPLOY_GIT_REF='${DEPLOY_GIT_REF}' bash ./scripts/deploy-vps.sh"
