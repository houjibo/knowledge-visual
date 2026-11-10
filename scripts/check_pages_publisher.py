#!/usr/bin/env python3
"""Require one GitHub Pages publisher with the project's release safeguards."""

from pathlib import Path
import re


DEPLOY_STEP = re.compile(r"(?m)^\s*(?:-\s*)?uses:\s*actions/deploy-pages@")
JOB_HEADER = re.compile(r"^  ([A-Za-z0-9_-]+):\s*(?:#.*)?$")
DEPLOY_TIMEOUT_MINUTES = 15
CHECKS_TIMEOUT_MINUTES = 25
REQUIRED_RELEASE_STEPS = (
    "needs: checks",
    "python3 scripts/build_site.py",
    "release-version.json",
    "python3 scripts/verify_published_site.py",
    "tests/browser/published-live-site.spec.js",
)


def _job_block(content: str, job_id: str) -> str | None:
    lines = content.splitlines()
    start = next(
        (
            index
            for index, line in enumerate(lines)
            if (match := JOB_HEADER.match(line)) and match.group(1) == job_id
        ),
        None,
    )
    if start is None:
        return None
    end = next(
        (index for index in range(start + 1, len(lines)) if JOB_HEADER.match(lines[index])),
        len(lines),
    )
    return "\n".join(lines[start + 1:end])


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

    checks_job = _job_block(content, "checks")
    checks_timeout = re.search(r"(?m)^    timeout-minutes:\s*(\d+)\s*(?:#.*)?$", checks_job or "")
    if checks_timeout is None or int(checks_timeout.group(1)) < CHECKS_TIMEOUT_MINUTES:
        raise ValueError(
            f"{path.name} checks job must set timeout-minutes to at least {CHECKS_TIMEOUT_MINUTES}"
        )

    deploy_job = _job_block(content, "deploy")
    timeout = re.search(r"(?m)^    timeout-minutes:\s*(\d+)\s*(?:#.*)?$", deploy_job or "")
    if timeout is None or int(timeout.group(1)) < DEPLOY_TIMEOUT_MINUTES:
        raise ValueError(
            f"{path.name} deploy job must set timeout-minutes to at least {DEPLOY_TIMEOUT_MINUTES}"
        )

    verify_job = _job_block(content, "verify-deployment")
    verify_missing = [
        step for step in REQUIRED_RELEASE_STEPS[-2:]
        if verify_job is None or step not in verify_job
    ]
    if (
        verify_job is None
        or not re.search(r"(?m)^    needs:\s*deploy\s*$", verify_job)
        or verify_missing
    ):
        raise ValueError(
            f"{path.name} verify-deployment job must depend on deploy and run all post-deployment checks"
        )
    return path


def main() -> None:
    repository_root = Path(__file__).resolve().parents[1]
    publisher = check_pages_publisher(repository_root)
    print(f"Verified single GitHub Pages publisher: {publisher.relative_to(repository_root)}")


if __name__ == "__main__":
    main()
