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
                'index.html': '<title>首页</title><a href="math/index.html">数学</a><a href="computer/index.html">计算机</a><a href="ai/index.html">人工智能</a><a href="computer-ai/index.html">旧学科</a>',
                'math/index.html': '<title>数学</title><a href="topics/addition/">加法 <span>G1</span></a>'
                                   '<a href="topics/addition/index.html">计算</a>',
                'math/topics/addition/index.html': '<title>10以内加减法</title>',
                'math/middle/index.html': '<a href="addition.html">初中加法</a>',
                'math/middle/addition.html': '<title>10以内加减法</title>',
                'computer/index.html': '<title>计算机</title><a href="primary/index.html">小学</a>',
                'computer/primary/index.html': '<a href="robot-algorithms.html">指令算法</a>',
                'computer/primary/robot-algorithms.html': '<title>指令小机器人</title>',
                'ai/index.html': '<title>人工智能</title><a href="high/index.html">高中</a>',
                'ai/high/index.html': '<a href="classifier-lab.html">机器学习 分类边界</a>'
                                      '<a href="train-test-generalization.html">训练集与测试集实验室</a>',
                'ai/high/classifier-lab.html': '<title>分类边界实验室</title>',
                'ai/high/train-test-generalization.html': '<title>训练与测试集实验室 · 高中人工智能</title>',
                'computer-ai/index.html': '<title>旧学科</title><a href="../computer/index.html">计算机</a>',
            }
            for name, content in files.items():
                file = root / name
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_text(content, encoding='utf-8')
            output = root / 'catalog.js'
            subprocess.run([sys.executable, str(SCRIPT), '--root', str(root), '--output', str(output)], check=True)
            data = output.read_text(encoding='utf-8').split('window.KV_TOPIC_CATALOG = ', 1)[1].rsplit(';', 1)[0]
            entries = json.loads(data)
            self.assertEqual(len(entries), 5)  # identical titles must not merge
            primary = next(x for x in entries if x['subject'] == 'math' and x['stage'] == 'primary')
            self.assertEqual(primary['title'], '10以内加减法')
            self.assertIn('加法 G1', primary['aliases'])
            self.assertIn('计算', primary['aliases'])
            robot = next(x for x in entries if x['subject'] == 'computer')
            self.assertEqual(robot['stage'], 'primary')
            self.assertIn('指令算法', robot['aliases'])
            classifier = next(x for x in entries if x['subject'] == 'ai')
            self.assertEqual(classifier['stage'], 'high')
            self.assertIn('机器学习 分类边界', classifier['aliases'])
            train_test = next(x for x in entries if x['path'] == 'ai/high/train-test-generalization.html')
            self.assertEqual(train_test['subject'], 'ai')
            self.assertEqual(train_test['stage'], 'high')
            self.assertIn('训练集与测试集实验室', train_test['aliases'])
            self.assertNotIn('computer-ai', {x['subject'] for x in entries})
            subprocess.run([sys.executable, str(SCRIPT), '--root', str(root), '--check', str(output)], check=True, capture_output=True)
            (root / 'math/index.html').write_text('<a href="topics/addition/">新名称</a>', encoding='utf-8')
            stale = subprocess.run([sys.executable, str(SCRIPT), '--root', str(root), '--check', str(output)], capture_output=True)
            self.assertNotEqual(stale.returncode, 0)
            self.assertIn(b'stale', stale.stderr)


if __name__ == '__main__':
    unittest.main()
