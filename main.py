from __future__ import annotations

import argparse
import json
import os
from typing import Any, Dict, List

from dotenv import load_dotenv

from src.notion_fetcher import NotionFetcher
from src.sheets_reader import SheetsReader
from src.merge import merge_by_name


def ensure_dir(path: str) -> None:
	if not os.path.isdir(path):
		os.makedirs(path, exist_ok=True)


def write_json(path: str, data: Any) -> None:
	with open(path, "w", encoding="utf-8") as f:
		json.dump(data, f, ensure_ascii=False, indent=2)


def main() -> None:
	load_dotenv()

	parser = argparse.ArgumentParser(description="Merge Notion DB items with Google Sheets rows")
	parser.add_argument("--dump", action="store_true", help="Write raw and merged outputs to data/")
	args = parser.parse_args()

	notion_token = os.getenv("NOTION_TOKEN", "")
	notion_db_id = os.getenv("NOTION_DATABASE_ID", "")
	gsheet_id = os.getenv("GOOGLE_SHEETS_ID", "")
	worksheet_name = os.getenv("GOOGLE_WORKSHEET_NAME") or None
	service_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON") or None
	oauth_token_path = os.getenv("GOOGLE_OAUTH_TOKEN_PATH") or None
	output_dir = os.getenv("OUTPUT_DIR", "data")

	if not notion_token or not notion_db_id:
		raise SystemExit("Missing NOTION_TOKEN or NOTION_DATABASE_ID in .env")
	if not gsheet_id:
		raise SystemExit("Missing GOOGLE_SHEETS_ID in .env")

	ensure_dir(output_dir)

	# Fetch Notion items
	notion = NotionFetcher(token=notion_token, database_id=notion_db_id)
	notion_items = notion.fetch_all()

	# Read Google Sheets
	sheets = SheetsReader(
		spreadsheet_id=gsheet_id,
		worksheet_name=worksheet_name,
		service_account_json=service_json,
		oauth_token_path=oauth_token_path,
	)
	sheet_rows = sheets.read_rows()

	# Merge
	merged, report = merge_by_name(notion_items, sheet_rows)

	if args.dump:
		write_json(os.path.join(output_dir, "notion_raw.json"), notion_items)
		write_json(os.path.join(output_dir, "sheets_raw.json"), sheet_rows)
		write_json(os.path.join(output_dir, "merged.json"), merged)
		write_json(os.path.join(output_dir, "merge_report.json"), report)

	print(json.dumps(report, indent=2))


if __name__ == "__main__":
	main()
