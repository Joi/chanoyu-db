from __future__ import annotations

import os
import sys
import json
import urllib.parse
from typing import Any, Dict, List, Optional, Tuple

# Ensure project root is on sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, os.pardir))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import requests
from dotenv import load_dotenv

from src.sheets_writer import _load_gspread_client_write, _extract_spreadsheet_id_from_input
from rapidfuzz import fuzz, process


def _normalize_name(value: str | None) -> str:
    return (value or "").strip()


def _canonicalize_for_match(value: str | None) -> str:
    if not value:
        return ""
    s = str(value)
    # Lowercase, strip whitespace, remove common punctuation and brackets
    s = s.lower().strip()
    # Replace various brackets with spaces
    for ch in ["（", "）", "(", ")", "[", "]", "{", "}"]:
        s = s.replace(ch, " ")
    # Normalize separators
    for ch in ["・", "／", "/", "\\", "｜", "|", ":", ";", ",", "。", "、", "·", "-", "—", "–"]:
        s = s.replace(ch, " ")
    # Collapse whitespace
    s = " ".join(s.split())
    return s


def _build_or_filter_for_name(name: str) -> str:
    # PostgREST or= group with title and title_ja equality tries first
    # We'll URL-encode the name later
    return f"or=(title.eq.{name},title_ja.eq.{name})"


def _build_or_filter_for_name_ilike(name: str) -> str:
    # Fallback: ilike with exact string (not anchored). As a compromise, use %name% but
    # we will verify exact match client-side before accepting.
    like = f"%{name}%"
    return f"or=(title.ilike.{like},title_ja.ilike.{like})"


def _postgrest_get(
    base_url: str,
    resource: str,
    headers: Dict[str, str],
    params: Dict[str, str],
) -> Tuple[int, Any]:
    url = f"{base_url}/rest/v1/{resource}"
    # Encode params carefully to preserve PostgREST operators
    encoded_params = {}
    for k, v in params.items():
        if k == "or":
            # do not percent-encode parentheses and commas
            encoded_params[k] = v
        else:
            encoded_params[k] = v
    r = requests.get(url, headers=headers, params=encoded_params, timeout=20)
    try:
        data = r.json()
    except Exception:
        data = r.text
    return r.status_code, data


def find_token_by_name(supabase_url: str, service_role_key: str, name: str) -> Optional[str]:
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
    }
    clean = _normalize_name(name)
    if not clean:
        return None

    # 1) Exact match (case-sensitive) on title or title_ja
    status, data = _postgrest_get(
        supabase_url,
        "objects",
        headers,
        {
            "select": "token,title,title_ja",
            "or": _build_or_filter_for_name(clean),
        },
    )
    candidates: List[Dict[str, Any]] = data if (status == 200 and isinstance(data, list)) else []
    # Prefer exact match (normalized to strip spaces) on either title or title_ja
    exact_normal = clean.lower()
    for row in candidates:
        t = str((row or {}).get("title") or "").strip().lower()
        tj = str((row or {}).get("title_ja") or "").strip().lower()
        if t == exact_normal or tj == exact_normal:
            tok = (row or {}).get("token")
            return str(tok) if tok else None

    # 2) Case-insensitive contains search, then pick exact-normalized match client-side
    status, data = _postgrest_get(
        supabase_url,
        "objects",
        headers,
        {
            "select": "token,title,title_ja",
            "or": _build_or_filter_for_name_ilike(clean),
        },
    )
    candidates = data if (status == 200 and isinstance(data, list)) else []
    # First try exact normalized match
    for row in candidates:
        t = str((row or {}).get("title") or "").strip().lower()
        tj = str((row or {}).get("title_ja") or "").strip().lower()
        if t == exact_normal or tj == exact_normal:
            tok = (row or {}).get("token")
            if tok:
                return str(tok)
    # Else if a single candidate, accept it
    if len(candidates) == 1:
        tok = (candidates[0] or {}).get("token")
        return str(tok) if tok else None
    return None


def fetch_all_objects(supabase_url: str, service_role_key: str) -> List[Dict[str, Any]]:
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
    }
    status, data = _postgrest_get(
        supabase_url,
        "objects",
        headers,
        {
            "select": "token,title,title_ja",
            "limit": "20000",
        },
    )
    if status == 200 and isinstance(data, list):
        return data
    return []


def load_worksheet(spreadsheet_id: str, worksheet_name: str):
    # Use write-capable client
    client = _load_gspread_client_write(
        os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON") or None,
        os.getenv("GOOGLE_OAUTH_TOKEN_PATH") or None,
    )
    sid = _extract_spreadsheet_id_from_input(spreadsheet_id)
    sh = client.open_by_key(sid)
    try:
        ws = sh.worksheet(worksheet_name)
    except Exception:
        # Fallback to exact title search
        ws = next((w for w in sh.worksheets() if w.title == worksheet_name), None)
        if ws is None:
            raise SystemExit(f"Worksheet '{worksheet_name}' not found in spreadsheet {sid}")
    return ws


def update_tokens_in_sheet(ws, supabase_url: str, service_role_key: str) -> Dict[str, Any]:
    # Read all values
    values: List[List[Any]] = ws.get_all_values()
    if not values:
        return {"rows": 0, "updated": 0}
    header = values[0]
    # Find column indices (1-based for gspread)
    def find_col_index(names: List[str]) -> Optional[int]:
        lower_map = {str(h).strip().lower(): i for i, h in enumerate(header, start=1)}
        for cand in names:
            idx = lower_map.get(cand.strip().lower())
            if idx is not None:
                return idx
        return None

    token_col = find_col_index(["Token", "token"]) or 1
    name_col = find_col_index(["Name", "name", "Title", "title"]) or 2

    updates: List[Tuple[int, int, str]] = []  # (row, col, token)
    checked = 0
    found = 0

    # Prepare fuzzy index from all objects to improve hit rate
    all_objects = fetch_all_objects(supabase_url, service_role_key)
    # Build candidates list and a mapping from candidate string back to row idxs
    candidate_strings: List[str] = []
    candidate_to_tokens: Dict[str, List[str]] = {}
    for obj in all_objects:
        t = _canonicalize_for_match(obj.get("title"))
        tj = _canonicalize_for_match(obj.get("title_ja"))
        tok = str((obj or {}).get("token") or "")
        for s in [t, tj]:
            if not s:
                continue
            candidate_strings.append(s)
            candidate_to_tokens.setdefault(s, [])
            if tok:
                candidate_to_tokens[s].append(tok)

    # Iterate rows starting from row 2
    for r_idx in range(2, len(values) + 1):
        row = values[r_idx - 1]
        # Safeguard row length
        def safe_get(arr: List[Any], index1: int) -> str:
            return str(arr[index1 - 1]) if 1 <= index1 <= len(arr) else ""

        current_token = _normalize_name(safe_get(row, token_col))
        name = _normalize_name(safe_get(row, name_col))
        if not name:
            continue
        checked += 1
        if current_token:
            continue
        # First try direct API exact/contains
        tok = find_token_by_name(supabase_url, service_role_key, name)
        if not tok and candidate_strings:
            # Fuzzy search over canonicalized names
            target = _canonicalize_for_match(name)
            if target:
                best = process.extractOne(target, candidate_strings, scorer=fuzz.WRatio)
                if best:
                    best_str, best_score = best[0], best[1]
                    # Confidence threshold
                    if best_score >= 92:
                        toks = candidate_to_tokens.get(best_str) or []
                        if len(toks) == 1:
                            tok = toks[0]
        if tok:
            updates.append((r_idx, token_col, tok))
            found += 1

    # Apply updates in batches to reduce API calls
    # Use gspread batch_update with A1 notations
    if updates:
        data = []
        for (r, c, tok) in updates:
            a1 = gspread.utils.rowcol_to_a1(r, c)  # type: ignore
            data.append({"range": a1, "values": [[tok]]})
        # Use worksheet-level batch_update for value ranges
        ws.batch_update(data, value_input_option="USER_ENTERED")

    return {"rows": len(values) - 1, "checked": checked, "updated": found}


def main() -> None:
    load_dotenv(override=True)

    spreadsheet_id = os.getenv("GOOGLE_SHEETS_ID", "").strip()
    if not spreadsheet_id:
        raise SystemExit("Missing GOOGLE_SHEETS_ID in environment")

    worksheet_name = os.getenv("TARGET_WORKSHEET_NAME", "Merged Prices 20250818-1818")

    supabase_url = (os.getenv("NEXT_PUBLIC_SUPABASE_URL", "") or os.getenv("SUPABASE_URL", "")).rstrip("/")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not supabase_url or not service_role_key:
        raise SystemExit("Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY in environment")

    ws = load_worksheet(spreadsheet_id, worksheet_name)
    result = update_tokens_in_sheet(ws, supabase_url, service_role_key)
    print(json.dumps({"worksheet": worksheet_name, "result": result}, ensure_ascii=False))


if __name__ == "__main__":
    # Lazy import for utils used only at runtime
    import gspread  # noqa: F401
    main()


