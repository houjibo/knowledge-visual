import tempfile
import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.check_pages_publisher import CORE_COMMANDS, check_pages_publisher, workflow_jobs

ROOT = Path(__file__).resolve().parents[1]
# The complete shipping workflow is the fixture. Each mutation stays in a
# temporary repository; no partial look-alike can stand in for the real DAG.
PUBLISHER = (ROOT / '.github/workflows/checks.yml').read_text(encoding='utf-8')


def mutate_job(content, name, old, new):
    block = workflow_jobs(content)[name]
    if old not in block:
        raise AssertionError(f'mutation target absent from {name}: {old}')
    return content.replace(block, block.replace(old, new, 1), 1)


class PagesPublisherTests(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary_directory.cleanup)
        self.root = Path(self.temporary_directory.name)
        self.workflows = self.root / '.github/workflows'
        self.workflows.mkdir(parents=True)
        self.publisher = self.workflows / 'checks.yml'

    def check(self, content=PUBLISHER):
        self.publisher.write_text(content, encoding='utf-8')
        return check_pages_publisher(self.root)

    def reject(self, content, message):
        with self.assertRaisesRegex(ValueError, message):
            self.check(content)

    def test_accepts_the_complete_shipping_parallel_workflow(self):
        self.assertEqual(self.check(), self.publisher)

    def test_requires_both_heavy_jobs_and_sufficient_time(self):
        for name in ('core-checks', 'browser-interactions'):
            with self.subTest(job=name, case='minimum'):
                self.assertEqual(self.check(mutate_job(PUBLISHER, name, 'timeout-minutes: 30', 'timeout-minutes: 25')), self.publisher)
            for replacement in ('timeout-minutes: 24', 'timeout-minutes: nope', '# timeout missing'):
                with self.subTest(job=name, value=replacement):
                    self.reject(mutate_job(PUBLISHER, name, 'timeout-minutes: 30', replacement), f'{name} must set timeout-minutes')
            with self.subTest(job=name, case='missing'):
                self.reject(PUBLISHER.replace(f'  {name}:', f'  omitted-{name}:', 1), 'missing required release safeguards/jobs')

    def test_heavy_jobs_cannot_be_conditional_or_tolerate_failure(self):
        for name in ('core-checks', 'browser-interactions'):
            for key in ('if: true', 'if: false', 'continue-on-error: true', 'continue-on-error: ${{ true }}'):
                with self.subTest(job=name, setting=key):
                    self.reject(mutate_job(PUBLISHER, name, '    timeout-minutes: 30', f'    {key}\n    timeout-minutes: 30'), 'without an if condition|must not tolerate failure')
            self.reject(mutate_job(PUBLISHER, name, '    timeout-minutes: 30', '    needs: other-job\n    timeout-minutes: 30'), 'must start independently')

    def test_core_retains_every_command_in_order(self):
        for command in CORE_COMMANDS:
            with self.subTest(command=command):
                missing = mutate_job(PUBLISHER, 'core-checks', f'run: {command}', 'run: true')
                # Keeping the exact command in a different job does not restore the core gate.
                wrong_job = mutate_job(missing, 'browser-interactions', '    steps:', f'    steps:\n      - run: {command}')
                self.reject(wrong_job, 'core-checks must contain exactly one required step')
                commented = mutate_job(PUBLISHER, 'core-checks', f'run: {command}', f'# run: {command}\n        run: true')
                self.reject(commented, 'core-checks must contain exactly one required step')
        swapped = mutate_job(PUBLISHER, 'core-checks', 'run: npm run check:static', 'run: SWAP')
        swapped = mutate_job(swapped, 'core-checks', 'run: npm run test:release', 'run: npm run check:static')
        swapped = mutate_job(swapped, 'core-checks', 'run: SWAP', 'run: npm run test:release')
        self.reject(swapped, 'required commands in order')

    def test_required_test_steps_are_unconditional_and_fail_closed(self):
        cases = [('core-checks', command) for command in CORE_COMMANDS]
        cases.append(('browser-interactions', 'npm run test:browser -- --project=${{ matrix.project }}'))
        for name, command in cases:
            for setting in ('if: true', 'if: false', 'continue-on-error: true'):
                with self.subTest(job=name, command=command, setting=setting):
                    changed = mutate_job(PUBLISHER, name, f'        run: {command}', f'        {setting}\n        run: {command}')
                    self.reject(changed, 'without an if condition|must not tolerate failure')
            self.reject(mutate_job(PUBLISHER, name, f'run: {command}', f'run: {command} || true'), 'required step')

    def test_browser_matrix_contains_exactly_the_two_projects(self):
        for projects in ('[desktop]', '[mobile]', '[desktop, desktop]', '[desktop, mobile, firefox]'):
            with self.subTest(projects=projects):
                self.reject(mutate_job(PUBLISHER, 'browser-interactions', '[desktop, mobile]', projects), 'matrix must contain only desktop and mobile')
        for option in ('exclude', 'include'):
            with self.subTest(option=option):
                changed = mutate_job(PUBLISHER, 'browser-interactions', 'project: [desktop, mobile]', f'project: [desktop, mobile]\n        {option}:\n          - project: mobile')
                self.reject(changed, 'without include/exclude')

    def test_browser_projects_reuse_the_one_suite_and_keep_other_project_running(self):
        for command in ('npm run test:browser -- --project=desktop', 'npx playwright test --project=${{ matrix.project }}'):
            self.reject(mutate_job(PUBLISHER, 'browser-interactions', 'npm run test:browser -- --project=${{ matrix.project }}', command), 'required step')
        for value in ('true', '${{ false }}'):
            self.reject(mutate_job(PUBLISHER, 'browser-interactions', 'fail-fast: false', f'fail-fast: {value}'), 'fail-fast: false')

    def test_checks_depends_on_exactly_the_two_quality_jobs(self):
        for names in ('[core-checks]', '[browser-interactions]', '[core-checks, core-checks]', '[core-checks, browser-interactions, other-job]'):
            self.reject(mutate_job(PUBLISHER, 'checks', '[core-checks, browser-interactions]', names), 'checks must directly depend')

    def test_checks_always_evaluates_results_with_a_short_explicit_timeout(self):
        for value in ('success()', "always() && needs.core-checks.result == 'success'", 'true'):
            self.reject(mutate_job(PUBLISHER, 'checks', '${{ always() }}', '${{ ' + value + ' }}'), 'checks must use always')
        self.reject(mutate_job(PUBLISHER, 'checks', '    if: ${{ always() }}', '    # if removed'), 'checks must use always')
        for minutes in (1, 5):
            self.assertEqual(self.check(mutate_job(PUBLISHER, 'checks', 'timeout-minutes: 2', f'timeout-minutes: {minutes}')), self.publisher)
        for value in ('0', '6', 'nope'):
            self.reject(mutate_job(PUBLISHER, 'checks', 'timeout-minutes: 2', f'timeout-minutes: {value}'), 'checks must set timeout-minutes to 1..5')

    def test_checks_cannot_skip_ignore_or_replace_its_result_step(self):
        for setting in ('if: true', 'continue-on-error: true'):
            self.reject(mutate_job(PUBLISHER, 'checks', '        env:', f'        {setting}\n        env:'), 'without an if condition|must not tolerate failure')
        self.reject(mutate_job(PUBLISHER, 'checks', '    timeout-minutes: 2', '    continue-on-error: true\n    timeout-minutes: 2'), 'must not tolerate failure')
        self.reject(mutate_job(PUBLISHER, 'checks', '    steps:', '    steps:\n      - uses: actions/checkout@v6'), 'one inline result gate without setup')
        self.reject(mutate_job(PUBLISHER, 'checks', '          set -eu', '          set -e'), 'inline gate must fail closed')
        self.reject(mutate_job(PUBLISHER, 'checks', '          test "$BROWSER_RESULT" = success', '          true'), 'inline gate must fail closed')

    def test_checks_environment_is_bound_to_each_direct_result(self):
        for before, after in (
            ('CORE_RESULT: ${{ needs.core-checks.result }}', 'CORE_RESULT: ${{ needs.browser-interactions.result }}'),
            ('BROWSER_RESULT: ${{ needs.browser-interactions.result }}', 'BROWSER_RESULT: success'),
            ('BROWSER_RESULT: ${{ needs.browser-interactions.result }}', 'OTHER_RESULT: ${{ needs.browser-interactions.result }}'),
        ):
            self.reject(mutate_job(PUBLISHER, 'checks', before, after), 'environment must bind the two direct needs results')

    def test_fixed_structure_rejects_merge_keys_and_shell_bypasses(self):
        self.reject(mutate_job(PUBLISHER, 'core-checks', '    timeout-minutes: 30', '    <<: *other-job\n    timeout-minutes: 30'), 'unsupported workflow mapping')
        self.reject(mutate_job(PUBLISHER, 'checks', '        env:', '        shell: true {0}\n        env:'), 'normal Bash command shell')
        self.reject(mutate_job(PUBLISHER, 'browser-interactions', '        run: npm run test:browser', '        shell: true {0}\n        run: npm run test:browser'), 'normal Bash command shell')
        self.reject(PUBLISHER.replace('jobs:\n', 'defaults:\n  run:\n    shell: true {0}\njobs:\n', 1), 'command defaults require an explicit guard review')
        self.reject(mutate_job(PUBLISHER, 'checks', 'runs-on: ubuntu-26.04', 'runs-on: windows-latest'), 'Linux gate execution environment')

    def test_every_quality_and_release_job_rejects_command_defaults(self):
        for name in ('core-checks', 'browser-interactions', 'checks', 'build-release', 'deploy', 'verify-deployment'):
            with self.subTest(job=name):
                changed = mutate_job(PUBLISHER, name, '    runs-on: ubuntu-26.04',
                                     '    defaults:\n      run:\n        shell: true {0}\n    runs-on: ubuntu-26.04')
                self.reject(changed, f'{name} command defaults require an explicit guard review')

    def test_only_deploy_can_override_read_only_workflow_permissions(self):
        for name in ('core-checks', 'browser-interactions', 'checks', 'build-release', 'verify-deployment'):
            with self.subTest(job=name):
                changed = mutate_job(PUBLISHER, name, '    runs-on: ubuntu-26.04',
                                     '    permissions:\n      contents: write\n      pages: write\n    runs-on: ubuntu-26.04')
                self.reject(changed, f'{name} must inherit the contents: read workflow permissions')

    def test_release_provenance_cannot_use_a_shell_that_ignores_the_script(self):
        changed = mutate_job(PUBLISHER, 'build-release', '      - name: Verify release provenance',
                             '      - name: Verify release provenance\n        shell: true {0}')
        self.reject(changed, 'release provenance must use the normal Bash command shell')

    def test_release_chain_cannot_bypass_the_checks_gate(self):
        for name, before, after in (
            ('build-release', 'needs: checks', 'needs: core-checks'),
            ('deploy', 'needs: build-release', 'needs: checks'),
            ('verify-deployment', 'needs: deploy', 'needs: build-release'),
        ):
            with self.subTest(job=name):
                self.reject(mutate_job(PUBLISHER, name, before, after), f'{name} must directly depend')
        self.reject(mutate_job(PUBLISHER, 'build-release', "github.ref == 'refs/heads/main'", "github.ref == 'refs/heads/other'"), 'main push/manual release condition')
        self.reject(mutate_job(PUBLISHER, 'build-release', "if: github.ref", "if: always() || github.ref"), 'main push/manual release condition')
        self.reject(mutate_job(PUBLISHER, 'deploy', "needs.build-release.outputs.current == 'true'", 'always()'), 'deploy must require the current-release output')

    def test_build_requires_its_own_head_build_and_provenance_checks(self):
        for before, after in (
            ('bash scripts/check_release_head.sh', 'true'),
            ('python3 scripts/build_site.py --output "$RUNNER_TEMP/knowledge-visual-site"', 'true'),
            ('v["site_files_modified"] is False', 'v["site_files_modified"] is True'),
            ('id: head', 'id: other'),
        ):
            self.reject(mutate_job(PUBLISHER, 'build-release', before, after), 'required step|release provenance|head step id')
        self.reject(mutate_job(PUBLISHER, 'build-release', "if: steps.head.outputs.current == 'true'", 'if: true'), 'current-release condition')

    def test_deploy_retains_its_timeout_permissions_and_current_head_check(self):
        self.assertEqual(self.check(mutate_job(PUBLISHER, 'deploy', 'timeout-minutes: 20', 'timeout-minutes: 15')), self.publisher)
        for replacement in ('timeout-minutes: 14', '# timeout removed'):
            self.reject(mutate_job(PUBLISHER, 'deploy', 'timeout-minutes: 20', replacement), 'deploy must set timeout-minutes')
        self.reject(mutate_job(PUBLISHER, 'deploy', 'pages: write', 'pages: read'), 'scoped Pages permissions')
        self.reject(mutate_job(PUBLISHER, 'deploy', 'test "$(git rev-parse FETCH_HEAD)" = "$GITHUB_SHA"', 'true'), 'deploy must contain exactly one required step')

    def test_post_deployment_commands_cannot_be_omitted_or_skipped(self):
        for command in (
            'python3 scripts/verify_published_site.py --base-url "$SITE_URL" --expected-revision "$GITHUB_SHA"',
            'npx playwright test tests/browser/published-live-site.spec.js --workers=1 --retries=2',
        ):
            for before, after in ((f'run: {command}', 'run: true'),
                                  (f'        run: {command}', f'        if: false\n        run: {command}')):
                self.reject(mutate_job(PUBLISHER, 'verify-deployment', before, after), 'required step|without an if condition')

    def test_rejects_additional_or_missing_publishers(self):
        self.publisher.write_text(PUBLISHER)
        (self.workflows / 'jekyll.yml').write_text('uses: actions/deploy-pages@v5\n')
        with self.assertRaisesRegex(ValueError, 'found 2'):
            check_pages_publisher(self.root)
        (self.workflows / 'jekyll.yml').unlink()
        self.reject(mutate_job(PUBLISHER, 'deploy', '      - name: Deploy to GitHub Pages', '      - uses: actions/deploy-pages@v5\n      - name: Deploy to GitHub Pages'), 'exactly one required step|one Pages deployment action')
        self.reject('uses: actions/deploy-pages@v5\n', 'expected one fixed mapping for jobs|missing required')
        self.publisher.unlink()
        with self.assertRaisesRegex(ValueError, 'found 0'):
            check_pages_publisher(self.root)

    def test_rejects_quoted_second_pages_publishers(self):
        self.publisher.write_text(PUBLISHER, encoding='utf-8')
        second = self.workflows / 'another-pages.yml'
        for quote in ('"', "'"):
            with self.subTest(quote=quote):
                second.write_text(f'jobs:\n  deploy:\n    steps:\n      - uses: {quote}actions/deploy-pages@v5{quote}\n', encoding='utf-8')
                with self.assertRaisesRegex(ValueError, 'found 2'):
                    check_pages_publisher(self.root)

    def test_defaults_and_serial_release_policy_are_preserved(self):
        self.reject(PUBLISHER.replace('permissions:\n  contents: read', 'permissions:\n  contents: write', 1), 'permissions must default')
        self.reject(PUBLISHER.replace('cancel-in-progress: false', 'cancel-in-progress: true', 1), 'serialized release concurrency')
        self.reject(PUBLISHER.replace('  checks:\n', '  checks:\n  checks:\n', 1), 'duplicate workflow job')


if __name__ == '__main__':
    unittest.main()
