import importlib.util
from contextlib import redirect_stderr, redirect_stdout
from io import StringIO
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('check_markdown_links', ROOT / 'scripts/check_markdown_links.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class MarkdownLinksTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'docs/assets').mkdir(parents=True)
        (self.root / 'docs/guide').mkdir()
        (self.root / 'docs/target.md').write_text('# Target\n', encoding='utf-8')
        (self.root / 'docs/target copy.md').write_text('# Copy\n', encoding='utf-8')
        (self.root / 'docs/assets/图 标.svg').write_text('<svg/>', encoding='utf-8')

    def test_checks_inline_image_reference_encoded_and_directory_targets(self):
        source = self.root / 'docs/guide/page.md'
        source.write_text(
            '[target](../target.md#heading)\n'
            '![image](<../assets/图 标.svg>)\n'
            '[encoded image](../assets/%E5%9B%BE%20%E6%A0%87.svg?raw=1)\n'
            '[copy](<../target copy.md>)\n'
            '[directory](../guide/)\n'
            '[reference][guide]\n'
            '[guide]: ../target.md "Guide"\n'
            '[external](https://example.com/guide)\n'
            '[fragment](#local-heading)\n',
            encoding='utf-8',
        )
        errors, files, destinations = module.check(self.root)
        self.assertEqual(errors, [])
        self.assertEqual(files, 3)
        self.assertEqual(destinations, 6)

    def test_reports_missing_and_repository_escaping_targets_with_line_numbers(self):
        source = self.root / 'docs/broken.md'
        source.write_text('[missing](absent.md)\n[escape](../../outside.md)\n', encoding='utf-8')
        errors, _, _ = module.check(self.root)
        self.assertEqual(len(errors), 2)
        self.assertIn('docs/broken.md:1: missing local target: absent.md', errors[0])
        self.assertIn('docs/broken.md:2: target escapes repository: ../../outside.md', errors[1])

    def test_ignores_external_fragment_and_inline_or_fenced_code(self):
        source = self.root / 'docs/samples.md'
        source.write_text(
            '[external](https://example.com/missing)\n'
            '[mail](mailto:team@example.com)\n'
            '[fragment](#heading)\n'
            '`[inline](missing.md)`\n'
            '```md\n[example](missing.md)\n```\n',
            encoding='utf-8',
        )
        errors, _, destinations = module.check(self.root)
        self.assertEqual(errors, [])
        self.assertEqual(destinations, 0)

    def test_reports_unreadable_markdown(self):
        bad = self.root / 'docs/unreadable.md'
        bad.write_bytes(b'\xff')
        errors, _, _ = module.check(self.root)
        self.assertTrue(any('docs/unreadable.md: cannot read' in error for error in errors))

    def test_cli_returns_nonzero_and_reports_source_for_broken_link(self):
        (self.root / 'docs/broken.md').write_text('[bad](missing.md)\n', encoding='utf-8')
        output = StringIO()
        with redirect_stderr(output):
            status = module.main(self.root)
        self.assertEqual(status, 1)
        self.assertIn('docs/broken.md:1: missing local target: missing.md', output.getvalue())

    def test_cli_returns_zero_for_valid_links(self):
        (self.root / 'docs/valid.md').write_text('[ok](target.md)\n', encoding='utf-8')
        output = StringIO()
        with redirect_stdout(output):
            status = module.main(self.root)
        self.assertEqual(status, 0)
        self.assertIn('Markdown files', output.getvalue())

    def test_skips_dependency_and_git_markdown(self):
        for directory in ('.git', 'node_modules'):
            path = self.root / directory
            path.mkdir()
            (path / 'ignored.md').write_text('[bad](missing.md)', encoding='utf-8')
        _, files, _ = module.check(self.root)
        self.assertEqual(files, 2)


if __name__ == '__main__':
    unittest.main()
