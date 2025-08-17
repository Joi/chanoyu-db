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
