#!/usr/bin/env python3
"""Check that every main OpenSpec capability has a useful Purpose section."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SPEC_GLOB = 'openspec/specs/*/spec.md'
PURPOSE = re.compile(r'(?ms)^## Purpose[ \t]*\r?\n(.*?)(?=^## |\Z)')
PLACEHOLDER = 'TBD - created by archiving'
MIN_LENGTH = 50


def check_spec(path, text):
    """Return Purpose validation errors for one spec, including its path."""
    match = PURPOSE.search(text)
    if not match:
        return [f'{path}: missing ## Purpose section']
    value = ' '.join(line.strip() for line in match.group(1).splitlines() if line.strip())
    errors = []
    if len(value) < MIN_LENGTH:
        errors.append(f'{path}: Purpose must contain at least {MIN_LENGTH} characters (found {len(value)})')
    if PLACEHOLDER in value:
        errors.append(f'{path}: Purpose still contains the archive placeholder')
    return errors


def check(root):
    """Validate all main specs beneath a repository root."""
    root = Path(root).resolve()
    specs = sorted(root.glob(SPEC_GLOB))
    if not specs:
        return ['openspec/specs/*/spec.md: no main capability specs found']
    errors = []
    for path in specs:
        errors.extend(check_spec(path.relative_to(root).as_posix(), path.read_text(encoding='utf-8')))
    return errors


def main():
    errors = check(ROOT)
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        return 1
    count = len(list((ROOT / 'openspec/specs').glob('*/spec.md')))
    print(f'OpenSpec Purpose sections valid ({count} main specs; minimum {MIN_LENGTH} characters)')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
