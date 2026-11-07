import copy
import importlib.util
from pathlib import Path
import tempfile
import unittest
import sys

sys.dont_write_bytecode = True

MODULE_PATH = Path(__file__).resolve().parents[1] / 'scripts/interaction_coverage.py'
spec = importlib.util.spec_from_file_location('interaction_coverage', MODULE_PATH)
coverage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(coverage)


class InteractionCoverageTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'tests/browser').mkdir(parents=True)
        (self.root / 'tests/browser/example.spec.js').write_text('// example')
        self.inventory = {'pages': [
            {'path': 'math/a.html', 'title': '甲', 'kind': 'topic'},
            {'path': 'math/b.html', 'title': '乙', 'kind': 'topic'},
            {'path': 'math/index.html', 'title': '目录', 'kind': 'navigation'},
        ]}
        self.evidence = {'groups': [{'id': 'example', 'pages': ['math/a.html'],
                                    'tests': ['tests/browser/example.spec.js'], 'scope': '部分交互。'}]}
        self.command = 'playwright test tests/browser/example.spec.js'

    def test_report_distinguishes_partial_from_unregistered(self):
        report = coverage.render(self.inventory, self.evidence, self.command, self.root)
        self.assertIn('主题总数：2；已登记部分交互证据：1；尚未登记：1', report)
        self.assertIn('[甲](../../math/a.html)', report)
        self.assertIn('[乙](../../math/b.html)', report)
        self.assertNotIn('[目录]', report)

    def test_rejects_unknown_page_or_test_not_in_suite(self):
        evidence = copy.deepcopy(self.evidence)
        evidence['groups'][0]['pages'] = ['math/missing.html']
        with self.assertRaisesRegex(ValueError, 'unknown topic'):
            coverage.render(self.inventory, evidence, self.command, self.root)
        with self.assertRaisesRegex(ValueError, 'not in test:browser'):
            coverage.render(self.inventory, self.evidence, 'playwright test', self.root)

    def test_rejects_duplicate_group_or_missing_test(self):
        evidence = copy.deepcopy(self.evidence)
        evidence['groups'].append(copy.deepcopy(evidence['groups'][0]))
        with self.assertRaisesRegex(ValueError, 'duplicate or empty'):
            coverage.render(self.inventory, evidence, self.command, self.root)
        evidence = copy.deepcopy(self.evidence)
        evidence['groups'][0]['tests'] = ['tests/browser/missing.spec.js']
        with self.assertRaisesRegex(ValueError, 'missing browser test'):
            coverage.render(self.inventory, evidence, self.command, self.root)


if __name__ == '__main__':
    unittest.main()
