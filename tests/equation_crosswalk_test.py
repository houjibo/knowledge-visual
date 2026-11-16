#!/usr/bin/env python3
"""Reject denominator and optional-scope drift in the equation crosswalk."""
import copy
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from check_curriculum_crosswalk import check_equation_baseline


class EquationCrosswalkTest(unittest.TestCase):
    def setUp(self):
        self.data = json.loads((ROOT / 'docs/plans/curriculum-crosswalks/middle-math-equations-inequalities-ce25.json').read_text())

    def test_source_baseline(self):
        check_equation_baseline(self.data)

    def test_cannot_omit_or_duplicate_source_requirement(self):
        self.data['requirements'][-1] = copy.deepcopy(self.data['requirements'][0])
        with self.assertRaises(AssertionError):
            check_equation_baseline(self.data)

    def test_optional_requirement_cannot_be_misrepresented_as_core(self):
        self.data['requirements'][3]['course_requirement'] = 'core'
        with self.assertRaises(AssertionError):
            check_equation_baseline(self.data)

    def test_source_group_cannot_drift(self):
        self.data['requirements'][-1]['module'] = '方程与不等式／方程与方程组'
        with self.assertRaises(AssertionError):
            check_equation_baseline(self.data)


if __name__ == '__main__':
    unittest.main()
