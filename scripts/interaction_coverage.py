#!/usr/bin/env python3
"""Validate curated interaction evidence and render an honest per-topic index."""
import argparse
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent


def render(inventory, evidence, browser_command, root):
    topics = {p['path']: p for p in inventory['pages'] if p['kind'] == 'topic'}
    groups = evidence['groups']
    by_page = {}
    seen = set()
    for group in groups:
        group_id = group['id']
        if not group_id or group_id in seen:
            raise ValueError(f'duplicate or empty group id: {group_id}')
        seen.add(group_id)
        if not group['scope'].strip() or not group['pages'] or not group['tests']:
            raise ValueError(f'incomplete evidence group: {group_id}')
        if len(set(group['pages'])) != len(group['pages']):
            raise ValueError(f'duplicate pages in group: {group_id}')
        for test in group['tests']:
            if not test.startswith('tests/browser/') or '..' in Path(test).parts or not (root / test).is_file():
                raise ValueError(f'missing browser test: {test}')
            if test not in browser_command.split():
                raise ValueError(f'test not in test:browser: {test}')
        for page in group['pages']:
            if page not in topics:
                raise ValueError(f'unknown topic: {page}')
            by_page.setdefault(page, []).append(group)
    lines = [
        '# 主题交互证据索引', '',
        '> 自动生成：`python3 scripts/interaction_coverage.py --output docs/assessments/interaction-coverage.md`。',
        '> 本索引只记录已登记的部分自动化场景，不表示测试本次已运行、主题已验收、教学内容正确或无障碍达标。',
        '> 加载冒烟不算交互证据；未登记不等于一定没有测试。具体场景以链接的测试代码为准。', '',
        f"主题总数：{len(topics)}；已登记部分交互证据：{len(by_page)}；尚未登记：{len(topics) - len(by_page)}。", '',
        '## 已登记部分交互证据', '',
    ]
    for page in sorted(by_page):
        title = topics[page]['title'].replace('|', '\\|')
        lines.append(f'- [{title}](../../{page})')
        for group in by_page[page]:
            links = '、'.join(f'[{Path(test).name}](../../{test})' for test in group['tests'])
            lines.append(f"  - {group['scope']} {links}")
    lines.extend(['', '## 尚未登记交互证据', '',
                  '这些主题可能只有加载检查，或现有测试尚未归档到本索引；应逐项核查，不将其视为已验收。', ''])
    for page in sorted(topics.keys() - by_page.keys()):
        title = topics[page]['title'].replace('|', '\\|')
        lines.append(f'- [{title}](../../{page})')
    return '\n'.join(lines) + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--output', type=Path)
    mode.add_argument('--check', type=Path)
    args = parser.parse_args()
    try:
        inventory = json.loads((ROOT / 'docs/assessments/page-inventory.json').read_text())
        evidence = json.loads((ROOT / 'docs/assessments/interaction-evidence.json').read_text())
        command = json.loads((ROOT / 'package.json').read_text())['scripts']['test:browser']
        result = render(inventory, evidence, command, ROOT)
        if args.output:
            args.output.write_text(result)
        elif args.check.read_text() != result:
            raise ValueError(f'interaction coverage index is stale: {args.check}')
        else:
            print(f'Interaction coverage index is current: {args.check}')
    except (OSError, ValueError, KeyError, TypeError) as exc:
        print(f'Interaction coverage error: {exc}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
