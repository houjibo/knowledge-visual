#!/usr/bin/env python3
"""Require one GitHub Pages publisher with the project's release safeguards."""

from pathlib import Path
import re


DEPLOY_STEP = re.compile(r"(?m)^\s*(?:-\s*)?uses:\s*actions/deploy-pages@")
REQUIRED_RELEASE_STEPS = (
    "needs: checks",
    "python3 scripts/build_site.py",
    "release-version.json",
    "python3 scripts/verify_published_site.py",
    "tests/browser/published-site.spec.js",
)


def check_pages_publisher(repository_root: Path) -> Path:
    workflows = repository_root / ".github" / "workflows"
    publishers = []
    for path in sorted(workflows.glob("*.yml")) + sorted(workflows.glob("*.yaml")):
        content = path.read_text(encoding="utf-8")
        if DEPLOY_STEP.search(content):
            publishers.append((path, content))

    if len(publishers) != 1:
        names = ", ".join(path.name for path, _ in publishers) or "none"
        raise ValueError(f"expected one GitHub Pages publisher, found {len(publishers)}: {names}")

    path, content = publishers[0]
    missing = [step for step in REQUIRED_RELEASE_STEPS if step not in content]
    if missing:
        raise ValueError(f"{path.name} is missing required release safeguards: {', '.join(missing)}")
    if path.name != "checks.yml":
        raise ValueError(f"expected the verified publisher in checks.yml, found {path.name}")
    return path


def main() -> None:
    repository_root = Path(__file__).resolve().parents[1]
    publisher = check_pages_publisher(repository_root)
    print(f"Verified single GitHub Pages publisher: {publisher.relative_to(repository_root)}")


if __name__ == "__main__":
    main()
