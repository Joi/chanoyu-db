#!/bin/bash
set -euo pipefail

# Activate venv if present (prefer repo-local path; fallback to legacy path)
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$REPO_ROOT/.venv/bin/activate" ]; then
  # shellcheck disable=SC1091
  source "$REPO_ROOT/.venv/bin/activate"
elif [ -f "/Users/joi/tea-utensil-db/.venv/bin/activate" ]; then
  # legacy fallback for old machine path
  # shellcheck disable=SC1091
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

# Prefer repo-local interpreter; fallback to legacy path
if [ -x "$REPO_ROOT/.venv/bin/python3" ]; then
  exec "$REPO_ROOT/.venv/bin/python3" "$REPO_ROOT/run_merge.py"
elif [ -x "/Users/joi/tea-utensil-db/.venv/bin/python3" ]; then
  exec "/Users/joi/tea-utensil-db/.venv/bin/python3" "/Users/joi/tea-utensil-db/run_merge.py"
else
  echo "No Python interpreter found. Create a venv with: python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt" >&2
  exit 1
fi



