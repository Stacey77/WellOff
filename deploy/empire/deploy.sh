#!/usr/bin/env bash
# Three-Way Empire — one-command deploy for Linux/macOS (Podman or Docker).
#   deploy/empire/deploy.sh            build, start, pull model, smoke test
#   deploy/empire/deploy.sh --no-model skip the model download
#   deploy/empire/deploy.sh --down     stop (volumes kept)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
ENV_FILE="$HERE/.env"
ENGINE="$(command -v podman || command -v docker || true)"
[ -n "$ENGINE" ] || { echo "Install podman or docker first" >&2; exit 1; }
compose() { "$ENGINE" compose -f "$HERE/compose.yml" --env-file "$ENV_FILE" "$@"; }

if [ "${1:-}" = "--down" ]; then compose down; exit 0; fi

if [ ! -f "$ENV_FILE" ]; then
  cp "$HERE/.env.example" "$ENV_FILE"
  KEY="op_$(head -c 32 /dev/urandom | base64 | tr -dc 'A-Za-z0-9')"
  sed -i.bak "s/^EMPIRE_ADMIN_KEY=.*/EMPIRE_ADMIN_KEY=$KEY/" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
  echo "==> Created deploy/empire/.env with a new operator key"
fi
set -a; . <(grep -E '^[A-Z_]+=' "$ENV_FILE" | sed 's/[[:space:]]*#.*//'); set +a
PORT="${EMPIRE_PORT:-8080}"

cd "$ROOT"
compose up -d --build empire ollama
[ "${1:-}" = "--no-model" ] || compose up -d ollama-pull

echo "==> Waiting for http://localhost:$PORT/health"
for _ in $(seq 60); do curl -fs "http://localhost:$PORT/health" >/dev/null && break; sleep 2; done
curl -fs "http://localhost:$PORT/health" >/dev/null || { "$ENGINE" logs --tail 50 empire-api; exit 1; }

"$ENGINE" exec -e EMPIRE_ADMIN_KEY="$EMPIRE_ADMIN_KEY" empire-api python /app/smoke_test.py http://127.0.0.1:8080
echo
echo "Running: http://localhost:$PORT/docs   operator key: $EMPIRE_ADMIN_KEY (X-API-Key)"
