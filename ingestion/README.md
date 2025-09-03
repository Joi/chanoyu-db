# Ingestion (Python) — Notion + Google Sheets utilities

This directory contains the local-only ingestion utilities that fetch from Notion, merge with Google Sheets, and export merged datasets. These tools are operationally separate from the web app (Next.js on Vercel) but share the same Supabase database schema.

- Scope: one-off and scheduled local runs, not long-running services
- Ownership: data ops / maintainers with access to Notion and Sheets
- Security: uses local `.env` and local credentials; never commit secrets

## Boundaries in the monorepo

- Web app lives under `app/`, `lib/`, `components/` and deploys to Vercel
- Database schema and RLS live under `supabase/`
- Ingestion lives here under `ingestion/` and uses Python
- Cross-contract: migrations in `supabase/` define the shared schema; changes that affect ingestion and web should be coordinated in a single PR

## Setup

Prereqs (macOS/Homebrew examples):

```bash
brew install python git jq
python3 -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -r requirements.txt -r requirements-dev.txt
```

Recommended editor support: `pytest`, `black`/`ruff` (if configured), and `.venv` interpreter selected.

## Environment variables

Create an `.env` in the repo root (or set env vars in your shell) with only the variables required for local ingestion. Don’t reuse the web `.env.local` — keep secrets separate.

- Notion
  - `NOTION_TOKEN`
  - `NOTION_DATABASE_ID` (or `NOTION_DB_ID`)
- Google Sheets
  - Service account (preferred):
    - `GOOGLE_SERVICE_ACCOUNT_JSON=/absolute/path/to/service_account.json`
    - Share your sheet with the service account email
  - User OAuth (alternative):
    - `GOOGLE_OAUTH_TOKEN_PATH=/absolute/path/to/authorized_user.json`
    - Optional helper: `python scripts/google_oauth_setup.py`
  - Sheet selection:
    - `GOOGLE_SHEETS_ID` (ID or full URL)
    - `GOOGLE_WORKSHEET_NAME` (e.g., `Odogu Prices`)
- Output directory: `OUTPUT_DIR=data`

Supabase access for scripts that write to the DB (if applicable):

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; do not expose in client code)

Store secrets outside the repo where possible (e.g., `~/.googleauth/chanoyu-db/`).

## Common commands

```bash
# activate venv
source .venv/bin/activate

# run the main merge (Notion + Sheets → JSON dumps under data/)
python main.py --dump

# export a merged worksheet with images
EXPORT_WORKSHEET_TITLE="Merged + Images" python scripts/export_to_sheet.py

# clone Supabase tables locally (read-only utility)
python scripts/clone-supabase-data.ts  # (TypeScript; see scripts/)
```

## Coordination with the web app

- Keep ingestion changes and DB migrations in the same PR when they are coupled
- Add lightweight fixtures (JSON outputs) to `data/` for quick review when helpful
- If a migration breaks ingestion or web queries, update both stacks together

## CI suggestions (path filtering)

In a monorepo, run only what changed:

- If `ingestion/**` or `requirements*.txt` changed → run Python tests/linters
- If `app/**`, `lib/**`, or `components/**` changed → run Node typecheck/lint/tests
- If `supabase/**` changed → run SQL checks and minimal integration tests for both stacks

See `docs/CI_MONOREPO.md` for examples.
