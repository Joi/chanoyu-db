## Tea Utensil Database – Notion + Google Sheets Merge

This repo provides a small Python tool to:
- Read a Notion database (names, properties, photos)
- Read a Google Sheets worksheet (prices)
- Merge the two datasets locally by item name
- Write JSON outputs to `data/` for inspection

Later we can add a richer UI, but this gets the data flowing first.

### Repo hygiene and privacy
- Keep secrets and local data out of git:
  - Put credentials in `/private/` and reference them via `.env`.
  - `.env` is git-ignored; commit only `.env.example`.
  - Outputs are written to `data/`; raw JSON there is git-ignored by default.
- Make the GitHub repo private (instructions below).

### Prerequisites
- Python 3.10+
- Notion internal integration token with access to your database
- Google Sheets credentials (service account JSON or local user tokens)

### Setup (Homebrew + venv)
1) Ensure Python and Git via Homebrew (optional if already installed):
```bash
brew update
brew install python git
```

2) Create and activate a virtual environment, then install deps:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -r requirements.txt
```

3) Configure environment:
```bash
cp .env.example .env
```
Fill in:
- `NOTION_TOKEN`: Notion integration token (starts with `secret_...`).
- `NOTION_DATABASE_ID`: Notion database ID (32-char in URL). Share database with the integration.
- `GOOGLE_SHEETS_ID`: Spreadsheet ID from the URL.
- `GOOGLE_SERVICE_ACCOUNT_JSON`: Path to Google credentials. You can use an existing local token dir like `~/.gmail`/`~/.gcalendar` by pointing to a JSON within `/private/` or directly to those files.
- `GOOGLE_WORKSHEET_NAME`: Optional; defaults to first sheet if blank.
- `OUTPUT_DIR`: Optional; defaults to `data`.

4) Google Sheets permissions
- If using a service account, share the spreadsheet with the service account email.
- If using local OAuth tokens, ensure the path points to valid token files.

5) Notion permissions
- Share the target database with your integration.

### Run the merge
```bash
source .venv/bin/activate
python main.py --dump
```

Outputs:
- `data/notion_raw.json`: Simplified dump of Notion items
- `data/sheets_raw.json`: Rows from Google Sheets
- `data/merged.json`: Merge results per Notion item with any matched price fields
- `data/merge_report.json`: Summary of matches and unmatched items

Notes:
- Notion file URLs are temporary signed URLs; they will expire. For a persistent local archive later, we can add a downloader.
- Merge currently uses normalized `name` matching. If names differ slightly, we can add a fuzzy matching step and/or a shared stable ID field.

### Make this a private GitHub repo
```bash
git init
git add .
git commit -m "Initial scaffold"
# Create a private repo on GitHub (requires gh CLI)
brew install gh # if not already installed
gh auth login --hostname github.com --web --scopes repo
gh repo create tea-utensil-db --private --source=. --remote=origin

git push -u origin main
```

### Project layout
- `/src`: Python modules
- `/data`: Local outputs (git-ignored)
- `/private`: Credentials and local-only assets (git-ignored)
- `.env`: Local environment variables (git-ignored)
- `requirements.txt`: Python dependencies


