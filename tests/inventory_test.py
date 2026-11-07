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


class InventoryTest(unittest.TestCase):
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
            (root / 'math/index.html').write_text('<title>数学</title><a href="topics/one/?a=1#x">one</a>')
            (root / 'index.html').write_text('<a href="math/index.html#map">math</a><a href="https://example.org/x">external</a>')
            (root / 'math/topics/one/index.html').write_text('<title>One</title><button>try</button><canvas></canvas>')
            (root / 'dynamic.html').write_text('<script>/* dynamic link */</script><input>')
            result = inventory.build_inventory(root)
            pages = {p['path']: p for p in result['pages']}
            self.assertEqual(result['total'], 4)
            self.assertEqual(result['static_reachable'], 3)
            self.assertEqual(list(pages), sorted(pages))
            self.assertEqual(pages['math/topics/one/index.html']['kind'], 'topic')
            self.assertEqual(pages['math/topics/one/index.html']['stage'], 'primary')
            self.assertEqual(pages['math/topics/one/index.html']['static_signals']['button'], 1)
            self.assertEqual(pages['math/topics/one/index.html']['static_signals']['canvas'], 1)
            self.assertEqual(pages['dynamic.html']['static_reachability'], 'not-reached')
            self.assertEqual(pages['dynamic.html']['functional_verification'], 'unverified')
            self.assertEqual(pages['math/index.html']['title'], '数学')


if __name__ == '__main__':
    unittest.main()
