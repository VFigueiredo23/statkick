#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_WAIT_TIMEOUT="${DEPLOY_WAIT_TIMEOUT:-180}"
DEPLOY_TARGET_MODE="${DEPLOY_TARGET_MODE:-}"

compose_args=()
log_services=()

log() {
  printf '[deploy] %s\n' "$*"
}

retry_http_check() {
  local description="$1"
  shift

  for attempt in $(seq 1 20); do
    if "$@" >/dev/null 2>&1; then
      log "${description} ok"
      return 0
    fi
    sleep 2
  done

  log "${description} falhou apos varias tentativas"
  "$@"
}

read_env_value() {
  local key="$1"
  awk -F= -v search_key="$key" '
    $0 !~ /^[[:space:]]*#/ && $1 == search_key {
      sub(/^[^=]*=/, "", $0)
      print $0
      exit
    }
  ' "$ROOT_DIR/.env"
}

configure_deploy_mode() {
  local app_domain=""
  local api_domain=""

  if [[ -z "$DEPLOY_TARGET_MODE" ]]; then
    DEPLOY_TARGET_MODE="$(read_env_value DEPLOY_TARGET_MODE)"
  fi

  app_domain="$(read_env_value APP_DOMAIN)"
  api_domain="$(read_env_value API_DOMAIN)"

  if [[ "$DEPLOY_TARGET_MODE" == "ip" ]]; then
    compose_args=(-f docker-compose.yml -f docker-compose.vps-ip.yml)
    log_services=(backend frontend)
    return
  fi

  if [[ -z "$DEPLOY_TARGET_MODE" && -z "$app_domain" && -z "$api_domain" ]]; then
    log "sem dominio configurado; usando fallback automatico para modo ip"
    DEPLOY_TARGET_MODE="ip"
    compose_args=(-f docker-compose.yml -f docker-compose.vps-ip.yml)
    log_services=(backend frontend)
    return
  fi

  DEPLOY_TARGET_MODE="domain"
  compose_args=(-f docker-compose.yml -f docker-compose.prod.yml)
  log_services=(caddy backend frontend)
}

show_logs_on_error() {
  log "deploy falhou; exibindo logs recentes"
  docker compose "${compose_args[@]}" logs --tail=80 "${log_services[@]}" || true
}

trap show_logs_on_error ERR

cd "$ROOT_DIR"

if [[ ! -f .env ]]; then
  log "arquivo .env nao encontrado em $ROOT_DIR"
  exit 1
fi

configure_deploy_mode

if ! command -v docker >/dev/null 2>&1; then
  log "docker nao encontrado na VPS"
  exit 1
fi

log "subindo stack (${DEPLOY_TARGET_MODE})"
docker compose "${compose_args[@]}" up --build -d --remove-orphans --wait --wait-timeout "$DEPLOY_WAIT_TIMEOUT"

if command -v curl >/dev/null 2>&1; then
  APP_DOMAIN="$(read_env_value APP_DOMAIN)"
  API_DOMAIN="$(read_env_value API_DOMAIN)"

  retry_http_check "frontend interno" curl -fsS http://127.0.0.1:3000/

  retry_http_check "backend interno" curl -fsS http://127.0.0.1:8000/health

  if [[ "$DEPLOY_TARGET_MODE" == "domain" && -n "${APP_DOMAIN:-}" ]]; then
    retry_http_check "proxy do frontend" \
      curl --fail --silent --show-error \
      --resolve "${APP_DOMAIN}:443:127.0.0.1" \
      "https://${APP_DOMAIN}/"
  fi

  if [[ "$DEPLOY_TARGET_MODE" == "domain" && -n "${API_DOMAIN:-}" ]]; then
    retry_http_check "proxy da API" \
      curl --fail --silent --show-error \
      --resolve "${API_DOMAIN}:443:127.0.0.1" \
      "https://${API_DOMAIN}/health"
  fi
else
  log "curl nao encontrado; pulando smoke tests HTTP"
fi

cat > .deploy-version <<EOF
DEPLOYED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DEPLOY_GIT_SHA=${DEPLOY_GIT_SHA:-unknown}
DEPLOY_GIT_REF=${DEPLOY_GIT_REF:-unknown}
EOF

log "status final"
docker compose "${compose_args[@]}" ps

log "deploy concluido"
