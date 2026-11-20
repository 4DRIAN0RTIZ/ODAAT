import calendar
import json
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "reflections.json"


def _load() -> dict[str, dict]:
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))


def _all_month_day_keys() -> list[str]:
    # 2024 is a leap year, so the keys include 02-29.
    return [
        f"{month:02d}-{day:02d}"
        for month in range(1, 13)
        for day in range(1, calendar.monthrange(2024, month)[1] + 1)
    ]


def test_has_a_reflection_for_every_day_of_the_year():
    missing = sorted(set(_all_month_day_keys()) - set(_load()))
    assert missing == []


def test_entries_are_consistent_with_their_key():
    for key, entry in _load().items():
        assert key == f"{entry['month']:02d}-{entry['day']:02d}"
        assert entry["text"] == "\n\n".join(entry["paragraphs"])
