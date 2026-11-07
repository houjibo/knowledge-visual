#!/usr/bin/env python3
"""Inventory static investigation cues; this is not a functional audit."""
import argparse
from html.parser import HTMLParser
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
IGNORED = {'.git', 'node_modules'}
CONTROL_CLASSES = {'tab', 'mode-btn', 'quiz-opt'}
WHILE = re.compile(r'\bwhile\s*\(')


class RiskParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.script = False
        self.controls = []
        self.loops = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'div':
            classes = set((attrs.get('class') or '').split()) & CONTROL_CLASSES
            if classes:
                self.controls.append((self.getpos()[0], ', '.join(sorted(classes))))
        if tag == 'script' and not attrs.get('src'):
            self.script = True

    def handle_endtag(self, tag):
        if tag == 'script':
            self.script = False

    def handle_data(self, data):
        if self.script:
            start = self.getpos()[0]
            for match in WHILE.finditer(data):
                self.loops.append(start + data.count('\n', 0, match.start()))


def scan(root):
    root = Path(root).resolve()
    result = []
    for path in sorted(root.rglob('*.html')):
        rel = path.relative_to(root)
        if any(part in IGNORED for part in rel.parts):
            continue
        parser = RiskParser()
        parser.feed(path.read_text(encoding='utf-8'))
        if parser.controls or parser.loops:
            result.append({'path': rel.as_posix(), 'controls': parser.controls, 'loops': parser.loops})
    return result


def render(result):
    controls = sum(bool(page['controls']) for page in result)
    loops = sum(bool(page['loops']) for page in result)
    lines = [
        '# 交互风险线索', '',
        '> 自动生成：`python3 scripts/interaction_risks.py --output docs/assessments/interaction-risks.md`。',
        '> 仅扫描仓库内 HTML 的静态 div 标签和内联脚本；以下是调查线索，不能证明存在缺陷或功能已验收。',
        '> div 可能已有键盘处理；while 可能有确定终止条件。脚本字符串、注释可能产生误报；外部脚本、其他标签及 for 循环未覆盖。', '',
        f'含候选 div 控件的页面：{controls}；含内联 while 的页面：{loops}。同一页面可能出现在两类中。', '',
        '核查时先确认控件是否响应键盘，或循环是否有有限候选与退出条件；复现后再按问题解决工作流建立变更。', '',
    ]
    for title, key in [('候选 div 控件', 'controls'), ('内联 while 循环', 'loops')]:
        lines.extend([f'## {title}', ''])
        for page in result:
            values = page[key]
            if not values:
                continue
            details = '、'.join(f'{line} 行（{classes}）' for line, classes in values) if key == 'controls' else '、'.join(f'{line} 行' for line in values)
            lines.append(f"- [{page['path']}](../../{page['path']})：{details}")
        lines.append('')
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--output', type=Path)
    group.add_argument('--check', type=Path)
    args = parser.parse_args()
    content = render(scan(ROOT))
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(content, encoding='utf-8')
        return 0
    if not args.check.exists() or args.check.read_text(encoding='utf-8') != content:
        print(f'Interaction risk inventory is stale: {args.check}', file=sys.stderr)
        return 1
    print(f'Interaction risk inventory is current: {args.check}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
