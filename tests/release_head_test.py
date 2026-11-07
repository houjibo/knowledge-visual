import os
import pathlib
import subprocess
import tempfile
import unittest

SCRIPT = pathlib.Path(__file__).resolve().parents[1] / 'scripts/check_release_head.sh'


class ReleaseHeadTest(unittest.TestCase):
    def test_current_superseded_and_fetch_failure(self):
        with tempfile.TemporaryDirectory() as temp:
            root = pathlib.Path(temp)
            remote, repo, output = root / 'remote.git', root / 'repo', root / 'output'
            def git(*args, cwd=None):
                return subprocess.run(['git', *args], cwd=cwd, check=True, capture_output=True, text=True).stdout.strip()
            git('init', '--bare', str(remote))
            git('init', '-b', 'main', str(repo))
            git('config', 'user.name', 'Release Test', cwd=repo)
            git('config', 'user.email', 'release-test@example.invalid', cwd=repo)
            git('remote', 'add', 'origin', str(remote), cwd=repo)
            (repo / 'page').write_text('first')
            git('add', 'page', cwd=repo)
            git('commit', '-m', 'first', cwd=repo)
            first = git('rev-parse', 'HEAD', cwd=repo)
            git('push', 'origin', 'main', cwd=repo)
            env = dict(os.environ, GITHUB_SHA=first, GITHUB_OUTPUT=str(output))
            result = subprocess.run(['bash', str(SCRIPT)], cwd=repo, env=env, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(output.read_text(), 'current=true\n')
            (repo / 'page').write_text('second')
            git('commit', '-am', 'second', cwd=repo)
            git('push', 'origin', 'main', cwd=repo)
            output.unlink()
            result = subprocess.run(['bash', str(SCRIPT)], cwd=repo, env=env, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(output.read_text(), 'current=false\n')
            output.unlink()
            git('remote', 'set-url', 'origin', str(root / 'missing.git'), cwd=repo)
            result = subprocess.run(['bash', str(SCRIPT)], cwd=repo, env=env, capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertFalse(output.exists())


if __name__ == '__main__':
    unittest.main()
