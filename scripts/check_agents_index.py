#!/usr/bin/env python3
"""Check that the root AGENTS.md stays a short index of repository Markdown."""
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = {
    'docs/architecture.md', 'docs/constraints.md', 'docs/gaps.md',
    'docs/workflows/requirement-delivery.md',
    'docs/workflows/continuous-refactoring.md',
    'docs/workflows/problem-solving.md', 'openspec/README.md',
}
LINK = re.compile(r'- \[([^\]]+)\]\(([^)]+)\)')
HEADING = re.compile(r'#{1,6} \S.*')


def check(text, root):
    root = Path(root).resolve()
    errors, seen, paths = [], set(), set()
    for number, line in enumerate(text.splitlines(), 1):
        if not line.strip() or HEADING.fullmatch(line):
            continue
        match = LINK.fullmatch(line)
        if not match:
            errors.append(f'line {number}: use only headings and standalone Markdown links')
            continue
        target = match.group(2)
        parsed = urlsplit(target)
        if parsed.scheme or parsed.netloc or parsed.query or not parsed.path or Path(parsed.path).is_absolute():
            errors.append(f'line {number}: target must be a local relative Markdown file')
            continue
        resolved = (root / parsed.path).resolve()
        if not resolved.is_relative_to(root) or resolved.suffix.lower() != '.md':
            errors.append(f'line {number}: target must be a Markdown file inside the repository')
            continue
        if not resolved.is_file():
            errors.append(f'line {number}: target does not exist: {parsed.path}')
        if target in seen:
            errors.append(f'line {number}: duplicate target: {target}')
        seen.add(target)
        paths.add(resolved.relative_to(root).as_posix())
    for missing in sorted(REQUIRED - paths):
        errors.append(f'missing required index entry: {missing}')
    return errors


def main():
    try:
        content = (ROOT / 'AGENTS.md').read_text(encoding='utf-8')
    except OSError as error:
        print(f'Cannot read AGENTS.md: {error}', file=sys.stderr)
        return 1
    errors = check(content, ROOT)
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        return 1
    print('AGENTS.md is a local Markdown index with required entries')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
