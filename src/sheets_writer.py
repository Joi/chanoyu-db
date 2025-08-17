from __future__ import annotations

import os
from typing import List, Sequence

import gspread
from google.oauth2.service_account import Credentials as ServiceAccountCredentials
from google.oauth2.credentials import Credentials as UserCredentials

SCOPES_WRITE = [
	"https://www.googleapis.com/auth/spreadsheets",
]


def _load_gspread_client_write(service_account_json: str | None, oauth_token_path: str | None) -> gspread.Client:
	if service_account_json and os.path.exists(os.path.expanduser(service_account_json)):
		creds = ServiceAccountCredentials.from_service_account_file(os.path.expanduser(service_account_json), scopes=SCOPES_WRITE)
		return gspread.authorize(creds)
	if oauth_token_path and os.path.exists(os.path.expanduser(oauth_token_path)):
		creds = UserCredentials.from_authorized_user_file(os.path.expanduser(oauth_token_path), scopes=SCOPES_WRITE)
		return gspread.authorize(creds)
	return gspread.oauth()


def create_worksheet_and_write(
	spreadsheet_id: str,
	title: str,
	header: Sequence[str],
	rows: Sequence[Sequence[str | int | float | None]],
	service_account_json: str | None,
	oauth_token_path: str | None,
) -> None:
	client = _load_gspread_client_write(service_account_json, oauth_token_path)
	sh = client.open_by_key(spreadsheet_id)
	cols = max(len(header), *(len(r) for r in rows)) if rows else len(header)
	rows_count = max(1, len(rows) + 10)
	ws = sh.add_worksheet(title=title, rows=rows_count, cols=cols or 1)
	values: List[List[object]] = [list(header)] + [list(r) for r in rows]
	ws.update("A1", values, value_input_option="USER_ENTERED")
