"""Check source requirement maps without treating page counts as coverage."""

import json
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MAPS = ROOT / "docs" / "plans" / "curriculum-crosswalks"
STATUSES = {"verified", "partial", "missing", "unmapped", "not-applicable"}


def check_crosswalk(path: Path) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    assert data.get("schema_version") == 1, f"{path}: schema_version must be 1"
    assert data.get("id") and data.get("scope") and data.get("source_version"), path
    assert data.get("source_url", "").startswith("https://"), path
    assert data.get("review_date") and data.get("review_level"), path
    requirements = data.get("requirements")
    assert isinstance(requirements, list) and requirements, f"{path}: empty requirements"
    seen = set()
    counts = Counter()
    for row in requirements:
        identifier = row.get("id", "")
        assert identifier.startswith(data["id"] + "-") and identifier not in seen, identifier
        seen.add(identifier)
        assert all(row.get(key) for key in ("module", "source_locator", "objective", "gap", "next_step")), identifier
        status = row.get("status")
        assert status in STATUSES, f"{identifier}: invalid status {status}"
        counts[status] += 1
        evidence = row.get("evidence")
        assert isinstance(evidence, list), f"{identifier}: evidence must be a list"
        if status in {"verified", "partial"}:
            assert any(item.endswith(".html") for item in evidence), f"{identifier}: no learning page"
        if status == "verified":
            assert any(item.startswith("tests/") for item in evidence), f"{identifier}: no interaction test"
        if status == "missing":
            assert not evidence, f"{identifier}: missing item has evidence"
        for item in evidence:
            target = Path(item)
            assert not target.is_absolute() and ".." not in target.parts, f"{identifier}: unsafe path"
            assert (ROOT / target).is_file(), f"{identifier}: missing evidence {item}"
    expected = {key: counts[key] for key in STATUSES}
    assert data.get("summary") == expected, f"{path}: summary {data.get('summary')} != {expected}"
    print(f"{path.relative_to(ROOT)}: {len(requirements)} requirements, "
          f"{counts['verified']} verified, {counts['partial']} partial, {counts['missing']} missing")


def main() -> None:
    paths = sorted(MAPS.glob("*.json"))
    assert paths, f"No curriculum crosswalks in {MAPS}"
    for path in paths:
        check_crosswalk(path)


if __name__ == "__main__":
    main()
