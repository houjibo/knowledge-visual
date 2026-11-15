#!/usr/bin/env python3
"""Check the curriculum supply matrix against the generated page inventory."""
from collections import Counter
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
SUBJECTS = {
    '数学': 'math',
    '物理': 'physics',
    '化学': 'chemistry',
    '科学': 'science',
    '计算机': 'computer',
    '人工智能': 'ai',
}
STAGES = ('primary', 'middle', 'high', 'uni')
SUMMARY = re.compile(r'当前\s+(\d+)\s+个学科主题、\s*(\d+)\s+个模拟场景；项目总计\s+(\d+)\s+个 HTML')


def _cell_count(value, location):
    match = re.fullmatch(r'(\d+|—)(?:（[^）]*）)?', value.strip())
    if not match:
        raise ValueError(f'{location}: expected a topic count or em dash, found {value!r}')
    return 0 if match.group(1) == '—' else int(match.group(1))


def _matrix_rows(markdown):
    heading = '## 六学科×四阶段供给矩阵'
    if heading not in markdown:
        raise ValueError(f'missing section: {heading}')
    section = markdown.split(heading, 1)[1].split('\n## ', 1)[0]
    rows = {}
    totals = None
    header_found = False
    for line in section.splitlines():
        if not line.strip().startswith('|'):
            continue
        cells = [cell.strip().strip('*') for cell in line.strip().strip('|').split('|')]
        if cells and cells[0] == '学科':
            header_found = cells == ['学科', '小学', '初中', '高中', '大学', '小计']
            continue
        if not cells or all(re.fullmatch(r':?-{3,}:?', cell) for cell in cells):
            continue
        if len(cells) != 6:
            raise ValueError(f'matrix row has {len(cells)} columns: {line}')
        if cells[0] == '学科主题合计':
            totals = [_cell_count(value, f'{cells[0]} column {index}') for index, value in enumerate(cells[1:], 1)]
            continue
        if cells[0] not in SUBJECTS:
            raise ValueError(f'unexpected subject row: {cells[0]}')
        if cells[0] in rows:
            raise ValueError(f'duplicate subject row: {cells[0]}')
        rows[cells[0]] = [_cell_count(value, f'{cells[0]} column {index}') for index, value in enumerate(cells[1:], 1)]
    if not header_found:
        raise ValueError('supply matrix header is missing or has changed columns')
    if totals is None:
        raise ValueError('supply matrix total row is missing')
    missing = sorted(set(SUBJECTS) - set(rows))
    if missing:
        raise ValueError(f'supply matrix is missing subjects: {missing}')
    return rows, totals


def check_consistency(inventory, markdown):
    pages = inventory.get('pages')
    if not isinstance(pages, list):
        raise ValueError('page inventory must contain a pages array')
    counts = Counter()
    simulations = 0
    for page in pages:
        if not isinstance(page, dict):
            raise ValueError('page inventory entries must be objects')
        if page.get('kind') != 'topic':
            continue
        subject = page.get('subject')
        stage = page.get('stage')
        if subject == 'simulation-world':
            simulations += 1
        elif subject in SUBJECTS.values() and stage in STAGES:
            counts[(subject, stage)] += 1

    rows, totals = _matrix_rows(markdown)
    errors = []
    stage_sums = [0] * len(STAGES)
    academic_total = 0
    for label, subject in SUBJECTS.items():
        actual = [counts[(subject, stage)] for stage in STAGES]
        recorded = rows[label][:len(STAGES)]
        subtotal = rows[label][len(STAGES)]
        for index, stage in enumerate(STAGES):
            stage_sums[index] += actual[index]
            if recorded[index] != actual[index]:
                errors.append(f'{label}/{stage}: matrix has {recorded[index]}, inventory has {actual[index]}')
        expected_subtotal = sum(actual)
        academic_total += expected_subtotal
        if subtotal != expected_subtotal:
            errors.append(f'{label}: matrix subtotal {subtotal}, inventory subtotal {expected_subtotal}')
    for index, stage in enumerate(STAGES):
        if totals[index] != stage_sums[index]:
            errors.append(f'total/{stage}: matrix has {totals[index]}, inventory has {stage_sums[index]}')
    if totals[-1] != academic_total:
        errors.append(f'total: matrix has {totals[-1]}, inventory has {academic_total}')

    summary = SUMMARY.search(markdown)
    if not summary:
        errors.append('current inventory summary is missing or has changed format')
    else:
        recorded = tuple(map(int, summary.groups()))
        actual = (academic_total, simulations, len(pages))
        if recorded != actual:
            errors.append(f'inventory summary has {recorded}, page inventory has {actual}')
    return errors


def main():
    try:
        inventory = json.loads((ROOT / 'docs/assessments/page-inventory.json').read_text(encoding='utf-8'))
        markdown = (ROOT / 'docs/plans/curriculum-gap-map.md').read_text(encoding='utf-8')
        errors = check_consistency(inventory, markdown)
    except (OSError, ValueError, KeyError, TypeError) as exc:
        print(f'Curriculum gap map check failed: {exc}', file=sys.stderr)
        return 1
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        return 1
    print('Curriculum gap map counts match the page inventory')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
