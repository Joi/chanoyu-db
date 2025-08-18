#!/bin/bash
set -euo pipefail

# Activate venv if present
if [ -f "/Users/joi/tea-utensil-db/.venv/bin/activate" ]; then
  source "/Users/joi/tea-utensil-db/.venv/bin/activate"
fi

# Export env vars (require caller to provide secrets)
if [ -z "${NOTION_TOKEN:-}" ] || [ -z "${NOTION_DATABASE_ID:-}" ] || [ -z "${GOOGLE_SHEETS_ID:-}" ]; then
  echo "Missing required envs. Set NOTION_TOKEN, NOTION_DATABASE_ID, GOOGLE_SHEETS_ID (and optionally GOOGLE_WORKSHEET_NAME, GOOGLE_OAUTH_TOKEN_PATH, OUTPUT_DIR, DUMP)." >&2
  exit 1
fi

# Optional runtime knobs (do not hardcode secrets here)
export OUTPUT_DIR="${OUTPUT_DIR:-data}"
export DUMP="${DUMP:-true}"

exec /Users/joi/tea-utensil-db/.venv/bin/python3 /Users/joi/tea-utensil-db/run_merge.py



