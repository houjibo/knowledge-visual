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


def check_high_information_technology_baseline() -> None:
    path = MAPS / "high-information-technology-hs25.json"
    assert path.is_file(), f"missing HS25 information technology map: {path}"
    data = json.loads(path.read_text(encoding="utf-8"))
    assert data["id"] == "HS25-IT-BAS" and data["baseline_status"] == "current", path
    assert len(data.get("source_sha256", "")) == 64, f"{path}: source checksum missing"
    assert data.get("source_host_status") and data.get("version_confirmation_url", "").startswith("https://"), path
    assert data.get("comparison_source_url", "").startswith("https://"), path
    rows = data["requirements"]
    assert len(rows) == 15, "HS25 two mandatory modules must contain 15 numbered items"
    assert Counter(row["module"] for row in rows) == {
        "必修1／数据与计算": 7,
        "必修2／信息系统与社会": 8,
    }, "HS25 mandatory module counts changed"
    expected_ids = {f"HS25-IT-BAS-M{module}-{index:02d}"
                    for module, count in ((1, 7), (2, 8))
                    for index in range(1, count + 1)}
    assert {row["id"] for row in rows} == expected_ids, "HS25 numbered source items changed"
    assert all(row.get("course_requirement") == "mandatory" for row in rows), path
    assert all(isinstance(row.get("related_hs20_items"), list) for row in rows), path


def check_high_math_logic_baseline() -> None:
    """Keep the six independently stated HS25 logic requirements stable."""
    path = MAPS / "high-math-logic-language-hs25.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    assert data["id"] == "HS25-MATH-BAS-LOGIC" and data["baseline_status"] == "current", path
    rows = data["requirements"]
    assert len(rows) == 6, "HS25 mandatory logic unit must contain six source items"
    assert {row["id"] for row in rows} == {
        f"HS25-MATH-BAS-LOGIC-{index:02d}" for index in range(1, 7)
    }, "HS25 logic source item IDs changed"
    assert Counter(row["module"] for row in rows) == {
        "必修／预备知识／必要条件、充分条件、充要条件": 3,
        "必修／预备知识／全称量词与存在量词": 1,
        "必修／预备知识／量词命题的否定": 2,
    }, "HS25 logic source grouping changed"
    assert all(row["source_locator"].endswith("印刷页15") for row in rows[:3]), path
    assert all(row["source_locator"].endswith("印刷页16") for row in rows[3:]), path


def check_high_math_equality_inequality_baseline() -> None:
    """Keep the two independent HS25 equality/inequality source items stable."""
    path = MAPS / "high-math-equality-inequality-hs25.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    assert data["id"] == "HS25-MATH-BAS-EQI" and data["baseline_status"] == "current", path
    rows = data["requirements"]
    assert len(rows) == 2, "HS25 equality/inequality unit has two source requirements"
    assert [row["id"] for row in rows] == [f"HS25-MATH-BAS-EQI-{index:02d}" for index in (1, 2)], path
    assert [row["module"] for row in rows] == [
        "必修／预备知识／等式与不等式的性质", "必修／预备知识／基本不等式"
    ], path
    assert all(row["source_locator"].endswith("印刷页16") and row.get("course_requirement") == "mandatory"
               for row in rows), path


def check_high_math_quadratic_function_baseline() -> None:
    """Keep three HS25 function/equation/inequality source items separate."""
    path = MAPS / "high-math-quadratic-function-hs25.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    assert data["id"] == "HS25-MATH-BAS-QUAD" and data["baseline_status"] == "current", path
    assert len(data.get("source_sha256", "")) == 64, path
    rows = data["requirements"]
    assert [row["id"] for row in rows] == [f"HS25-MATH-BAS-QUAD-{index:02d}" for index in (1, 2, 3)], path
    assert [row["module"] for row in rows] == [
        "必修／预备知识／函数零点与方程实根",
        "必修／预备知识／实际问题中的一元二次不等式",
        "必修／预备知识／函数、方程与不等式的图象联系",
    ], path
    assert [row["source_locator"].split("，")[-1] for row in rows] == ["印刷页16", "印刷页17", "印刷页17"], path
    assert all(row.get("course_requirement") == "mandatory" for row in rows), path


def check_high_math_function_concept_properties_baseline() -> None:
    """Keep six mandatory function items and one optional history task distinct."""
    path = MAPS / "high-math-function-concept-properties-hs25.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    assert data["id"] == "HS25-MATH-FUN-CP" and data["baseline_status"] == "current", path
    assert len(data.get("source_sha256", "")) == 64, path
    rows = data["requirements"]
    assert [row["id"] for row in rows] == [f"HS25-MATH-FUN-CP-{index:02d}" for index in range(1, 8)], path
    assert Counter(row["module"].split("／")[2] for row in rows) == {
        "函数概念": 3, "函数性质": 3, "函数的形成与发展": 1
    }, path
    assert [row.get("course_requirement") for row in rows] == ["mandatory"] * 6 + ["optional"], path
    assert all(row["source_locator"].endswith("印刷页19") for row in rows), path


def check_equation_baseline(data: dict) -> None:
    """Preserve the source denominator and identify its single optional item."""
    assert data.get("id") == "CE25-MATH-L4-EQI"
    assert data.get("baseline_status") == "current"
    rows = data["requirements"]
    expected = {f"CE25-MATH-L4-EQI-{group}-{index:02d}"
                for group, count in (("EQ", 8), ("IN", 3))
                for index in range(1, count + 1)}
    assert len(rows) == len(expected) and {row["id"] for row in rows} == expected, "equation source denominator changed"
    for row in rows:
        optional = row["id"] == "CE25-MATH-L4-EQI-EQ-04"
        assert row.get("course_requirement") == ("optional" if optional else "core"), f"{row['id']}: optional boundary changed"
        expected_module = "方程与不等式／方程与方程组" if "-EQ-" in row["id"] else "方程与不等式／不等式与不等式组"
        assert row.get("module") == expected_module, f"{row['id']}: source group changed"


def main() -> None:
    paths = sorted(MAPS.glob("*.json"))
    assert paths, f"No curriculum crosswalks in {MAPS}"
    for path in paths:
        check_crosswalk(path)
    check_canonical_subsets()
    check_high_information_technology_baseline()
    check_high_math_logic_baseline()
    check_high_math_equality_inequality_baseline()
    check_high_math_quadratic_function_baseline()
    check_high_math_function_concept_properties_baseline()
    check_equation_baseline(json.loads((MAPS / "middle-math-equations-inequalities-ce25.json").read_text(encoding="utf-8")))


if __name__ == "__main__":
    main()
