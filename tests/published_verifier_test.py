import functools
import importlib.util
import json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import subprocess
import tempfile
import threading
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent.parent

def load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / (name + '.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

builder = load('build_site')
verifier = load('verify_published_site')


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


class PublishedVerifierTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.root = Path(cls.temp.name)
        cls.site = cls.root / 'knowledge-visual'
        builder.build(cls.site)
        cls.manifest_path = cls.site / 'release-version.json'
        cls.manifest = json.loads(cls.manifest_path.read_text())
        cls.sha = cls.manifest['revision']
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(cls.root)))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f'http://127.0.0.1:{cls.server.server_port}/knowledge-visual/'

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()
        cls.temp.cleanup()

    def setUp(self):
        self.manifest_path.write_text(json.dumps({**self.manifest, 'site_files_modified': False}))

    def test_clean_release_can_be_verified_under_subpath(self):
        self.assertEqual(verifier.verify(self.base, self.sha, allow_http=True), 81)
        result = subprocess.run(['python3', str(ROOT / 'scripts/verify_published_site.py'),
                                 '--base-url', self.base, '--expected-revision', self.sha,
                '--allow-http-loopback', '--attempts', '1'], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn(self.sha, result.stdout)

    def test_old_or_modified_release_is_rejected(self):
        for change in ({'revision': 'f' * 40}, {'site_files_modified': True}):
            self.manifest_path.write_text(json.dumps({**self.manifest, **change}))
            with self.assertRaisesRegex(ValueError, 'does not match'):
                verifier.verify(self.base, self.sha, allow_http=True)

    def test_missing_or_wrong_content_is_rejected(self):
        target = self.site / 'science/sink-float.html'
        original = target.read_bytes()
        try:
            target.write_text('<title>not the topic</title>')
            with self.assertRaisesRegex(ValueError, 'expected content'):
                verifier.verify(self.base, self.sha, allow_http=True)
            target.unlink()
            with self.assertRaisesRegex(ValueError, 'HTTP 404'):
                verifier.verify(self.base, self.sha, allow_http=True)
        finally:
            target.write_bytes(original)

    def test_requires_https_except_loopback_test(self):
        with self.assertRaisesRegex(ValueError, 'HTTPS is required'):
            verifier.normalize_base('http://example.com/site/', allow_http=True)
        with self.assertRaisesRegex(ValueError, 'HTTPS is required'):
            verifier.normalize_base(self.base)
        with self.assertRaisesRegex(ValueError, 'full lowercase'):
            verifier.verify(self.base, 'abc', allow_http=True)

    def test_retries_transient_failures_and_stops_on_success(self):
        args = ['verify_published_site.py', '--base-url', self.base, '--expected-revision', self.sha,
                '--allow-http-loopback', '--attempts', '2', '--delay-seconds', '0']
        with patch('sys.argv', args), patch.object(verifier, 'verify', side_effect=[ValueError('not ready'), 48]) as verify:
            self.assertEqual(verifier.main(), 0)
            self.assertEqual(verify.call_count, 2)


if __name__ == '__main__':
    unittest.main()
