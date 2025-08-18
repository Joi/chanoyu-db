from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

from rapidfuzz import fuzz, process


def normalize_name(name: str) -> str:
	return (name or "").strip().lower()


def index_rows_by_name(rows: List[Dict[str, Any]], name_key_candidates: List[str]) -> Dict[str, Dict[str, Any]]:
	index: Dict[str, Dict[str, Any]] = {}
	lower_candidates = [c.lower() for c in name_key_candidates]
	for row in rows:
		# Build a case-insensitive view of the row keys
		lower_key_to_key: Dict[str, str] = {str(k).lower(): k for k in row.keys()}
		name_value: Optional[str] = None
		for lower_cand in lower_candidates:
			if lower_cand in lower_key_to_key:
				orig_key = lower_key_to_key[lower_cand]
				val = row.get(orig_key)
				if val:
					name_value = str(val)
					break
		if not name_value:
			continue
		index[normalize_name(name_value)] = row
	return index


def merge_by_name(
	notion_items: List[Dict[str, Any]],
	sheet_rows: List[Dict[str, Any]],
	row_name_keys: List[str] = ["Name", "name", "item", "title"],
	fuzzy_threshold: int = 92,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
	index = index_rows_by_name(sheet_rows, row_name_keys)

	merged: List[Dict[str, Any]] = []
	matched = 0
	fuzzy_matched = 0
	unmatched_items: List[Dict[str, Any]] = []

	all_sheet_names = list(index.keys())

	for item in notion_items:
		item_name = normalize_name(item.get("name", ""))
		row: Optional[Dict[str, Any]] = None
		match_kind = "none"

		if item_name and item_name in index:
			row = index[item_name]
			match_kind = "exact"
		else:
			if item_name and all_sheet_names:
				best = process.extractOne(item_name, all_sheet_names, scorer=fuzz.WRatio)
				if best and best[1] >= fuzzy_threshold:
					row = index.get(best[0])
					match_kind = "fuzzy"

		if row:
			if match_kind == "exact":
				matched += 1
			else:
				fuzzy_matched += 1
			merged.append({
				"name": item.get("name"),
				"notion": item,
				"sheet": row,
				"match_kind": match_kind,
			})
		else:
			unmatched_items.append(item)
			merged.append({
				"name": item.get("name"),
				"notion": item,
				"sheet": None,
				"match_kind": "none",
			})

	report = {
		"totals": {
			"notion_items": len(notion_items),
			"sheet_rows": len(sheet_rows),
			"matched_exact": matched,
			"matched_fuzzy": fuzzy_matched,
			"unmatched": len(unmatched_items),
		},
		"unmatched_items": [i.get("name") for i in unmatched_items],
	}

	return merged, report


# --- Identifier-based merge (collection token and local id) ---

def _lower_key_map(row: Dict[str, Any]) -> Dict[str, str]:
	return {str(k).lower(): k for k in row.keys()}


def _get_row_value_case_insensitive(row: Dict[str, Any], key_candidates: List[str]) -> Optional[str]:
	if not row:
		return None
	lower_map = _lower_key_map(row)
	for cand in key_candidates:
		orig = lower_map.get(cand.lower())
		if orig is not None:
			val = row.get(orig)
			if val is not None and str(val).strip() != "":
				return str(val).strip()
	return None


def _extract_token_from_value(value: Optional[str]) -> Optional[str]:
	if not value:
		return None
	raw = value.strip()
	if not raw:
		return None
	# If it's an URL, try to parse `/id/{token}` or `/ark:/NAAN/{name}` (use {name} as token fallback)
	lower = raw.lower()
	if lower.startswith("http://") or lower.startswith("https://"):
		# Prefer /id/{token}
		if "/id/" in lower:
			try:
				after = lower.split("/id/", 1)[1]
				token = after.split("?", 1)[0].split("#", 1)[0].strip("/")
				return token or None
			except Exception:
				pass
		# Fallback: ARK path
		if "/ark:/" in lower:
			try:
				after = lower.split("/ark:/", 1)[1]
				# {naan}/{name}
				parts = after.split("/", 1)
				if len(parts) == 2:
					name = parts[1]
					name = name.split("?", 1)[0].split("#", 1)[0].strip("/")
					return name or None
			except Exception:
				pass
		return None
	# Otherwise assume it might already be a token-like string
	return raw


def _extract_notion_text_from_property(prop: Dict[str, Any]) -> Optional[str]:
	if not prop or not isinstance(prop, dict):
		return None
	ptype = prop.get("type")
	if ptype == "url":
		val = prop.get("url")
		return str(val).strip() if val else None
	if ptype == "rich_text":
		parts: List[str] = []
		for rt in prop.get("rich_text", []) or []:
			text = (rt or {}).get("plain_text") or ""
			if text:
				parts.append(text)
		joined = "".join(parts).strip()
		return joined or None
	if ptype == "title":
		parts: List[str] = []
		for rt in prop.get("title", []) or []:
			text = (rt or {}).get("plain_text") or ""
			if text:
				parts.append(text)
		joined = "".join(parts).strip()
		return joined or None
	if ptype == "number":
		num = prop.get("number")
		return str(num).strip() if num is not None else None
	if ptype == "select":
		name = (prop.get("select") or {}).get("name")
		return str(name).strip() if name else None
	if ptype == "multi_select":
		names = [s.get("name") for s in (prop.get("multi_select") or [])]
		names = [str(n).strip() for n in names if n]
		return ", ".join(names) if names else None
	# Other types not handled explicitly
	return None


def _extract_notion_property_value(properties: Dict[str, Any], candidates: List[str]) -> Optional[str]:
	if not properties:
		return None
	lower_to_key = {str(k).lower(): k for k in properties.keys()}
	for cand in candidates:
		orig_key = lower_to_key.get(cand.lower())
		if orig_key is None:
			continue
		val = _extract_notion_text_from_property(properties.get(orig_key))
		if val:
			return val
	return None


def merge_by_identifier(
	notion_items: List[Dict[str, Any]],
	sheet_rows: List[Dict[str, Any]],
	sheet_token_keys: Optional[List[str]] = None,
	sheet_local_id_keys: Optional[List[str]] = None,
	notion_token_props: Optional[List[str]] = None,
	notion_local_id_props: Optional[List[str]] = None,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
	"""Merge using collection token (preferred) and local id as keys.

	- For sheet rows, we look for token candidates and local id candidates by header names.
	- For Notion items, we look into `properties` for fields such as "Object URL" (token via URL),
	  "Token", and "Local Number" / "Local ID".
	"""
	sheet_token_keys = sheet_token_keys or ["Token", "token", "Object URL", "URL", "ObjectUrl", "Object Url", "Id URL", "ID URL"]
	sheet_local_id_keys = sheet_local_id_keys or [
		"Local Number",
		"Local ID",
		"Local Number/ID",
		"local_number",
		"local id",
		"LocalNumber",
		"LocalId",
		"Inventory Number",
		"Inventory #",
	]
	notion_token_props = notion_token_props or ["Object URL", "Token", "URL", "Object Url", "Id URL", "ID URL"]
	notion_local_id_props = notion_local_id_props or ["Local Number", "Local ID", "LocalNumber", "LocalId", "Inventory Number", "Inventory #"]

	# Build indices from sheet rows
	token_to_row: Dict[str, Dict[str, Any]] = {}
	local_id_to_row: Dict[str, Dict[str, Any]] = {}
	for row in sheet_rows:
		# Token: may be direct token or an URL containing token
		token_raw = _get_row_value_case_insensitive(row, sheet_token_keys)
		token = _extract_token_from_value(token_raw)
		if token:
			token_to_row[token.strip().lower()] = row
		# Local id
		local_id_raw = _get_row_value_case_insensitive(row, sheet_local_id_keys)
		if local_id_raw:
			local_id_to_row[local_id_raw.strip().lower()] = row

	merged: List[Dict[str, Any]] = []
	matched_token = 0
	matched_local = 0
	unmatched: List[Dict[str, Any]] = []

	for item in notion_items:
		properties: Dict[str, Any] = item.get("properties", {}) or {}
		notion_url_or_token = _extract_notion_property_value(properties, notion_token_props)
		notion_token = _extract_token_from_value(notion_url_or_token)
		notion_local_id_raw = _extract_notion_property_value(properties, notion_local_id_props)

		chosen_row: Optional[Dict[str, Any]] = None
		match_kind = "none"

		if notion_token:
			chosen_row = token_to_row.get(notion_token.strip().lower())
			if chosen_row is not None:
				match_kind = "token"
				matched_token += 1
		if chosen_row is None and notion_local_id_raw:
			chosen_row = local_id_to_row.get(notion_local_id_raw.strip().lower())
			if chosen_row is not None:
				match_kind = "local_id"
				matched_local += 1

		if chosen_row is None:
			unmatched.append(item)

		merged.append({
			"name": item.get("name"),
			"notion": item,
			"sheet": chosen_row,
			"match_kind": match_kind,
			"match_keys": {
				"token": notion_token,
				"local_id": notion_local_id_raw,
			},
		})

	report = {
		"totals": {
			"notion_items": len(notion_items),
			"sheet_rows": len(sheet_rows),
			"matched_token": matched_token,
			"matched_local_id": matched_local,
			"unmatched": len(unmatched),
		},
		"unmatched_items": [i.get("name") for i in unmatched],
	}

	return merged, report
