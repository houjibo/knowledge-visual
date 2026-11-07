"""Validate generated catalog identity, aliases, and stale detection."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/build_topic_catalog.py'


class CatalogTest(unittest.TestCase):
    def test_aliases_and_stale_detection(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            files = {
                'index.html': '<title>首页</title><a href="math/index.html">数学</a>',
                'math/index.html': '<title>数学</title><a href="topics/addition/">加法 <span>G1</span></a>'
                                   '<a href="topics/addition/index.html">计算</a>',
                'math/topics/addition/index.html': '<title>10以内加减法</title>',
                'math/middle/index.html': '<a href="addition.html">初中加法</a>',
                'math/middle/addition.html': '<title>10以内加减法</title>',
            }
            for name, content in files.items():
                file = root / name
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_text(content, encoding='utf-8')
            output = root / 'catalog.js'
            subprocess.run([sys.executable, str(SCRIPT), '--root', str(root), '--output', str(output)], check=True)
            data = output.read_text(encoding='utf-8').split('window.KV_TOPIC_CATALOG = ', 1)[1].rsplit(';', 1)[0]
            entries = json.loads(data)
            self.assertEqual(len(entries), 2)  # identical titles must not merge
            primary = next(x for x in entries if x['stage'] == 'primary')
            self.assertEqual(primary['title'], '10以内加减法')
            self.assertIn('加法 G1', primary['aliases'])
            self.assertIn('计算', primary['aliases'])
            subprocess.run([sys.executable, str(SCRIPT), '--root', str(root), '--check', str(output)], check=True, capture_output=True)
            (root / 'math/index.html').write_text('<a href="topics/addition/">新名称</a>', encoding='utf-8')
            stale = subprocess.run([sys.executable, str(SCRIPT), '--root', str(root), '--check', str(output)], capture_output=True)
            self.assertNotEqual(stale.returncode, 0)
            self.assertIn(b'stale', stale.stderr)


if __name__ == '__main__':
    unittest.main()
