import importlib.util
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('build_site', ROOT / 'scripts/build_site.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class ReleaseArtifactTest(unittest.TestCase):
    def test_release_contains_site_but_not_repository_or_backups(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / 'site'
            self.assertGreater(builder.build(output), 300)
            for name in ['index.html', 'favicon.ico', 'assets/topic-catalog.js',
                         'math/topics/addition/index.html', 'physics/middle/motion.html',
                         'chemistry/high/mole-concept.html', 'science/sink-float.html']:
                self.assertTrue((output / name).is_file(), name)
            for name in ['.git', '.github', 'docs', 'openspec', 'tests', 'node_modules', 'README.md']:
                self.assertFalse((output / name).exists(), name)
            self.assertEqual(list(output.rglob('*.orig')), [])
            self.assertFalse(any(any(part.startswith('.') for part in p.relative_to(output).parts)
                                 for p in output.rglob('*')))

    def test_existing_directory_is_never_overwritten(self):
        with tempfile.TemporaryDirectory() as tmp:
            marker = Path(tmp) / 'keep.txt'
            marker.write_text('keep')
            with self.assertRaises(ValueError):
                builder.build(tmp)
            self.assertEqual(marker.read_text(), 'keep')


if __name__ == '__main__':
    unittest.main()
