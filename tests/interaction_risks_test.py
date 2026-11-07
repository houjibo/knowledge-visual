import importlib.util
from pathlib import Path
import tempfile
import subprocess
import unittest
import sys

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('interaction_risks', ROOT / 'scripts/interaction_risks.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class InteractionRiskTests(unittest.TestCase):
    def test_static_controls_and_inline_loops_with_lines(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'a.html').write_text('<title>x</title>\n<div class="tab active">Tab</div>\n<button class="mode-btn">Native</button>\n<script>\nwhile (x) { x--; }\n</script>\n')
            (root / 'b.html').write_text('<script src="external.js"></script><div class="tabs">Container</div>')
            (root / 'node_modules').mkdir()
            (root / 'node_modules/ignored.html').write_text('<div class="tab"></div>')
            result = module.scan(root)
            self.assertEqual(result, [{'path': 'a.html', 'controls': [(2, 'tab')], 'loops': [5]}])
            report = module.render(result)
            self.assertIn('含候选 div 控件的页面：1', report)
            self.assertIn('2 行（tab）', report)
            self.assertIn('5 行', report)
            self.assertIn('不能证明存在缺陷', report)

    def test_cli_detects_stale_inventory(self):
        with tempfile.TemporaryDirectory() as tmp:
            report = Path(tmp) / 'report.md'
            script = ROOT / 'scripts/interaction_risks.py'
            subprocess.run([sys.executable, str(script), '--output', str(report)], check=True)
            fresh = subprocess.run([sys.executable, str(script), '--check', str(report)], capture_output=True)
            self.assertEqual(fresh.returncode, 0)
            report.write_text('stale')
            stale = subprocess.run([sys.executable, str(script), '--check', str(report)], capture_output=True)
            self.assertNotEqual(stale.returncode, 0)
            self.assertIn(b'stale', stale.stderr)

    def test_div_class_token_and_multiple_inline_scripts(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'a.html').write_text('<div class="tabular">no</div>\n<div class="quiz-opt mode-btn">yes</div>\n<script>while(a){}</script>\n<script>while(b){}</script>')
            result = module.scan(root)
            self.assertEqual(result[0]['controls'], [(2, 'mode-btn, quiz-opt')])
            self.assertEqual(result[0]['loops'], [3, 4])
            self.assertEqual(module.render(result), module.render(module.scan(root)))


if __name__ == '__main__':
    unittest.main()
