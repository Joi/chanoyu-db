#!/bin/bash
set -euo pipefail

# Activate venv if present
if [ -f "/Users/joi/tea-utensil-db/.venv/bin/activate" ]; then
  source "/Users/joi/tea-utensil-db/.venv/bin/activate"
fi

# Export env vars (override if already set)
export NOTION_TOKEN="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"
export NOTION_DATABASE_ID="6f00be82b99445d2a1f7123441d9fcf5"
export GOOGLE_SHEETS_ID="1zcbd_az-PZG4zSr_E1g0rOy6P8k7BT0W8J08FgoBwqM"
export GOOGLE_WORKSHEET_NAME="Odogu Prices"
export GOOGLE_OAUTH_TOKEN_PATH="$HOME/.gcalendar"
export OUTPUT_DIR="data"
export DUMP="true"

exec /Users/joi/tea-utensil-db/.venv/bin/python3 /Users/joi/tea-utensil-db/run_merge.py



