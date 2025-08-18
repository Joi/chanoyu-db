## Environment setup (TypeScript + Python)

This repo runs both a Next.js app (TypeScript) and utility scripts (Python). The following conventions keep both stacks healthy and reproducible.

### Prerequisites (via Homebrew)

- Node.js LTS and pnpm
  - `brew install node pnpm`
  - or manage with `nvm`/`asdf` if you prefer
- Python 3.10+ and virtualenv tooling
  - `brew install python@3.10`

### Node/TS

- Install deps: `pnpm i` (or `npm i`)
- Run dev server: `pnpm dev`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`
- Tests: `pnpm test`

### Python

- Create venv: `python3 -m venv .venv`
- Activate: `source .venv/bin/activate`
- Install deps: `pip install -r requirements.txt -r requirements-dev.txt`
- Run tests: `pytest -q`

### Environment variables

Copy `.env.example` to `.env` and fill in values:

- Notion
  - `NOTION_TOKEN`
  - `NOTION_DATABASE_ID`
- Google Sheets
  - Preferred: Service account JSON
    - `GOOGLE_SERVICE_ACCOUNT_JSON=/absolute/path/to/service_account.json`
    - Share your sheet with the service account email in that file
  - Or: User OAuth token
    - `GOOGLE_OAUTH_TOKEN_PATH=/absolute/path/to/authorized_user.json`
    - To mint one: `python3 scripts/google_oauth_setup.py` (requires `GOOGLE_OAUTH_CLIENT_SECRET_JSON`)
  - Sheet selection
    - `GOOGLE_SHEETS_ID` (accepts either the bare spreadsheet ID or a full Google Sheets URL)
    - `GOOGLE_WORKSHEET_NAME` (e.g., `Odogu Prices`)
- Output directory for dumps: `OUTPUT_DIR=data`

Notes:
- The Python Sheets loader first tries `GOOGLE_SERVICE_ACCOUNT_JSON`. If not present, it tries `GOOGLE_OAUTH_TOKEN_PATH`. As fallbacks, it will look under `~/.gcalendar` and `~/.config/gspread` for `token.json` or `authorized_user.json`.
- Interactive prompts are disabled in non-interactive contexts; missing credentials will raise a clear error with instructions.

### One-liners

- Bootstrap both stacks (venv + node deps): `make bootstrap`
- Run all tests: `make test`
- Generate merged data from Notion + Sheets: `make merge`



