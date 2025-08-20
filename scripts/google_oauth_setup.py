from __future__ import annotations

import os
import sys
from typing import Optional

from dotenv import load_dotenv
from google_auth_oauthlib.flow import InstalledAppFlow

# Request write access so we can create/update worksheets
SCOPES = [
	"https://www.googleapis.com/auth/spreadsheets",
]


def main() -> None:
	load_dotenv()
	client_secret = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET_JSON")
	# Fallback to ~/.googleauth/credentials.json if env not set
	if not client_secret:
		default_client_secret = os.path.expanduser("~/.googleauth/credentials.json")
		if os.path.isfile(default_client_secret):
			client_secret = default_client_secret
	if not client_secret or not os.path.isfile(os.path.expanduser(client_secret)):
		print("GOOGLE_OAUTH_CLIENT_SECRET_JSON is not set and ~/.googleauth/credentials.json not found.", file=sys.stderr)
		sys.exit(1)

	# Default to app-specific token directory to avoid scope collisions
	output_path = os.getenv("GOOGLE_OAUTH_TOKEN_PATH") or os.path.join("~/.googleauth/chanoyu-db", "authorized_user.json")
	output_path = os.path.expanduser(output_path)
	output_dir = os.path.dirname(output_path)
	os.makedirs(output_dir, exist_ok=True)

	flow = InstalledAppFlow.from_client_secrets_file(os.path.expanduser(client_secret), SCOPES)
	creds = flow.run_local_server(port=0, prompt="consent", access_type="offline")

	with open(output_path, "w", encoding="utf-8") as f:
		f.write(creds.to_json())

	print(f"Saved OAuth authorized user token to: {output_path}")


if __name__ == "__main__":
	main()
