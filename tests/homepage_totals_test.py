import importlib.util
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
spec = importlib.util.spec_from_file_location('check_homepage_totals', ROOT / 'scripts/check_homepage_totals.py')
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


def card(subject, total, badge=None):
    badge = total if badge is None else badge
    return (f'<a class="subject-card"><span class="subject-badge">{badge} 个知识点</span>'
            f'<div class="subject-progress" data-subject="{subject}" data-total="{total}"></div></a>')


class HomepageTotalsTest(unittest.TestCase):
    def test_counts_and_badges_match_catalog(self):
        counts = {'math': 2, 'physics': 3, 'chemistry': 4, 'science': 5, 'computer': 2, 'ai': 4}
        html = ''.join(card(name, total) for name, total in counts.items())
        self.assertEqual(checker.check(html, counts), [])
        self.assertTrue(any('progress total' in e for e in checker.check(html.replace('data-total="2"', 'data-total="1"', 1), counts)))
        self.assertTrue(any('badge' in e for e in checker.check(html.replace('3 个知识点', '9 个知识点', 1), counts)))

    def test_missing_duplicate_and_empty_subjects_are_detected(self):
        counts = {'math': 2, 'physics': 3, 'chemistry': 4, 'science': 0, 'computer': 2, 'ai': 2}
        html = ''.join(card(name, total) for name, total in counts.items()) + card('math', 2)
        errors = checker.check(html, counts)
        self.assertTrue(any('duplicate' in e for e in errors))
        self.assertTrue(any('no topics' in e for e in errors))
        self.assertTrue(any('missing' in e for e in checker.check(card('math', 2), counts)))


if __name__ == '__main__':
    unittest.main()
