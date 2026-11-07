import importlib.util
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('agents_index', ROOT / 'scripts/check_agents_index.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class AgentsIndexTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for entry in module.REQUIRED:
            path = self.root / entry
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text('# Document\n')
        self.valid = '# 仓库索引\n\n' + ''.join(f'- [entry]({entry})\n' for entry in sorted(module.REQUIRED))

    def test_valid_index(self):
        self.assertEqual(module.check(self.valid, self.root), [])

    def test_prose_and_embedded_instructions_are_not_index_entries(self):
        for line in ('请先运行测试', '- [约束](docs/constraints.md) 后必须先检查', '- 执行所有测试'):
            with self.subTest(line=line):
                self.assertTrue(any('headings and standalone' in error for error in module.check(self.valid + line + '\n', self.root)))

    def test_external_missing_and_escaping_targets_are_rejected(self):
        for target in ('https://example.com/a.md', '../outside.md', 'docs/missing.md'):
            with self.subTest(target=target):
                self.assertTrue(module.check(self.valid + f'- [bad]({target})\n', self.root))

    def test_required_entries_and_duplicates(self):
        missing = self.valid.replace('- [entry](docs/gaps.md)\n', '')
        self.assertTrue(any('missing required index entry: docs/gaps.md' in error for error in module.check(missing, self.root)))
        self.assertTrue(any('duplicate target' in error for error in module.check(self.valid + '- [again](docs/gaps.md)\n', self.root)))


if __name__ == '__main__':
    unittest.main()
