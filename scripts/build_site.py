#!/usr/bin/env python3
"""Build a static release from tracked, explicitly allowed site files."""
import argparse
from html.parser import HTMLParser
from pathlib import Path
import shutil
import subprocess
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
SITE_DIRS = {'assets', 'math', 'physics', 'chemistry', 'science'}
ROOT_FILES = {'index.html', 'favicon.ico'}
EXTENSIONS = {'.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.woff', '.woff2'}


class References(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.items = []

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if value and ((tag in {'a', 'link'} and key == 'href') or
                          (tag in {'script', 'img'} and key == 'src')):
                self.items.append((self.getpos()[0], value))


def build(output):
    output = Path(output).absolute()
    if output.exists():
        raise ValueError(f'output already exists: {output}')
    tracked = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode('utf-8').split('\0')
    selected = []
    for name in filter(None, tracked):
        path = Path(name)
        if any(part.startswith('.') for part in path.parts):
            continue
        if name not in ROOT_FILES and (path.parts[0] not in SITE_DIRS or path.suffix.lower() not in EXTENSIONS):
            continue
        source = ROOT / path
        if source.is_symlink() or not source.is_file():
            raise ValueError(f'not a regular site file: {name}')
        selected.append(path)
    if not ROOT_FILES.issubset({p.as_posix() for p in selected}):
        raise ValueError('site entry or favicon is missing')
    output.mkdir(parents=True)
    for path in selected:
        dest = output / path
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / path, dest)
    errors = []
    for page in output.rglob('*.html'):
        parser = References()
        parser.feed(page.read_text(encoding='utf-8'))
        for line, value in parser.items:
            parsed = urlsplit(value)
            if parsed.scheme or parsed.netloc or not parsed.path:
                continue
            if parsed.path.startswith('/'):
                errors.append(f'{page.relative_to(output)}:{line}: root-relative reference {value}')
                continue
            target = (page.parent / unquote(parsed.path)).resolve()
            if not target.is_relative_to(output.resolve()) or not target.exists():
                errors.append(f'{page.relative_to(output)}:{line}: missing or outside release: {value}')
    if errors:
        raise ValueError('\n'.join(errors))
    return len(selected)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, help='new output directory (must not already exist)')
    args = parser.parse_args()
    try:
        count = build(args.output)
    except (OSError, ValueError, subprocess.CalledProcessError) as exc:
        parser.exit(1, f'Build failed: {exc}\n')
    print(f'Built {count} tracked site files in {args.output}')


if __name__ == '__main__':
    main()
