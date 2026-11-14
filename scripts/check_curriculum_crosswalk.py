"""Check source requirement maps without treating page counts as coverage."""

import json
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MAPS = ROOT / "docs" / "plans" / "curriculum-crosswalks"
STATUSES = {"verified", "partial", "missing", "unmapped", "not-applicable"}


def check_evidence(evidence, status, identifier: str) -> None:
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


def expected_counts(counts: Counter) -> dict:
    return {key: counts[key] for key in STATUSES}


def check_crosswalk(path: Path) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    assert data.get("schema_version") == 1, f"{path}: schema_version must be 1"
    assert data.get("id") and data.get("scope") and data.get("source_version"), path
    assert data.get("source_url", "").startswith("https://"), path
    assert data.get("review_date") and data.get("review_level"), path
    assert data.get("baseline_status") in {"current", "historical"}, f"{path}: invalid baseline_status"
    dimension = data.get("dimension", "content-requirement")
    assert dimension in {"content-requirement", "academic-requirement"}, f"{path}: invalid dimension"
    if data["baseline_status"] == "historical":
        assert data.get("successor_source_id"), f"{path}: historical map needs successor_source_id"
    if dimension == "academic-requirement":
        companion_name = data.get("companion_map")
        assert isinstance(companion_name, str) and Path(companion_name).name == companion_name, f"{path}: invalid companion map"
        companion = MAPS / companion_name
        assert companion.is_file(), f"{path}: missing companion content map"
        content = json.loads(companion.read_text(encoding="utf-8"))
        assert content.get("dimension", "content-requirement") == "content-requirement", path
        assert content.get("id") == data.get("non_additive_with"), f"{path}: invalid non_additive_with"
        assert content.get("companion_academic_map") == path.name, f"{path}: missing reciprocal academic map"
        assert data.get("baseline_status") == content.get("baseline_status"), f"{path}: edition mismatch"
        assert data.get("source_url") == content.get("source_url") and data.get("source_version") == content.get("source_version"), f"{path}: source edition mismatch"
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
        check_evidence(row.get("evidence"), status, identifier)
        checks = row.get("diagnostic_checks")
        if checks is not None:
            assert dimension == "academic-requirement" and isinstance(checks, list) and checks, identifier
            check_counts = Counter()
            keys = set()
            for check in checks:
                key = check.get("key")
                assert isinstance(key, str) and key and key not in keys, f"{identifier}: duplicate diagnostic key"
                keys.add(key)
                assert check.get("objective") and check.get("gap"), f"{identifier}/{key}: incomplete diagnostic"
                check_status = check.get("status")
                assert check_status in STATUSES, f"{identifier}/{key}: invalid status"
                check_counts[check_status] += 1
                check_evidence(check.get("evidence"), check_status, f"{identifier}/{key}")
            assert row.get("diagnostic_summary") == expected_counts(check_counts), f"{identifier}: diagnostic summary mismatch"
        elif dimension == "academic-requirement":
            raise AssertionError(f"{identifier}: academic requirement needs diagnostic checks")
    expected = expected_counts(counts)
    assert data.get("summary") == expected, f"{path}: summary {data.get('summary')} != {expected}"
    if dimension == "academic-requirement":
        label = "source paragraph" if len(requirements) == 1 else "source paragraphs"
    else:
        label = "content requirements"
    print(f"{path.relative_to(ROOT)} ({data['baseline_status']}): {len(requirements)} {label}, "
          f"{counts['verified']} verified, {counts['partial']} partial, {counts['missing']} missing")


def check_canonical_subsets() -> None:
    canonical_path = MAPS / "middle-math-number-expressions-ce25.json"
    assert canonical_path.is_file(), f"missing canonical map: {canonical_path}"
    canonical = json.loads(canonical_path.read_text(encoding="utf-8"))
    assert canonical["id"] == "CE25-MATH-L4-NEX", canonical_path
    rows = canonical["requirements"]
    assert len(rows) == 22, "CE25 fourth-stage number and expressions must have 22 numbered items"
    assert Counter(row["module"] for row in rows) == {
        "数与式／有理数": 5,
        "数与式／实数": 8,
        "数与式／代数式": 9,
    }, "CE25 fourth-stage number and expressions section counts changed"
    by_id = {row["id"]: row for row in rows}
    assert len(by_id) == len(rows), "duplicate canonical requirement ID"
    expected_ids = {f"CE25-MATH-L4-NEX-{group}-{index:02d}"
                    for group, count in (("RAT", 5), ("REAL", 8), ("ALG", 9))
                    for index in range(1, count + 1)}
    assert set(by_id) == expected_ids, "canonical numbered source items changed"
    subset_names = ("middle-math-rational-numbers-ce25.json",
                    "middle-math-scientific-approximation-ce25.json")
    assert canonical.get("subset_maps") == list(subset_names), "canonical subset list changed"
    for name in subset_names:
        subset = json.loads((MAPS / name).read_text(encoding="utf-8"))
        assert subset.get("subset_of") == canonical_path.name, f"{name}: missing subset_of"
        for row in subset["requirements"]:
            canonical_row = by_id[row["canonical_requirement_id"]]
            assert canonical_row.get("derived_from") == row["id"], f"{row['id']}: reciprocal link mismatch"
            for key in ("module", "source_locator", "objective", "status", "evidence", "gap", "next_step"):
                assert canonical_row[key] == row[key], f"{row['id']}: {key} drifted from canonical map"
    assert sum("derived_from" in row for row in rows) == 7, "canonical subset count changed"


def main() -> None:
    paths = sorted(MAPS.glob("*.json"))
    assert paths, f"No curriculum crosswalks in {MAPS}"
    for path in paths:
        check_crosswalk(path)
    check_canonical_subsets()


if __name__ == "__main__":
    main()
