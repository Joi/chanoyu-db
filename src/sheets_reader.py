from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

import gspread
from google.oauth2.service_account import Credentials as ServiceAccountCredentials
from google.oauth2.credentials import Credentials as UserCredentials


SCOPES = [
	"https://www.googleapis.com/auth/spreadsheets.readonly",
]


def _find_oauth_token_path(path_hint: Optional[str]) -> Optional[str]:
	if not path_hint:
		return None
	expanded = os.path.expanduser(path_hint)
	if os.path.isfile(expanded):
		return expanded
	if os.path.isdir(expanded):
		for candidate in ("token.json", "authorized_user.json"):
			cand_path = os.path.join(expanded, candidate)
			if os.path.isfile(cand_path):
				return cand_path
	return None


def _load_gspread_client(service_account_json: Optional[str], oauth_token_path: Optional[str]) -> gspread.Client:
	# Prefer service account if provided
	if service_account_json and os.path.exists(os.path.expanduser(service_account_json)):
		creds = ServiceAccountCredentials.from_service_account_file(os.path.expanduser(service_account_json), scopes=SCOPES)
		return gspread.authorize(creds)

	# Otherwise try authorized user token path
	token_path = _find_oauth_token_path(oauth_token_path)
	if token_path:
		creds = UserCredentials.from_authorized_user_file(token_path, scopes=SCOPES)
		return gspread.authorize(creds)

	# Fallback to gspread's default OAuth (may prompt if not configured)
	return gspread.oauth()


class SheetsReader:
	def __init__(self, spreadsheet_id: str, worksheet_name: Optional[str], service_account_json: Optional[str], oauth_token_path: Optional[str]) -> None:
		self.spreadsheet_id = spreadsheet_id
		self.worksheet_name = worksheet_name
		self.service_account_json = service_account_json
		self.oauth_token_path = oauth_token_path
		self.client = _load_gspread_client(service_account_json, oauth_token_path)

	def read_rows(self) -> List[Dict[str, Any]]:
		sh = self.client.open_by_key(self.spreadsheet_id)
		ws = sh.worksheet(self.worksheet_name) if self.worksheet_name else sh.sheet1
		rows = ws.get_all_records()
		return rows
