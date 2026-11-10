"""Validate Purpose extraction and diagnostics for main OpenSpec specs."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('spec_purposes', ROOT / 'scripts/check_spec_purposes.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SpecPurposesTest(unittest.TestCase):
    def test_valid_multiline_purpose(self):
        text = ('# capability Specification\n\n## Purpose\n\n'
                '该规格概括能力的用途与边界，描述主题范围、学习者操作、反馈和失败恢复。\n'
                '用途可以分为多行，但仍属于同一个 Purpose 段。\n\n## Requirements\n')
        self.assertEqual(module.check_spec('openspec/specs/example/spec.md', text), [])

    def test_missing_purpose_reports_spec_path(self):
        errors = module.check_spec('openspec/specs/example/spec.md', '# Example\n\n## Requirements\n')
        self.assertEqual(len(errors), 1)
        self.assertIn('openspec/specs/example/spec.md', errors[0])
        self.assertIn('missing ## Purpose', errors[0])

    def test_short_purpose_is_rejected(self):
        errors = module.check_spec('example/spec.md', '# Example\n\n## Purpose\n短用途。\n\n## Requirements\n')
        self.assertEqual(len(errors), 1)
        self.assertIn('at least 50 characters', errors[0])

    def test_archive_placeholder_is_rejected_even_when_long(self):
        text = ('# Example\n\n## Purpose\nTBD - created by archiving change example. '
                'This placeholder is intentionally long enough to pass the length rule.\n\n## Requirements\n')
        errors = module.check_spec('example/spec.md', text)
        self.assertEqual(len(errors), 1)
        self.assertIn('archive placeholder', errors[0])

    def test_repository_check_reports_each_invalid_path(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'openspec/specs/valid').mkdir(parents=True)
            (root / 'openspec/specs/missing').mkdir()
            (root / 'openspec/specs/valid/spec.md').write_text(
                '# Valid\n\n## Purpose\n'
                '本规格说明可视化课程中的学习活动、交互反馈和进度恢复边界，'
                '保证贡献者能快速理解相关能力范围与工程约束。\n\n## Requirements\n',
                encoding='utf-8')
            (root / 'openspec/specs/missing/spec.md').write_text('# Missing\n\n## Requirements\n', encoding='utf-8')
            errors = module.check(root)
            self.assertEqual(len(errors), 1)
            self.assertIn('openspec/specs/missing/spec.md', errors[0])


if __name__ == '__main__':
    unittest.main()
