"""Execute the actual workflow gate; do not maintain a test-only predicate."""
import itertools
import os
from pathlib import Path
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from scripts.check_pages_publisher import quality_gate_script


class QualityResultsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.script = quality_gate_script((ROOT / '.github/workflows/checks.yml').read_text(encoding='utf-8'))

    def execute_gate(self, core, browser):
        env = os.environ.copy()
        for key in ('BASH_ENV', 'ENV', 'CORE_RESULT', 'BROWSER_RESULT'):
            env.pop(key, None)
        if core is not None:
            env['CORE_RESULT'] = core
        if browser is not None:
            env['BROWSER_RESULT'] = browser
        return subprocess.run(['bash', '-c', self.script], env=env, text=True,
                              capture_output=True, timeout=5)

    def test_only_both_success_pass_the_real_inline_gate(self):
        states = ('success', 'failure', 'cancelled', 'skipped', '', 'unknown', None)
        for core, browser in itertools.product(states, repeat=2):
            with self.subTest(core=core, browser=browser):
                result = self.execute_gate(core, browser)
                self.assertEqual(result.returncode == 0, core == browser == 'success',
                                 f'gate output: {result.stdout!r}; {result.stderr!r}')

    def test_success_output_identifies_both_upstream_results(self):
        result = self.execute_gate('success', 'success')
        self.assertEqual(result.returncode, 0)
        self.assertIn('core-checks=success browser-interactions=success', result.stdout)


if __name__ == '__main__':
    unittest.main()
