from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from typing import Any, Dict, List

# Ensure project root is on sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, os.pardir))
if PROJECT_ROOT not in sys.path:
	sys.path.insert(0, PROJECT_ROOT)

from dotenv import load_dotenv

from src.sheets_writer import create_worksheet_and_write


def main() -> None:
	load_dotenv(override=True)
	spreadsheet_id = os.getenv("GOOGLE_SHEETS_ID", "")
	worksheet_title = os.getenv("EXPORT_WORKSHEET_TITLE") or f"Merged {datetime.now().strftime('%Y-%m-%d %H:%M')}"
	service_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON") or None
	oauth_token_path = os.getenv("GOOGLE_OAUTH_TOKEN_PATH") or None
	output_dir = os.getenv("OUTPUT_DIR", "data")

	if not spreadsheet_id:
		print("GOOGLE_SHEETS_ID missing in .env", file=sys.stderr)
		sys.exit(1)

	merged_path = os.path.join(output_dir, "merged.json")
	if not os.path.isfile(merged_path):
		print(f"{merged_path} not found. Run main.py --dump first.", file=sys.stderr)
		sys.exit(1)

	with open(merged_path, "r", encoding="utf-8") as f:
		merged: List[Dict[str, Any]] = json.load(f)

	# Columns with image formula
	header = [
		"Image",
		"Name",
		"Price",
		"Currency",
		"Store",
		"Notion URL",
	]
	rows: List[List[Any]] = []
	for entry in merged:
		name = entry.get("name")
		sheet = entry.get("sheet") or {}
		notion = entry.get("notion") or {}
		price = sheet.get("Price") or sheet.get("price")
		currency = sheet.get("Currency") or sheet.get("currency")
		store = sheet.get("Store") or sheet.get("store")
		notion_url = notion.get("url")
		image_url = notion.get("first_image_url")
		image_cell = f'=IMAGE("{image_url}")' if image_url else ""
		rows.append([image_cell, name, price, currency, store, notion_url])

	create_worksheet_and_write(
		spreadsheet_id=spreadsheet_id,
		title=worksheet_title,
		header=header,
		rows=rows,
		service_account_json=service_json,
		oauth_token_path=oauth_token_path,
	)

	print(f"Exported {len(rows)} rows to new worksheet '{worksheet_title}'.")


if __name__ == "__main__":
	main()
