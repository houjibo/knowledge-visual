#!/usr/bin/env python3
"""Create a deterministic static inventory; it does not execute page scripts."""
import argparse
from collections import deque
from html.parser import HTMLParser
import json
from pathlib import Path
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
IGNORED = {'.git', 'node_modules'}
SIGNALS = ('button', 'input', 'select', 'textarea', 'canvas', 'svg')


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.signals = {tag: 0 for tag in SIGNALS}
        self.title = []
        self.in_title = False
        self.links = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag in self.signals:
            self.signals[tag] += 1
        if tag == 'title':
            self.in_title = True
        if tag == 'a' and attributes.get('href'):
            self.links.append(attributes['href'])

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title.append(data)


def build_inventory(root):
    root = root.resolve()
    files = sorted(p for p in root.rglob('*.html')
                   if not any(part in IGNORED for part in p.relative_to(root).parts))
    paths = {p.relative_to(root).as_posix(): p for p in files}
    parsed = {}
    graph = {}
    for name, path in paths.items():
        page = PageParser()
        page.feed(path.read_text(encoding='utf-8'))
        parsed[name] = page
        targets = set()
        for link in page.links:
            url = urlsplit(link)
            if url.scheme or url.netloc or not url.path:
                continue
            decoded = unquote(url.path)
            destination = (root / decoded.lstrip('/') if decoded.startswith('/')
                           else path.parent / decoded).resolve()
            try:
                relative = destination.relative_to(root)
            except ValueError:
                continue
            if destination.is_dir():
                relative /= 'index.html'
            target = relative.as_posix()
            if target in paths:
                targets.add(target)
        graph[name] = targets

    reachable = set()
    queue = deque(['index.html'] if 'index.html' in paths else [])
    while queue:
        current = queue.popleft()
        if current in reachable:
            continue
        reachable.add(current)
        queue.extend(sorted(graph[current] - reachable))

    pages = []
    for name, page in parsed.items():
        parts = Path(name).parts
        kind = ('topic' if len(parts) >= 4 and parts[:2] == ('math', 'topics')
                else 'navigation' if Path(name).name == 'index.html' else 'topic')
        stage = ('primary' if parts[0] == 'science' or parts[:2] == ('math', 'topics')
                 else parts[1] if len(parts) > 1 and parts[1] in {'middle', 'high', 'uni'}
                 else None)
        pages.append({
            'path': name,
            'title': ' '.join(''.join(page.title).split()),
            'kind': kind,
            'subject': parts[0] if parts[0] in {'math', 'physics', 'chemistry', 'science'} else None,
            'stage': stage,
            'static_signals': page.signals,
            'static_reachability': 'reachable' if name in reachable else 'not-reached',
            'functional_verification': 'unverified',
        })
    return {
        'scope': 'HTML files in repository; static links and HTML tags only',
        'limitations': ['JavaScript-generated links and controls are not observed',
                        'not-reached is an investigation cue, not proof of an orphan page',
                        'signals do not demonstrate functionality or educational correctness'],
        'total': len(pages),
        'static_reachable': len(reachable),
        'pages': pages,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--output', type=Path, help='write JSON to this path instead of stdout')
    mode.add_argument('--check', type=Path, help='fail if this inventory differs from the current site')
    args = parser.parse_args()
    result = json.dumps(build_inventory(ROOT), ensure_ascii=False, indent=2) + '\n'
    if args.check:
        try:
            current = args.check.read_text(encoding='utf-8')
        except OSError as exc:
            print(f'Cannot read inventory: {exc}', file=sys.stderr)
            return 1
        if current != result:
            print(f'Inventory is stale: {args.check}', file=sys.stderr)
            return 1
        print(f'Inventory is current: {args.check}')
    elif args.output:
        args.output.write_text(result, encoding='utf-8')
    else:
        print(result, end='')
    return 0


if __name__ == '__main__':
    sys.exit(main())
