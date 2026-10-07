#!/usr/bin/env sh
# MoneyTrack — reset local PostgreSQL schema
#
# Usage (from repo root or server/):
#   sh server/restore.sh
#
# Docker:
#   docker compose exec -T postgres \
#     env PGPASSWORD="$DB_PASSWORD" \
#     psql -U postgres -d moneytrack -f /docker-entrypoint-initdb.d/01_schema.sql
#
# Env (defaults match server/.env):
#   DB_HOST DB_PORT DB_USER DB_NAME DB_PASSWORD
#   CONFIRM=yes   skip interactive prompt

set -e

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

# Load server/.env if present (skips comments / blank lines)
if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$SCRIPT_DIR/.env"
  set +a
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-moneytrack}"
DB_PASSWORD="${DB_PASSWORD:-}"
SCHEMA_FILE="${SCHEMA_FILE:-$SCRIPT_DIR/db/schema.sql}"
CONFIRM="${CONFIRM:-}"

info() { echo "[INFO] $1"; }
warn() { echo "[WARN] $1"; }
die()  { echo "[ERROR] $1" >&2; exit 1; }

command -v psql >/dev/null 2>&1 || die "psql not found. Install PostgreSQL client tools, or run via Docker (see header)."

[ -f "$SCHEMA_FILE" ] || die "Schema not found: $SCHEMA_FILE"
[ -n "$DB_PASSWORD" ] || die "DB_PASSWORD is empty. Set it in server/.env or the environment."

export PGPASSWORD="$DB_PASSWORD"

PSQL="psql -h $DB_HOST -p $DB_PORT -U $DB_USER"

info "Target: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
info "Schema: $SCHEMA_FILE"

if [ "$CONFIRM" != "yes" ]; then
  printf "This will DROP and recreate database '%s'. Continue? (yes/no): " "$DB_NAME"
  read -r ANSWER
  [ "$ANSWER" = "yes" ] || { warn "Aborted."; exit 0; }
fi

info "Terminating open connections..."
$PSQL -d postgres -v ON_ERROR_STOP=1 -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" \
  >/dev/null 2>&1 || true

info "Dropping database (if exists)..."
$PSQL -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"

info "Creating database..."
$PSQL -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"$DB_NAME\" OWNER \"$DB_USER\";"

info "Applying MoneyTrack schema..."
$PSQL -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$SCHEMA_FILE"

info "Tables:"
$PSQL -d "$DB_NAME" -c "\dt"

info "Restore complete."
info "Optional seed:  cd server && npm run seed"
