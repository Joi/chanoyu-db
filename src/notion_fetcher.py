from __future__ import annotations

from typing import Any, Dict, List, Optional

from notion_client import Client


def _extract_title_property_name(properties: Dict[str, Any]) -> Optional[str]:
	for prop_name, prop in properties.items():
		if prop and isinstance(prop, dict) and prop.get("type") == "title":
			return prop_name
	return None


def _extract_title_value(title_rich_text: List[Dict[str, Any]]) -> str:
	parts: List[str] = []
	for rt in title_rich_text or []:
		text = rt.get("plain_text") or ""
		if text:
			parts.append(text)
	return "".join(parts).strip()


def _extract_files(property_value: Dict[str, Any]) -> List[Dict[str, str]]:
	files: List[Dict[str, str]] = []
	if not property_value:
		return files
	if property_value.get("type") != "files":
		return files
	for file_obj in property_value.get("files", []) or []:
		name = file_obj.get("name") or ""
		url = file_obj.get("file", {}).get("url") or file_obj.get("external", {}).get("url") or ""
		if url:
			files.append({"name": name, "url": url})
	return files


def _format_notion_page_url(page_id: str) -> str:
	normalized = (page_id or "").replace("-", "")
	return f"https://www.notion.so/{normalized}" if normalized else ""


class NotionFetcher:
	"""Fetch and simplify items from a Notion database."""

	def __init__(self, token: str, database_id: str) -> None:
		self.client = Client(auth=token)
		self.database_id = database_id

	def fetch_all(self) -> List[Dict[str, Any]]:
		results: List[Dict[str, Any]] = []
		cursor: Optional[str] = None
		while True:
			payload: Dict[str, Any] = {"database_id": self.database_id}
			if cursor:
				payload["start_cursor"] = cursor
			resp = self.client.databases.query(**payload)
			for page in resp.get("results", []):
				results.append(self._simplify_page(page))
			cursor = resp.get("next_cursor")
			if not resp.get("has_more"):
				break
		return results

	def _simplify_page(self, page: Dict[str, Any]) -> Dict[str, Any]:
		properties = page.get("properties", {}) or {}
		title_prop_name = _extract_title_property_name(properties) or ""
		title_value = ""
		if title_prop_name:
			title_value = _extract_title_value(properties.get(title_prop_name, {}).get("title", []))

		files_aggregated: List[Dict[str, str]] = []
		for prop in properties.values():
			if isinstance(prop, dict) and prop.get("type") == "files":
				files_aggregated.extend(_extract_files(prop.get(prop.get("type"), {})))

		return {
			"id": page.get("id"),
			"name": title_value,
			"url": _format_notion_page_url(page.get("id", "")),
			"properties": properties,
			"files": files_aggregated,
		}
