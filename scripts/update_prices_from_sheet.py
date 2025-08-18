from __future__ import annotations

import os
import sys
import re
import json
import datetime as dt
from typing import Any, Dict, List, Optional, Tuple

import requests
from dotenv import load_dotenv

from src.notion_fetcher import NotionFetcher
from src.sheets_reader import SheetsReader
from src.sheets_writer import create_worksheet_and_write
from src.merge import (
    normalize_name,
    _extract_notion_property_value,
    _extract_token_from_value,
)


def parse_price_to_int_yen(raw: Any) -> Optional[int]:
    if raw is None:
        return None
    s = str(raw).strip()
    if not s:
        return None
    # Remove currency symbols and commas/spaces
    s = re.sub(r"[\s,￥¥]", "", s)
    # Remove trailing decimals if provided (treat as yen)
    if "." in s:
        s = s.split(".", 1)[0]
    if not s or not re.match(r"^-?\d+$", s):
        return None
    try:
        return int(s)
    except Exception:
        return None


def get_case_insensitive(row: Dict[str, Any], candidates: List[str]) -> Optional[Any]:
    lower_map = {str(k).lower(): k for k in row.keys()}
    for cand in candidates:
        k = lower_map.get(cand.lower())
        if k is not None:
            return row.get(k)
    return None


def notion_property(properties: Dict[str, Any], name: str) -> Optional[Dict[str, Any]]:
    if not properties:
        return None
    lower_map = {str(k).lower(): k for k in properties.keys()}
    k = lower_map.get(name.strip().lower())
    return properties.get(k) if k else None


def is_in_collection(properties: Dict[str, Any], prop_name: str) -> bool:
    prop = notion_property(properties, prop_name)
    if not prop or not isinstance(prop, dict):
        return False
    ptype = prop.get("type")
    if ptype == "checkbox":
        return bool(prop.get("checkbox"))
    if ptype == "select":
        name = (prop.get("select") or {}).get("name")
        return str(name).strip().lower() in {"in collection", "yes", "true"}
    if ptype == "multi_select":
        names = [str((s or {}).get("name") or "").strip().lower() for s in (prop.get("multi_select") or [])]
        return any(n in {"in collection", "collection", "yes", "true"} for n in names)
    if ptype == "rich_text":
        text = _extract_notion_property_value(properties, [prop_name])
        return str(text or "").strip().lower() in {"in collection", "yes", "true"}
    return False


def fetch_in_collection_items(notion_token: str, database_id: str, in_collection_prop: str) -> List[Dict[str, Any]]:
    fetcher = NotionFetcher(token=notion_token, database_id=database_id, include_block_image_fallback=False)
    items = fetcher.fetch_all()
    return [it for it in items if is_in_collection(it.get("properties") or {}, in_collection_prop)]


def extract_token_from_notion_item(item: Dict[str, Any], candidates: List[str]) -> Optional[str]:
    properties = item.get("properties") or {}
    # Try configured and common token-bearing properties
    url_or_token = _extract_notion_property_value(properties, candidates)
    token = _extract_token_from_value(url_or_token)
    return token


def build_merged_rows(
    notion_items: List[Dict[str, Any]],
    sheet_rows: List[Dict[str, Any]],
    sheet_name_candidates: List[str],
    sheet_price_candidates: List[str],
    sheet_token_candidates: Optional[List[str]] = None,
    notion_token_candidates: Optional[List[str]] = None,
    notion_local_id_candidates: Optional[List[str]] = None,
) -> Tuple[List[Dict[str, Any]], List[List[Any]]]:
    by_name: Dict[str, Dict[str, Any]] = {}
    for r in sheet_rows:
        name_val = get_case_insensitive(r, sheet_name_candidates)
        if name_val:
            by_name[normalize_name(str(name_val))] = r

    merged_records: List[Dict[str, Any]] = []
    output_rows: List[List[Any]] = []

    for it in notion_items:
        name = str(it.get("name") or "").strip()
        token = extract_token_from_notion_item(it, notion_token_candidates or [])
        # Capture local_number from Notion for later Supabase lookup fallback
        local_number = None
        if notion_local_id_candidates:
            try:
                local_number = _extract_notion_property_value(it.get("properties") or {}, notion_local_id_candidates)
            except Exception:
                local_number = None
        sheet_row = by_name.get(normalize_name(name))
        # Fallback: try to get token from the sheet row if Notion did not carry it
        if not token and sheet_row and sheet_token_candidates:
            token_val = get_case_insensitive(sheet_row, sheet_token_candidates)
            token = _extract_token_from_value(token_val)
        raw_price = get_case_insensitive(sheet_row or {}, sheet_price_candidates) if sheet_row else None
        price_yen = parse_price_to_int_yen(raw_price)
        merged_records.append({
            "name": name,
            "token": token,
            "local_number": local_number,
            "price_yen": price_yen,
            "sheet_price_raw": raw_price,
        })
        output_rows.append([
            token or "",
            name,
            price_yen if price_yen is not None else "",
        ])

    return merged_records, output_rows


def fetch_token_by_local_number(local_number: str) -> Optional[str]:
    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not supabase_url or not service_role_key:
        return None
    endpoint = f"{supabase_url}/rest/v1/objects"
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
    }
    try:
        r = requests.get(endpoint, params={"select": "token", "local_number": f"eq.{local_number}"}, headers=headers, timeout=15)
        if r.status_code != 200:
            return None
        arr = r.json()
        if isinstance(arr, list) and arr:
            tok = arr[0].get("token")
            return str(tok) if tok else None
    except Exception:
        return None
    return None


def update_supabase_prices(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not supabase_url or not service_role_key:
        raise SystemExit("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment")

    endpoint = f"{supabase_url}/rest/v1/objects"
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    updated = 0
    skipped_missing_token = 0
    skipped_missing_price = 0
    errors: List[str] = []

    for rec in records:
        token = rec.get("token")
        price = rec.get("price_yen")
        if not token:
            skipped_missing_token += 1
            continue
        if price is None:
            skipped_missing_price += 1
            continue
        params = {"token": f"eq.{token}"}
        try:
            r = requests.patch(endpoint, params=params, headers=headers, data=json.dumps({"price": price}), timeout=15)
            if r.status_code in (200, 204):
                updated += 1
            else:
                errors.append(f"token={token} status={r.status_code} body={r.text[:200]}")
        except Exception as e:
            errors.append(f"token={token} exc={e}")

    return {
        "updated": updated,
        "skipped_missing_token": skipped_missing_token,
        "skipped_missing_price": skipped_missing_price,
        "errors": errors,
    }


def main() -> None:
    load_dotenv(override=False)

    notion_token = os.getenv("NOTION_TOKEN", "")
    notion_db_id = os.getenv("NOTION_DATABASE_ID", "")
    if not notion_token or not notion_db_id:
        raise SystemExit("Missing NOTION_TOKEN or NOTION_DATABASE_ID in environment")

    gsheet_id = os.getenv("GOOGLE_SHEETS_ID", "")
    worksheet_name = os.getenv("GOOGLE_WORKSHEET_NAME") or None
    service_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON") or None
    oauth_token_path = os.getenv("GOOGLE_OAUTH_TOKEN_PATH") or None
    if not gsheet_id:
        raise SystemExit("Missing GOOGLE_SHEETS_ID in environment")

    in_collection_prop = os.getenv("NOTION_IN_COLLECTION_PROP", "In Collection")
    notion_token_prop = os.getenv("NOTION_TOKEN_PROP", "Collection Token")
    notion_url_prop = os.getenv("NOTION_URL_PROP", "Collection URL")
    notion_collection_id_prop = os.getenv("NOTION_COLLECTION_ID_PROP", "Collection ID")

    # Read source sheet rows
    reader = SheetsReader(
        spreadsheet_id=gsheet_id,
        worksheet_name=worksheet_name,
        service_account_json=service_json,
        oauth_token_path=oauth_token_path,
    )
    sheet_rows = reader.read_rows()

    # Fetch Notion items that are in collection
    notion_items = fetch_in_collection_items(notion_token, notion_db_id, in_collection_prop)

    # Build merged view
    name_keys = [s.strip() for s in (os.getenv("SHEET_NAME_FIELDS", "Name,name,title,Title").split(",")) if s.strip()]
    price_keys = [s.strip() for s in (os.getenv("SHEET_PRICE_FIELDS", "Price,price,Price (JPY)").split(",")) if s.strip()]
    sheet_token_keys = [s.strip() for s in (os.getenv("SHEET_TOKEN_FIELDS", "Token,token,Collection Token,Collection URL,Object URL,URL,Id URL,ID URL").split(",")) if s.strip()]
    notion_token_candidates = [
        notion_token_prop,
        notion_url_prop,
        "Object URL",
        "Token",
        "URL",
        "Object Url",
        "Id URL",
        "ID URL",
    ]
    merged_records, output_rows = build_merged_rows(
        notion_items,
        sheet_rows,
        name_keys,
        price_keys,
        sheet_token_candidates=sheet_token_keys,
        notion_token_candidates=notion_token_candidates,
        notion_local_id_candidates=[
            notion_collection_id_prop,
            "Local Number",
            "Local ID",
            "Collection Number",
            "Collection Id",
            "Inventory Number",
            "Inventory #",
        ],
    )

    # Resolve missing tokens via Supabase by local_number
    for rec in merged_records:
        if not rec.get("token") and rec.get("local_number"):
            tok = fetch_token_by_local_number(str(rec["local_number"]))
            if tok:
                rec["token"] = tok
    # Update output rows with any newly resolved tokens
    for i, rec in enumerate(merged_records):
        try:
            output_rows[i][0] = rec.get("token") or ""
        except Exception:
            pass

    # Write merged worksheet into the same spreadsheet
    title = os.getenv("MERGED_WORKSHEET_TITLE") or f"Merged Prices {dt.datetime.now().strftime('%Y%m%d-%H%M')}"
    header = ["Token", "Name", "Price (JPY)"]
    create_worksheet_and_write(
        spreadsheet_id=gsheet_id,
        title=title,
        header=header,
        rows=output_rows,
        service_account_json=service_json,
        oauth_token_path=oauth_token_path,
    )

    # Update Supabase prices
    result = update_supabase_prices(merged_records)
    print(json.dumps({
        "totals": {
            "notion_in_collection": len(notion_items),
            "sheet_rows": len(sheet_rows),
            "merged_records": len(merged_records),
        },
        "updates": result,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()


