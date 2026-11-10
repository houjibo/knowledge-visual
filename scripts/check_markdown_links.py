#!/usr/bin/env python3
"""Check local file and directory targets in repository Markdown links."""

from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
SKIP = {'.git', 'node_modules'}
LINK_START = re.compile(r'(?<!\\)(?:!\s*)?\[([^\]]*?)(?<!\\)\]\(')
REFERENCE_DEFINITION = re.compile(
    r'^\s{0,3}\[[^\]]+\]:\s*(<[^>]+>|(?:\\.|[^\s]+))'
)
FENCE_START = re.compile(r'^ {0,3}(`{3,}|~{3,})')


def _strip_inline_code(line):
    """Replace paired same-line code spans with spaces before link parsing."""
    chars = list(line)
    i = 0
    while i < len(line):
        if line[i] != '`':
            i += 1
            continue
        end = i + 1
        while end < len(line) and line[end] == '`':
            end += 1
        delimiter = line[i:end]
        search = end
        close_end = None
        while True:
            close = line.find(delimiter, search)
            if close < 0:
                break
            before_ok = close == 0 or line[close - 1] != '`'
            after = close + len(delimiter)
            after_ok = after == len(line) or line[after] != '`'
            if before_ok and after_ok:
                close_end = after
                break
            search = close + 1
        if close_end is None:
            i = end
            continue
        for pos in range(i, close_end):
            chars[pos] = ' '
        i = close_end
    return ''.join(chars)


def _unescape_destination(value):
    value = value.strip()
    if value.startswith('<') and value.endswith('>'):
        value = value[1:-1]
    return re.sub(r'\\(.)', r'\1', value)


def _inline_destination(line, start):
    """Read a CommonMark-style destination after the opening `](`."""
    i = start
    while i < len(line) and line[i].isspace():
        i += 1
    if i >= len(line):
        return None
    if line[i] == '<':
        i += 1
        begin = i
        escaped = False
        while i < len(line):
            if line[i] == '>' and not escaped:
                return line[begin:i], i + 1
            if line[i] == '\\' and not escaped:
                escaped = True
            else:
                escaped = False
            i += 1
        return None

    begin = i
    depth = 0
    escaped = False
    while i < len(line):
        char = line[i]
        if escaped:
            escaped = False
            i += 1
            continue
        if char == '\\':
            escaped = True
            i += 1
            continue
        if char == '(':
            depth += 1
        elif char == ')':
            if depth == 0:
                break
            depth -= 1
        elif char.isspace() and depth == 0:
            break
        i += 1
    destination = line[begin:i]
    return (destination, i) if destination else None


def iter_destinations(content):
    """Yield (line number, destination) for links, images and definitions."""
    fence_char = None
    fence_size = 0
    for line_number, original in enumerate(content.splitlines(), 1):
        fence_match = FENCE_START.match(original)
        if fence_match:
            fence = fence_match.group(1)
            char = fence[0]
            if fence_char is None:
                fence_char, fence_size = char, len(fence)
            elif char == fence_char and len(fence) >= fence_size:
                fence_char, fence_size = None, 0
            continue
        if fence_char is not None:
            continue

        line = _strip_inline_code(original)
        definition = REFERENCE_DEFINITION.match(line)
        if definition:
            yield line_number, _unescape_destination(definition.group(1))

        for match in LINK_START.finditer(line):
            parsed = _inline_destination(line, match.end())
            if parsed is not None:
                destination, _ = parsed
                yield line_number, _unescape_destination(destination)


def check(root=ROOT):
    """Return (errors, markdown_file_count, destination_count)."""
    root = Path(root).resolve()
    errors = []
    files = 0
    destinations = 0
    for source in sorted(root.rglob('*.md')):
        relative_parts = source.relative_to(root).parts
        if any(part in SKIP for part in relative_parts):
            continue
        files += 1
        try:
            content = source.read_text(encoding='utf-8')
        except (OSError, UnicodeError) as exc:
            errors.append(f'{source.relative_to(root)}: cannot read: {exc}')
            continue

        for line, raw_destination in iter_destinations(content):
            try:
                parsed = urlsplit(raw_destination)
            except ValueError as exc:
                errors.append(f'{source.relative_to(root)}:{line}: invalid link target {raw_destination}: {exc}')
                continue
            if parsed.scheme or parsed.netloc or not parsed.path:
                continue
            destinations += 1
            path = unquote(parsed.path)
            target = root / path.lstrip('/') if path.startswith('/') else source.parent / path
            resolved = target.resolve()
            try:
                resolved.relative_to(root)
            except ValueError:
                errors.append(f'{source.relative_to(root)}:{line}: target escapes repository: {raw_destination}')
                continue
            if not target.exists():
                errors.append(f'{source.relative_to(root)}:{line}: missing local target: {raw_destination}')
    return errors, files, destinations


def main(root=None):
    errors, files, destinations = check(ROOT if root is None else root)
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        print(f'FAILED: {len(errors)} issue(s) across {files} Markdown files', file=sys.stderr)
        return 1
    print(f'OK: {files} Markdown files and {destinations} local links checked')
    return 0


if __name__ == '__main__':
    sys.exit(main())
