"""Verify static reachability and inventory classification with a small site."""
import importlib.util
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('inventory_pages', Path(__file__).resolve().parents[1] / 'scripts/inventory_pages.py')
inventory = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inventory)
check_spec = importlib.util.spec_from_file_location('check_site', Path(__file__).resolve().parents[1] / 'scripts/check_site.py')
check_site = importlib.util.module_from_spec(check_spec)
check_spec.loader.exec_module(check_site)


class InventoryTest(unittest.TestCase):
    def test_math_conflict_list_detects_new_collision(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            files = ['math/topics/shared/index.html', 'math/topics/solo/index.html',
                     'math/middle/a.html', 'math/high/shared.html', 'math/uni/b.html']
            sources = ['index.html', 'math/index.html', 'math/assets/js/common.js'] + [
                f'math/{stage}/assets/common.js' for stage in ('middle', 'high', 'uni')]
            for name in files + sources:
                file = root / name
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_text("const AMBIGUOUS_MATH_SLUGS = ['shared'];" if name in sources else '')
            errors = []
            check_site.check_math_conflicts(root, errors)
            self.assertEqual(errors, [])
            (root / 'math/middle/solo.html').write_text('')
            check_site.check_math_conflicts(root, errors)
            self.assertEqual(len(errors), len(sources))
            self.assertTrue(all('solo' in error for error in errors))

    def test_cli_detects_stale_inventory(self):
        script = Path(__file__).resolve().parents[1] / 'scripts/inventory_pages.py'
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / 'inventory.json'
            subprocess.run([sys.executable, str(script), '--output', str(output)], check=True)
            fresh = subprocess.run([sys.executable, str(script), '--check', str(output)], capture_output=True)
            self.assertEqual(fresh.returncode, 0, fresh.stderr)
            output.write_text('{}\n')
            stale = subprocess.run([sys.executable, str(script), '--check', str(output)], capture_output=True)
            self.assertNotEqual(stale.returncode, 0)
            self.assertIn(b'stale', stale.stderr)

    def test_reachability_and_signals(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'math/topics/one').mkdir(parents=True)
            (root / 'computer/primary').mkdir(parents=True)
            (root / 'ai/high').mkdir(parents=True)
            (root / 'computer-ai/primary').mkdir(parents=True)
            (root / 'math/index.html').write_text('<title>数学</title><a href="topics/one/?a=1#x">one</a>')
            (root / 'computer/index.html').write_text('<title>计算机</title><a href="primary/index.html">小学</a>')
            (root / 'computer/primary/index.html').write_text('<a href="robot-algorithms.html">机器人算法</a>')
            (root / 'ai/index.html').write_text('<title>人工智能</title><a href="high/index.html">高中</a>')
            (root / 'ai/high/index.html').write_text('<a href="classifier-lab.html">分类器</a><a href="train-test-generalization.html">训练测试</a>')
            (root / 'computer-ai/index.html').write_text('<title>旧入口</title><a href="../computer/index.html">计算机</a>')
            (root / 'computer-ai/primary/index.html').write_text('<meta http-equiv="refresh" content="0;url=../../computer/primary/index.html"><a href="../../computer/primary/index.html">新入口</a>')
            (root / 'index.html').write_text('<a href="math/index.html#map">math</a><a href="computer/index.html">computer</a><a href="ai/index.html">AI</a><a href="computer-ai/index.html">legacy</a><a href="https://example.org/x">external</a>')
            (root / 'math/topics/one/index.html').write_text('<title>One</title><button>try</button><canvas></canvas>')
            (root / 'computer/primary/robot-algorithms.html').write_text('<title>指令小机器人</title><button>step</button>')
            (root / 'ai/high/classifier-lab.html').write_text('<title>分类器</title><button>evaluate</button>')
            (root / 'ai/high/train-test-generalization.html').write_text('<title>训练测试</title><input type="range">')
            (root / 'computer-ai/primary/robot-algorithms.html').write_text('<meta http-equiv="refresh" content="0;url=../../computer/primary/robot-algorithms.html"><a href="../../computer/primary/robot-algorithms.html">新主题</a>')
            (root / 'dynamic.html').write_text('<script>/* dynamic link */</script><input>')
            result = inventory.build_inventory(root)
            pages = {p['path']: p for p in result['pages']}
            self.assertEqual(result['total'], 14)
            self.assertEqual(result['static_reachable'], 11)
            self.assertEqual(list(pages), sorted(pages, key=Path))
            self.assertEqual(pages['math/topics/one/index.html']['kind'], 'topic')
            self.assertEqual(pages['math/topics/one/index.html']['stage'], 'primary')
            self.assertEqual(pages['computer/primary/robot-algorithms.html']['subject'], 'computer')
            self.assertEqual(pages['computer/primary/robot-algorithms.html']['stage'], 'primary')
            self.assertEqual(pages['ai/high/classifier-lab.html']['subject'], 'ai')
            self.assertEqual(pages['ai/high/train-test-generalization.html']['subject'], 'ai')
            self.assertEqual(pages['ai/high/train-test-generalization.html']['stage'], 'high')
            self.assertEqual(pages['computer-ai/primary/robot-algorithms.html']['kind'], 'compatibility')
            self.assertIsNone(pages['computer-ai/primary/robot-algorithms.html']['subject'])
            self.assertEqual(pages['math/topics/one/index.html']['static_signals']['button'], 1)
            self.assertEqual(pages['math/topics/one/index.html']['static_signals']['canvas'], 1)
            self.assertEqual(pages['dynamic.html']['static_reachability'], 'not-reached')
            self.assertEqual(pages['dynamic.html']['functional_verification'], 'unverified')
            self.assertEqual(pages['math/index.html']['title'], '数学')


if __name__ == '__main__':
    unittest.main()
