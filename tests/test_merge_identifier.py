from __future__ import annotations

from src.merge import merge_by_identifier


def test_merge_prefers_token_then_local_id():
    notion_items = [
        {
            "name": "Black Raku chawan",
            "properties": {
                "Object URL": {"type": "url", "url": "https://collection.ito.com/id/abc123"},
                "Local Number": {"type": "rich_text", "rich_text": [{"plain_text": "ITO-2025-001"}]},
            },
        },
        {
            "name": "Hagi chawan",
            "properties": {
                "Local ID": {"type": "rich_text", "rich_text": [{"plain_text": "ITO-2025-002"}]},
            },
        },
    ]

    sheet_rows = [
        {"Token": "abc123", "Price": 1000, "Currency": "USD"},
        {"Local ID": "ITO-2025-002", "Price": 2000, "Currency": "USD"},
    ]

    merged, report = merge_by_identifier(notion_items, sheet_rows)

    assert report["totals"]["matched_token"] == 1
    assert report["totals"]["matched_local_id"] == 1

    # Ensure matches are aligned
    m0 = merged[0]
    m1 = merged[1]
    assert m0["match_kind"] == "token"
    assert (m0["sheet"] or {}).get("Price") == 1000
    assert m1["match_kind"] == "local_id"
    assert (m1["sheet"] or {}).get("Price") == 2000



