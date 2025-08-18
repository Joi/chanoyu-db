from __future__ import annotations

import types
from typing import Any, List

import pytest

from src.sheets_writer import (
    _extract_spreadsheet_id_from_input,
    create_worksheet_and_write,
)


@pytest.mark.parametrize(
    "given, expected",
    [
        (
            "1zcbd_az-PZG4zSr_E1g0rOy6P8k7BT0W8J08FgoBwqM",
            "1zcbd_az-PZG4zSr_E1g0rOy6P8k7BT0W8J08FgoBwqM",
        ),
        (
            "https://docs.google.com/spreadsheets/d/1zcbd_az-PZG4zSr_E1g0rOy6P8k7BT0W8J08FgoBwqM/edit?gid=0",
            "1zcbd_az-PZG4zSr_E1g0rOy6P8k7BT0W8J08FgoBwqM",
        ),
        (
            "https://docs.google.com/spreadsheets/d/1zcbd_az-PZG4zSr_E1g0rOy6P8k7BT0W8J08FgoBwqM",
            "1zcbd_az-PZG4zSr_E1g0rOy6P8k7BT0W8J08FgoBwqM",
        ),
        (
            "https://docs.google.com/spreadsheets/u/1/d/1zcbd_az-PZG4zSr_E1g0rOy6P8k7BT0W8J08FgoBwqM/edit#gid=123",
            "1zcbd_az-PZG4zSr_E1g0rOy6P8k7BT0W8J08FgoBwqM",
        ),
        (
            # Some legacy links used ?key= param
            "https://spreadsheets.google.com/ccc?key=1zcbd_az-PZG4zSr_E1g0rOy6P8k7BT0W8J08FgoBwqM&hl=en_GB",
            "1zcbd_az-PZG4zSr_E1g0rOy6P8k7BT0W8J08FgoBwqM",
        ),
        (
            # If someone pasted an ID with a trailing path or query by mistake
            "1zcbd_az-PZG4zSr_E1g0rOy6P8k7BT0W8J08FgoBwqM/edit?gid=0",
            "1zcbd_az-PZG4zSr_E1g0rOy6P8k7BT0W8J08FgoBwqM",
        ),
    ],
)
def test_extract_spreadsheet_id_from_input(given: str, expected: str) -> None:
    assert _extract_spreadsheet_id_from_input(given) == expected


def test_create_worksheet_uses_normalized_id(monkeypatch: pytest.MonkeyPatch) -> None:
    opened_with: List[str] = []
    added_args: List[dict[str, Any]] = []
    updated_calls: List[dict[str, Any]] = []

    class FakeWorksheet:
        def update(self, range_name: str, values: list[list[object]], value_input_option: str) -> None:
            updated_calls.append({
                "range": range_name,
                "values_len": len(values),
                "option": value_input_option,
            })

    class FakeSpreadsheet:
        def add_worksheet(self, title: str, rows: int, cols: int) -> FakeWorksheet:
            added_args.append({"title": title, "rows": rows, "cols": cols})
            return FakeWorksheet()

    class FakeClient:
        def open_by_key(self, spreadsheet_id: str) -> FakeSpreadsheet:
            opened_with.append(spreadsheet_id)
            return FakeSpreadsheet()

    # Bypass real auth and return our fake client
    from src import sheets_writer as module

    monkeypatch.setattr(module, "_load_gspread_client_write", lambda a, b: FakeClient())

    # Provide a full URL to ensure normalization happens
    url = (
        "https://docs.google.com/spreadsheets/d/"
        "1zcbd_az-PZG4zSr_E1g0rOy6P8k7BT0W8J08FgoBwqM/edit?gid=0"
    )

    create_worksheet_and_write(
        spreadsheet_id=url,
        title="Unit Test Sheet",
        header=["A", "B"],
        rows=[[1, 2], [3, 4]],
        service_account_json=None,
        oauth_token_path=None,
    )

    # Verify normalized ID was used
    assert opened_with == ["1zcbd_az-PZG4zSr_E1g0rOy6P8k7BT0W8J08FgoBwqM"]
    # Verify worksheet creation and update were attempted
    assert added_args and added_args[0]["title"] == "Unit Test Sheet"
    assert updated_calls and updated_calls[0]["values_len"] == 1 + 2  # header + 2 rows


