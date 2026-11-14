#!/usr/bin/env python3
"""Check declared local HTML references and repository guidance links."""

from html.parser import HTMLParser
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
SKIP = {'.git', 'node_modules'}


class References(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.items = []
        self.topic_cards = 0
        self.topic_hrefs = []

    def handle_starttag(self, tag, attrs):
        if tag == 'a' and 'topic-card' in dict(attrs).get('class', '').split():
            self.topic_cards += 1
            self.topic_hrefs.append(dict(attrs).get('href', ''))
        for key, value in attrs:
            if value and ((tag in {'a', 'link'} and key == 'href') or
                          (tag in {'script', 'img'} and key == 'src')):
                self.items.append((self.getpos()[0], value))


def check(source, line, value, errors):
    parsed = urlsplit(value)
    if parsed.scheme or parsed.netloc or not parsed.path or parsed.path.startswith('/'):
        return
    target = source.parent / unquote(parsed.path)
    if not target.exists():
        errors.append(f'{source.relative_to(ROOT)}:{line}: missing {value}')


def check_math_conflicts(root, errors):
    stages = {'primary': {p.parent.name for p in (root / 'math/topics').glob('*/index.html')}}
    for stage in ('middle', 'high', 'uni'):
        stages[stage] = {p.stem for p in (root / 'math' / stage).glob('*.html') if p.name != 'index.html'}
    if any(not slugs for slugs in stages.values()):
        errors.append('math: cannot identify all stage topic files')
        return
    slugs = set().union(*stages.values())
    expected = {slug for slug in slugs if sum(slug in values for values in stages.values()) > 1}
    sources = ['index.html', 'math/index.html', 'math/assets/js/common.js'] + [
        f'math/{stage}/assets/common.js' for stage in ('middle', 'high', 'uni')]
    for name in sources:
        try:
            content = (root / name).read_text(encoding='utf-8')
        except (OSError, UnicodeError) as exc:
            errors.append(f'{name}: cannot read conflict list: {exc}')
            continue
        matches = re.findall(r'const\s+AMBIGUOUS_MATH_SLUGS\s*=\s*\[([^\]]*)\]', content)
        if len(matches) != 1:
            errors.append(f'{name}: cannot identify math conflict list')
            continue
        items = re.findall(r"['\"]([^'\"]+)['\"]", matches[0])
        actual = set(items)
        if actual != expected or len(items) != len(actual):
            errors.append(f'{name}: math conflict list differs; missing {sorted(expected - actual)}, '
                          f'extra {sorted(actual - expected)}, duplicates {len(items) - len(actual)}')


def main():
    errors = []
    pages = 0
    topic_counts = {}
    topic_hrefs = {}
    for source in sorted(ROOT.rglob('*.html')):
        if any(part in SKIP for part in source.relative_to(ROOT).parts):
            continue
        pages += 1
        parser = References()
        try:
            parser.feed(source.read_text(encoding='utf-8'))
        except (UnicodeError, OSError) as exc:
            errors.append(f'{source.relative_to(ROOT)}: cannot read: {exc}')
            continue
        for line, value in parser.items:
            check(source, line, value, errors)
        topic_counts[source.relative_to(ROOT).as_posix()] = parser.topic_cards
        topic_hrefs[source.relative_to(ROOT).as_posix()] = parser.topic_hrefs
    math_index = ROOT / 'math/index.html'
    try:
        math_content = math_index.read_text(encoding='utf-8')
    except (UnicodeError, OSError) as exc:
        errors.append(f'math/index.html: cannot read: {exc}')
        math_content = ''
    for stage in ('middle', 'high', 'uni'):
        matches = re.findall(r'const\s+' + stage.upper() + r'\s*=\s*\[([^\]]*)\]', math_content)
        hrefs = topic_hrefs.get(f'math/{stage}/index.html', [])
        if len(matches) != 1 or not hrefs or any(not h.endswith('.html') or '/' in h for h in hrefs):
            errors.append(f'math/{stage}: cannot identify progress list or topic cards')
            continue
        entries = re.findall(r"['\"]([^'\"]+)['\"]", matches[0])
        expected = {h[:-5] for h in hrefs}
        actual = set(entries)
        if len(entries) != len(actual) or actual != expected:
            errors.append(f'math/{stage}: progress list differs; missing {sorted(expected - actual)}, '
                          f'extra {sorted(actual - expected)}, duplicates {len(entries) - len(actual)}')
    check_math_conflicts(ROOT, errors)
    for subject in ('physics', 'chemistry'):
        source = ROOT / subject / 'index.html'
        try:
            content = source.read_text(encoding='utf-8')
        except (UnicodeError, OSError) as exc:
            errors.append(f'{source.relative_to(ROOT)}: cannot read: {exc}')
            continue
        for stage in ('middle', 'high', 'uni'):
            key = f'kv-{subject}-{stage}-progress'
            matches = re.findall(r"key:\s*['\"]" + re.escape(key) +
                                 r"['\"]\s*,\s*total:\s*(\d+)", content)
            count = topic_counts.get(f'{subject}/{stage}/index.html', 0)
            if len(matches) != 1 or not count:
                errors.append(f'{subject}/{stage}: cannot identify progress total or topic cards')
            elif int(matches[0]) != count:
                errors.append(f'{subject}/{stage}: progress total {matches[0]}, topic cards {count}')
    subject_topics = {
        'computer/primary/index.html': ['robot-algorithms.html', 'repeat-loops.html', 'conditional-robot.html', 'sequential-search.html', 'adjacent-swap-sort.html'],
        'computer/middle/index.html': ['binary-pixels.html', 'message-transfer.html', 'network-paths.html', 'webpage-publishing.html', 'iot-sensor-feedback.html'],
        'computer/high/index.html': ['search-strategies.html'],
        'computer/uni/index.html': ['stack-queue.html'],
        'ai/primary/index.html': ['feature-classification-lab.html'],
        'ai/middle/index.html': ['data-label-quality.html', 'data-source-coverage.html', 'output-verification.html', 'data-minimization.html'],
        'ai/high/index.html': ['classifier-lab.html', 'train-test-generalization.html', 'threshold-errors.html'],
        'ai/uni/index.html': ['neuron-forward-pass.html'],
        'simulation-world/index.html': ['solar-system.html', 'gear-transmission.html', 'belt-pulley.html', 'slider-crank.html', 'robot-arm.html', 'assembly-line.html', 'warehouse-sort.html', 'cam-factory.html', 'line-shaft-workshop.html', 'steam-engine.html'],
    }
    for name, expected_hrefs in subject_topics.items():
        hrefs = topic_hrefs.get(name, [])
        count = topic_counts.get(name, 0)
        if count != len(expected_hrefs) or hrefs != expected_hrefs:
            errors.append(f'{name}: expected topic cards {expected_hrefs}, found {hrefs}')
    legacy_targets = {
        'computer-ai/primary/index.html': '../../computer/primary/index.html',
        'computer-ai/primary/robot-algorithms.html': '../../computer/primary/robot-algorithms.html',
        'computer-ai/middle/index.html': '../../computer/middle/index.html',
        'computer-ai/middle/binary-pixels.html': '../../computer/middle/binary-pixels.html',
        'computer-ai/high/index.html': '../../ai/high/index.html',
        'computer-ai/high/classifier-lab.html': '../../ai/high/classifier-lab.html',
        'computer-ai/uni/index.html': '../../ai/uni/index.html',
        'computer-ai/uni/neuron-forward-pass.html': '../../ai/uni/neuron-forward-pass.html',
    }
    for name, target in legacy_targets.items():
        try:
            content = (ROOT / name).read_text(encoding='utf-8')
        except (UnicodeError, OSError) as exc:
            errors.append(f'{name}: cannot read compatibility route: {exc}')
            continue
        if f'url={target}' not in content or f'href="{target}"' not in content:
            errors.append(f'{name}: missing redirect or fallback to {target}')
    try:
        legacy_home = (ROOT / 'computer-ai/index.html').read_text(encoding='utf-8')
    except (UnicodeError, OSError) as exc:
        errors.append(f'computer-ai/index.html: cannot read legacy chooser: {exc}')
    else:
        for target in ('../computer/index.html', '../ai/index.html'):
            if f'href="{target}"' not in legacy_home:
                errors.append(f'computer-ai/index.html: missing subject link {target}')
    index = ROOT / 'AGENTS.md'
    try:
        for line, text in enumerate(index.read_text(encoding='utf-8').splitlines(), 1):
            for match in re.finditer(r'(?<!!)\[[^\]]+\]\(([^\s)]+)(?:\s+[^)]*)?\)', text):
                check(index, line, match.group(1), errors)
    except (UnicodeError, OSError) as exc:
        errors.append(f'AGENTS.md: cannot read: {exc}')
    if not pages:
        errors.append('No HTML pages found')
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        print(f'FAILED: {len(errors)} issue(s)', file=sys.stderr)
        return 1
    print(f'OK: {pages} HTML pages, AGENTS.md links, math/physics/chemistry progress lists, split subject, simulation and compatibility routes checked')
    return 0


if __name__ == '__main__':
    sys.exit(main())
