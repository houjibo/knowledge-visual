import tempfile
import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.check_pages_publisher import check_pages_publisher


PUBLISHER = """\
      - uses: actions/deploy-pages@v4
    needs: checks
    run: python3 scripts/build_site.py
    release-version.json
    run: python3 scripts/verify_published_site.py
    run: npx playwright test tests/browser/published-site.spec.js
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

    def test_rejects_a_second_pages_publisher(self):
        (self.workflows / "checks.yml").write_text(PUBLISHER, encoding="utf-8")
        (self.workflows / "jekyll.yml").write_text("uses: actions/deploy-pages@v5\n", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "found 2"):
            check_pages_publisher(self.root)

    def test_rejects_a_publisher_without_release_verification(self):
        (self.workflows / "checks.yml").write_text("uses: actions/deploy-pages@v4\n", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "missing required release safeguards"):
            check_pages_publisher(self.root)


if __name__ == "__main__":
    unittest.main()
