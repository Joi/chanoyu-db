from __future__ import annotations

import os
from typing import Any, Dict, List, Optional
import json
def _sanitize_path(path_str: Optional[str]) -> Optional[str]:
	if not path_str:
		return None
	# Trim whitespace and surrounding quotes
	clean = str(path_str).strip().strip('"').strip("'")
	if not clean:
		return None
	return os.path.expanduser(clean)


import gspread
from google.oauth2.service_account import Credentials as ServiceAccountCredentials
from google.oauth2.credentials import Credentials as UserCredentials


SCOPES = [
	"https://www.googleapis.com/auth/spreadsheets.readonly",
]


def _find_oauth_token_path(path_hint: Optional[str]) -> Optional[str]:
	def search_in(directory: str) -> Optional[str]:
		expanded_dir = os.path.expanduser(directory)
		if os.path.isfile(expanded_dir):
			return expanded_dir
		if os.path.isdir(expanded_dir):
			for candidate in ("token.json", "authorized_user.json"):
				cand_path = os.path.join(expanded_dir, candidate)
				if os.path.isfile(cand_path):
					return cand_path
		return None

	# 1) Try provided hint
	if path_hint:
		found = search_in(path_hint)
		if found:
			return found

	# 2) App-specific default location, then common fallbacks used by gspread
	for fallback in ("~/.googleauth/chanoyu-db", "~/.googleauth/tea-utensil-db", "~/.gcalendar", "~/.config/gspread"):
		found = search_in(fallback)
		if found:
			return found

	return None


def _load_gspread_client(service_account_json: Optional[str], oauth_token_path: Optional[str]) -> gspread.Client:
	# Prefer service account if provided
	sa_path = _sanitize_path(service_account_json)
	if sa_path and os.path.exists(sa_path):
		creds = ServiceAccountCredentials.from_service_account_file(sa_path, scopes=SCOPES)
		return gspread.authorize(creds)

	# Otherwise try authorized user token path
	token_path = _find_oauth_token_path(_sanitize_path(oauth_token_path))
	if token_path:
		# Determine scopes: prefer those embedded in the token to avoid invalid_scope
		token_scopes: Optional[List[str]] = None
		try:
			with open(token_path, "r", encoding="utf-8") as f:
				info = json.load(f)
				scopes_val = info.get("scopes")
				if isinstance(scopes_val, list):
					token_scopes = [str(s) for s in scopes_val if s]
				elif isinstance(scopes_val, str) and scopes_val.strip():
					token_scopes = [s for s in scopes_val.split() if s]
		except Exception:
			pass

		try:
			# Try direct load; if token contains scopes, let the library use them by passing None
			creds = UserCredentials.from_authorized_user_file(token_path, scopes=None if token_scopes else SCOPES)
			return gspread.authorize(creds)
		except Exception:
			# token.json may not include client_id/client_secret; attempt to merge with credentials.json
			try:
				with open(token_path, "r", encoding="utf-8") as f:
					auth_info = json.load(f)
				dirname = os.path.dirname(os.path.expanduser(token_path))
				cred_path = os.path.join(dirname, "credentials.json")
				if os.path.isfile(cred_path):
					with open(cred_path, "r", encoding="utf-8") as cf:
						client_cfg = json.load(cf)
					# Google client secret file may be under "installed" or "web"
					client_section = client_cfg.get("installed") or client_cfg.get("web") or {}
					client_id = client_section.get("client_id")
					client_secret = client_section.get("client_secret")
					if client_id and client_secret:
						auth_info.setdefault("client_id", client_id)
						auth_info.setdefault("client_secret", client_secret)
						creds = UserCredentials.from_authorized_user_info(auth_info, scopes=None if token_scopes else SCOPES)
						return gspread.authorize(creds)
			except Exception:
				pass

	# Do not try interactive OAuth prompts in headless usage; raise a clear error
	raise RuntimeError(
		"No Google Sheets credentials found. Set GOOGLE_SERVICE_ACCOUNT_JSON (recommended) "
		"or GOOGLE_OAUTH_TOKEN_PATH to a valid authorized_user.json. Also accepts ~/.gcalendar or ~/.config/gspread."
	)


class SheetsReader:
	def __init__(self, spreadsheet_id: str, worksheet_name: Optional[str], service_account_json: Optional[str], oauth_token_path: Optional[str]) -> None:
		self.spreadsheet_id = self._normalize_spreadsheet_id(spreadsheet_id)
		self.worksheet_name = worksheet_name
		self.service_account_json = service_account_json
		self.oauth_token_path = oauth_token_path
		self.client = _load_gspread_client(service_account_json, oauth_token_path)

	@staticmethod
	def _normalize_spreadsheet_id(spreadsheet_id: str) -> str:
		sid = (spreadsheet_id or "").strip()
		# Accept full URL and extract the ID between /d/ and the next /
		if "/spreadsheets/d/" in sid:
			try:
				after = sid.split("/spreadsheets/d/", 1)[1]
				sid = after.split("/", 1)[0]
			except Exception:
				pass
		# Strip any trailing path or query/hash
		if "/" in sid:
			sid = sid.split("/", 1)[0]
		if "?" in sid:
			sid = sid.split("?", 1)[0]
		if "#" in sid:
			sid = sid.split("#", 1)[0]
		return sid

	def read_rows(self) -> List[Dict[str, Any]]:
		sh = self.client.open_by_key(self.spreadsheet_id)
		ws = sh.worksheet(self.worksheet_name) if self.worksheet_name else sh.sheet1
		rows = ws.get_all_records()
		return rows
