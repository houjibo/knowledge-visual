#!/usr/bin/env python3
"""Test that curriculum supply matrix totals are checked against page inventory."""
import sys
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
from check_curriculum_gap_map import check_consistency


def page(subject, stage, kind='topic'):
    return {'subject': subject, 'stage': stage, 'kind': kind}


def sample_inventory():
    return {'pages': [
        page('math', 'primary'),
        page('computer', 'high'), page('computer', 'high'),
        page('ai', 'uni'),
        page('simulation-world', None),
        page('simulation-world', None, 'navigation'),
    ]}


def sample_matrix(computer_high=2, total_high=2, summary=(4, 1, 6)):
    rows = [
        '| 学科 | 小学 | 初中 | 高中 | 大学 | 小计 |',
        '| --- | ---: | ---: | ---: | ---: | ---: |',
        '| 数学 | 1 | — | — | — | 1 |',
        '| 物理 | — | — | — | — | 0 |',
        '| 化学 | — | — | — | — | 0 |',
        '| 科学 | — | — | — | — | 0 |',
        f'| 计算机 | — | — | {computer_high} | — | {computer_high} |',
        '| 人工智能 | — | — | — | 1 | 1 |',
        f'| **学科主题合计** | **1** | **0** | **{total_high}** | **1** | **4** |',
    ]
    return '\n'.join([
        f'当前 {summary[0]} 个学科主题、{summary[1]} 个模拟场景；项目总计 {summary[2]} 个 HTML。',
        '', '## 六学科×四阶段供给矩阵', '', *rows, '', '## 下一节',
    ])


class CurriculumGapMapTest(unittest.TestCase):
    def test_matrix_and_summary_match_inventory(self):
        self.assertEqual(check_consistency(sample_inventory(), sample_matrix()), [])

    def test_stale_stage_counts_and_summary_are_reported(self):
        errors = check_consistency(sample_inventory(), sample_matrix(computer_high=1, total_high=1, summary=(3, 1, 6)))
        self.assertTrue(any('计算机/high' in error for error in errors), errors)
        self.assertTrue(any('total/high' in error for error in errors), errors)
        self.assertTrue(any('inventory summary' in error for error in errors), errors)

    def test_missing_subject_row_fails(self):
        text = sample_matrix().replace('| 人工智能 | — | — | — | 1 | 1 |\n', '')
        with self.assertRaisesRegex(ValueError, 'missing subjects'):
            check_consistency(sample_inventory(), text)


if __name__ == '__main__':
    unittest.main()
