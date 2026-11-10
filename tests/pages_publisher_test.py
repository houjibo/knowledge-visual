import tempfile
import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.check_pages_publisher import check_pages_publisher


PUBLISHER = """\
jobs:
  checks:
    timeout-minutes: 30
    steps:
      - run: npm run check
  build-release:
    needs: checks
    steps:
      - run: python3 scripts/build_site.py
      - run: verify release-version.json
  deploy:
    timeout-minutes: 20
    steps:
      - uses: actions/deploy-pages@v4
  verify-deployment:
    needs: deploy
    steps:
      - run: python3 scripts/verify_published_site.py
      - run: npx playwright test tests/browser/published-live-site.spec.js
"""


class PagesPublisherTests(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary_directory.name)
        self.workflows = self.root / ".github" / "workflows"
        self.workflows.mkdir(parents=True)

    def tearDown(self):
        self.temporary_directory.cleanup()

    def test_accepts_one_verified_publisher(self):
        publisher = self.workflows / "checks.yml"
        publisher.write_text(PUBLISHER, encoding="utf-8")
        self.assertEqual(check_pages_publisher(self.root), publisher)

    def test_rejects_checks_timeout_below_minimum(self):
        publisher = self.workflows / "checks.yml"
        publisher.write_text(PUBLISHER.replace("timeout-minutes: 30", "timeout-minutes: 20"), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "checks job must set timeout-minutes to at least 25"):
            check_pages_publisher(self.root)

    def test_accepts_checks_timeout_at_minimum(self):
        publisher = self.workflows / "checks.yml"
        publisher.write_text(PUBLISHER.replace("timeout-minutes: 30", "timeout-minutes: 25"), encoding="utf-8")
        self.assertEqual(check_pages_publisher(self.root), publisher)

    def test_rejects_missing_checks_timeout(self):
        publisher = self.workflows / "checks.yml"
        publisher.write_text(PUBLISHER.replace("    timeout-minutes: 30\n", ""), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "checks job must set timeout-minutes to at least 25"):
            check_pages_publisher(self.root)

    def test_rejects_a_second_pages_publisher(self):
        (self.workflows / "checks.yml").write_text(PUBLISHER, encoding="utf-8")
        (self.workflows / "jekyll.yml").write_text("uses: actions/deploy-pages@v5\n", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "found 2"):
            check_pages_publisher(self.root)

    def test_rejects_a_publisher_without_release_verification(self):
        (self.workflows / "checks.yml").write_text("uses: actions/deploy-pages@v4\n", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "missing required release safeguards"):
            check_pages_publisher(self.root)

    def test_rejects_deploy_timeout_below_minimum(self):
        publisher = self.workflows / "checks.yml"
        publisher.write_text(PUBLISHER.replace("timeout-minutes: 20", "timeout-minutes: 10"), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "timeout-minutes to at least 15"):
            check_pages_publisher(self.root)

    def test_accepts_deploy_timeout_at_minimum(self):
        publisher = self.workflows / "checks.yml"
        publisher.write_text(PUBLISHER.replace("timeout-minutes: 20", "timeout-minutes: 15"), encoding="utf-8")
        self.assertEqual(check_pages_publisher(self.root), publisher)

    def test_rejects_missing_deploy_timeout(self):
        publisher = self.workflows / "checks.yml"
        publisher.write_text(PUBLISHER.replace("    timeout-minutes: 20\n", ""), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "timeout-minutes to at least 15"):
            check_pages_publisher(self.root)

    def test_rejects_post_deployment_checks_not_dependent_on_deploy(self):
        publisher = self.workflows / "checks.yml"
        publisher.write_text(PUBLISHER.replace("needs: deploy", "needs: build-release"), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "verify-deployment job must depend on deploy"):
            check_pages_publisher(self.root)


if __name__ == "__main__":
    unittest.main()
