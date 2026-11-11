import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

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
                         'physics/high/assets/gravitation-model.js',
                         'physics/high/assets/electrostatic-model.js',
                         'math/topics/addition/index.html', 'physics/middle/motion.html',
                         'chemistry/high/mole-concept.html', 'science/sink-float.html',
                         'computer/index.html', 'computer/primary/index.html',
                         'computer/primary/robot-algorithms.html', 'computer/middle/binary-pixels.html',
                         'ai/index.html', 'ai/primary/index.html', 'ai/primary/feature-classification-lab.html',
                         'ai/middle/index.html', 'ai/middle/data-label-quality.html',
                         'ai/middle/data-source-coverage.html',
                         'ai/middle/output-verification.html',
                         'ai/middle/data-minimization.html',
                         'ai/high/index.html', 'ai/high/classifier-lab.html',
                         'ai/high/train-test-generalization.html',
                         'simulation-world/index.html', 'simulation-world/solar-system.html',
                         'assets/vendor/three-r128/three.min.js', 'assets/vendor/three-r128/OrbitControls.js',
                         'assets/vendor/three-r128/CSS2DRenderer.js', 'assets/vendor/three-r128/LICENSE',
                         'ai/uni/neuron-forward-pass.html', 'computer-ai/index.html',
                         'computer-ai/primary/robot-algorithms.html', 'computer-ai/high/classifier-lab.html']:
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

    def test_manifest_reports_revision_and_tracked_site_changes(self):
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp) / 'repo'
            repo.mkdir()
            def git(*args):
                return subprocess.check_output(['git', *args], cwd=repo, text=True).strip()
            git('init', '-q')
            (repo / 'index.html').write_text('<title>site</title>', encoding='utf-8')
            (repo / 'favicon.ico').write_bytes(b'icon')
            (repo / 'science').mkdir()
            (repo / 'science' / 'extra.html').write_text('<title>extra</title>', encoding='utf-8')
            git('add', 'index.html', 'favicon.ico', 'science/extra.html')
            git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'initial')
            revision = git('rev-parse', 'HEAD')
            with patch.object(builder, 'ROOT', repo):
                clean = Path(tmp) / 'clean'
                builder.build(clean)
                self.assertEqual(json.loads((clean / 'release-version.json').read_text()), {
                    'schema_version': 1, 'revision': revision, 'site_files_modified': False})
                (repo / 'index.html').write_text('<title>changed</title>', encoding='utf-8')
                dirty = Path(tmp) / 'dirty'
                builder.build(dirty)
                self.assertEqual(json.loads((dirty / 'release-version.json').read_text()), {
                    'schema_version': 1, 'revision': revision, 'site_files_modified': True})
                git('checkout', '--', 'index.html')
                git('rm', '-q', 'science/extra.html')
                deleted = Path(tmp) / 'deleted'
                builder.build(deleted)
                self.assertTrue(json.loads((deleted / 'release-version.json').read_text())['site_files_modified'])


if __name__ == '__main__':
    unittest.main()
