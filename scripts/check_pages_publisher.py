#!/usr/bin/env python3
"""Check this repository's fixed Pages workflow structure, not arbitrary YAML.

Supported mappings use two-space job indentation, inline needs/project lists,
eight-space step keys, and literal run blocks. Equivalent unsupported YAML
must be reviewed with this guard. GitHub remains the execution authority.
"""
from pathlib import Path
import re
import textwrap

DEPLOY_STEP = re.compile(r"""(?m)^\s*(?:-\s*)?uses:\s*['"]?actions/deploy-pages@""")
JOB_HEADER = re.compile(r"^  ([A-Za-z0-9_-]+):\s*(?:#.*)?$")
HEAVY_TIMEOUT_MINUTES = 25
DEPLOY_TIMEOUT_MINUTES = 15
CORE_COMMANDS = ('npm run check:static', 'npm run check:browser-projects',
                 'npm run test:browser:smoke', 'npm run test:release')
BROWSER_COMMAND = 'npm run test:browser -- --project=${{ matrix.project }}'
MAIN_RELEASE_IF = "github.ref == 'refs/heads/main' && (github.event_name == 'push' || github.event_name == 'workflow_dispatch')"
CURRENT_RELEASE_IF = "steps.head.outputs.current == 'true'"


def _fields(block: str, indent: int) -> dict[str, str]:
    fields = {}
    pattern = re.compile(r'^' + ' ' * indent + r'([A-Za-z0-9_-]+):\s*(.*?)\s*$')
    for line in block.splitlines():
        match = pattern.match(line)
        if match:
            key, value = match.groups()
            if key in fields:
                raise ValueError(f'duplicate workflow key: {key}')
            fields[key] = value
        elif line.strip() and not line.lstrip().startswith('#') and len(line) - len(line.lstrip()) == indent:
            raise ValueError('unsupported workflow mapping key or merge syntax')
    return fields


def _section(block: str, key: str, indent: int) -> str:
    lines = block.splitlines()
    header = ' ' * indent + key + ':'
    starts = [i for i, line in enumerate(lines) if line.rstrip() == header]
    if len(starts) != 1:
        raise ValueError(f'expected one fixed mapping for {key}')
    selected = []
    for line in lines[starts[0] + 1:]:
        if line.strip() and not line.lstrip().startswith('#') and len(line) - len(line.lstrip()) <= indent:
            break
        selected.append(line)
    return '\n'.join(selected)


def workflow_jobs(content: str) -> dict[str, str]:
    jobs = {}
    current = None
    for line in _section(content, 'jobs', 0).splitlines():
        match = JOB_HEADER.match(line)
        if match:
            current = match.group(1)
            if current in jobs:
                raise ValueError(f'duplicate workflow job: {current}')
            jobs[current] = []
        elif current is not None:
            jobs[current].append(line)
        elif line.strip() and not line.lstrip().startswith('#'):
            raise ValueError('unsupported workflow jobs mapping')
    return {name: '\n'.join(lines) for name, lines in jobs.items()}


def _job_block(content: str, job_id: str) -> str | None:
    return workflow_jobs(content).get(job_id)


def _steps(job: str) -> list[str]:
    steps = []
    for line in _section(job, 'steps', 4).splitlines():
        if line.startswith('      - '):
            steps.append(['        ' + line[8:]])
        elif steps:
            steps[-1].append(line)
        elif line.strip() and not line.lstrip().startswith('#'):
            raise ValueError('unsupported workflow step structure')
    return ['\n'.join(lines) for lines in steps]


def _run(step: str) -> str | None:
    value = _fields(step, 8).get('run')
    if value != '|':
        return value
    lines = step.splitlines()
    start = next(i for i, line in enumerate(lines) if re.fullmatch(r'        run:\s*\|\s*', line))
    body = []
    for line in lines[start + 1:]:
        if line.strip() and len(line) - len(line.lstrip()) <= 8:
            break
        body.append(line)
    return textwrap.dedent('\n'.join(body)).strip()


def _expression(value: str | None) -> str | None:
    if value is not None and value.startswith('${{') and value.endswith('}}'):
        value = value[3:-2]
    return ' '.join(value.split()) if value is not None else None


def _names(value: str | None) -> list[str]:
    if value is None:
        return []
    if value.startswith('[') and value.endswith(']'):
        names = [name.strip() for name in value[1:-1].split(',')]
    else:
        names = [value]
    if not all(re.fullmatch(r'[A-Za-z0-9_-]+', name) for name in names):
        raise ValueError('expected a fixed inline workflow name list')
    return names


def _no_tolerated_failure(fields: dict[str, str], label: str) -> None:
    if fields.get('continue-on-error', 'false') != 'false':
        raise ValueError(f'{label} must not tolerate failure')


def _unconditional(fields: dict[str, str], label: str) -> None:
    if 'if' in fields:
        raise ValueError(f'{label} must run without an if condition')
    _no_tolerated_failure(fields, label)


def _required_step(steps: list[str], label: str, *, command: str | None = None,
                   action: str | None = None, condition: str | None = None) -> tuple[int, str]:
    matches = [(i, step) for i, step in enumerate(steps)
               if (command is not None and _run(step) == command)
               or (action is not None and _fields(step, 8).get('uses', '').startswith(action + '@'))]
    if len(matches) != 1:
        raise ValueError(f'{label} must contain exactly one required step: {command or action}')
    index, step = matches[0]
    fields = _fields(step, 8)
    _no_tolerated_failure(fields, label)
    if fields.get('shell') not in (None, 'bash'):
        raise ValueError(f'{label} must use the normal Bash command shell')
    if condition is None:
        _unconditional(fields, label)
    elif _expression(fields.get('if')) != condition:
        raise ValueError(f'{label} must use the current-release condition')
    return index, step


def _timeout(job: str, label: str, minimum: int, maximum: int | None = None) -> None:
    value = _fields(job, 4).get('timeout-minutes', '')
    if not value.isdecimal() or int(value) < minimum or (maximum is not None and int(value) > maximum):
        limit = f'{minimum}..{maximum} minutes' if maximum is not None else f'at least {minimum} minutes'
        raise ValueError(f'{label} must set timeout-minutes to {limit}')


def _needs(job: str, label: str, expected: list[str]) -> None:
    actual = _names(_fields(job, 4).get('needs'))
    if len(actual) != len(expected) or set(actual) != set(expected):
        raise ValueError(f'{label} must directly depend on {", ".join(expected)}')


def quality_gate_script(content: str) -> str:
    """Extract the actual inline gate for execution by the state-table test."""
    steps = _steps(workflow_jobs(content).get('checks') or '')
    if len(steps) != 1 or _run(steps[0]) is None:
        raise ValueError('checks must contain one inline result gate without setup steps')
    return _run(steps[0]) + '\n'


def check_pages_publisher(repository_root: Path) -> Path:
    publishers = []
    workflows = repository_root / '.github' / 'workflows'
    for path in sorted(workflows.glob('*.yml')) + sorted(workflows.glob('*.yaml')):
        content = path.read_text(encoding='utf-8')
        if DEPLOY_STEP.search(content):
            publishers.append((path, content))
    if len(publishers) != 1:
        names = ', '.join(path.name for path, _ in publishers) or 'none'
        raise ValueError(f'expected one GitHub Pages publisher, found {len(publishers)}: {names}')
    path, content = publishers[0]
    if path.name != 'checks.yml':
        raise ValueError(f'expected the verified publisher in checks.yml, found {path.name}')
    jobs = workflow_jobs(content)
    required = {'core-checks', 'browser-interactions', 'checks', 'build-release', 'deploy', 'verify-deployment'}
    if not required.issubset(jobs):
        raise ValueError(f'missing required release safeguards/jobs: {", ".join(sorted(required - jobs.keys()))}')
    for name in sorted(required):
        fields = _fields(jobs[name], 4)
        if 'defaults' in fields:
            raise ValueError(f'{name} command defaults require an explicit guard review')
        if name != 'deploy' and 'permissions' in fields:
            raise ValueError(f'{name} must inherit the contents: read workflow permissions')
    if 'defaults' in _fields(content, 0):
        raise ValueError('workflow command defaults require an explicit guard review')
    if _fields(_section(content, 'permissions', 0), 2) != {'contents': 'read'}:
        raise ValueError('workflow permissions must default to contents: read')
    if _fields(_section(content, 'concurrency', 0), 2) != {
            'group': 'project-checks-${{ github.ref }}', 'cancel-in-progress': 'false'}:
        raise ValueError('workflow must preserve the serialized release concurrency group')

    for name in ('core-checks', 'browser-interactions'):
        fields = _fields(jobs[name], 4)
        _unconditional(fields, name)
        if 'needs' in fields:
            raise ValueError(f'{name} must start independently')
        _timeout(jobs[name], name, HEAVY_TIMEOUT_MINUTES)
    core_steps = _steps(jobs['core-checks'])
    positions = [_required_step(core_steps, 'core-checks', command=command)[0] for command in CORE_COMMANDS]
    if positions != sorted(positions):
        raise ValueError('core-checks must run all required commands in order')

    browser = jobs['browser-interactions']
    strategy = _section(browser, 'strategy', 4)
    if _fields(strategy, 6).get('fail-fast') != 'false':
        raise ValueError('browser-interactions must set fail-fast: false')
    matrix = _fields(_section(strategy, 'matrix', 6), 8)
    projects = _names(matrix.get('project'))
    if set(matrix) != {'project'} or len(projects) != 2 or set(projects) != {'desktop', 'mobile'}:
        raise ValueError('browser-interactions matrix must contain only desktop and mobile without include/exclude')
    _required_step(_steps(browser), 'browser-interactions', command=BROWSER_COMMAND)

    gate = jobs['checks']
    _needs(gate, 'checks', ['core-checks', 'browser-interactions'])
    if _expression(_fields(gate, 4).get('if')) != 'always()':
        raise ValueError('checks must use always() for explicit result evaluation')
    _no_tolerated_failure(_fields(gate, 4), 'checks')
    _timeout(gate, 'checks', 1, 5)
    gate_steps = _steps(gate)
    gate_script = quality_gate_script(content)
    gate_fields = _fields(gate, 4)
    if gate_fields.get('runs-on') != 'ubuntu-26.04':
        raise ValueError('checks must retain the Linux gate execution environment')
    step_fields = _fields(gate_steps[0], 8)
    _unconditional(step_fields, 'checks result step')
    if step_fields.get('shell') not in (None, 'bash'):
        raise ValueError('checks result step must use the normal Bash command shell')
    gate_env = _fields(_section(gate_steps[0], 'env', 8), 10)
    expected_env = {'CORE_RESULT': 'needs.core-checks.result', 'BROWSER_RESULT': 'needs.browser-interactions.result'}
    if {name: _expression(value) for name, value in gate_env.items()} != expected_env:
        raise ValueError('checks result environment must bind the two direct needs results')
    lines = gate_script.strip().splitlines()
    if not lines or lines[0] != 'set -eu' or lines[-2:] != ['test "$CORE_RESULT" = success', 'test "$BROWSER_RESULT" = success']:
        raise ValueError('checks inline gate must fail closed on both results')

    build = jobs['build-release']
    _needs(build, 'build-release', ['checks'])
    _no_tolerated_failure(_fields(build, 4), 'build-release')
    if _expression(_fields(build, 4).get('if')) != MAIN_RELEASE_IF:
        raise ValueError('build-release must retain the main push/manual release condition')
    build_steps = _steps(build)
    _, head = _required_step(build_steps, 'build-release', command='bash scripts/check_release_head.sh')
    if _fields(head, 8).get('id') != 'head':
        raise ValueError('build-release current-head check must retain its head step id')
    _required_step(build_steps, 'build-release', action='actions/configure-pages', condition=CURRENT_RELEASE_IF)
    _required_step(build_steps, 'build-release', command='python3 scripts/build_site.py --output "$RUNNER_TEMP/knowledge-visual-site"', condition=CURRENT_RELEASE_IF)
    _required_step(build_steps, 'build-release', action='actions/upload-pages-artifact', condition=CURRENT_RELEASE_IF)
    provenance = [step for step in build_steps if _run(step) and 'release-version.json' in _run(step)]
    assertion = 'assert v["revision"] == os.environ["GITHUB_SHA"] and v["site_files_modified"] is False'
    if len(provenance) != 1 or assertion not in _run(provenance[0]):
        raise ValueError('build-release must verify revision and clean release provenance in its own job')
    if _expression(_fields(provenance[0], 8).get('if')) != CURRENT_RELEASE_IF:
        raise ValueError('release provenance must use the current-release condition')
    _no_tolerated_failure(_fields(provenance[0], 8), 'release provenance')
    if _fields(provenance[0], 8).get('shell') not in (None, 'bash'):
        raise ValueError('release provenance must use the normal Bash command shell')

    deploy = jobs['deploy']
    _needs(deploy, 'deploy', ['build-release'])
    _timeout(deploy, 'deploy', DEPLOY_TIMEOUT_MINUTES)
    _no_tolerated_failure(_fields(deploy, 4), 'deploy')
    if _expression(_fields(deploy, 4).get('if')) != "needs.build-release.outputs.current == 'true'":
        raise ValueError('deploy must require the current-release output')
    if _fields(_section(deploy, 'permissions', 4), 6) != {'contents': 'read', 'pages': 'write', 'id-token': 'write'}:
        raise ValueError('deploy must retain its scoped Pages permissions')
    deploy_steps = _steps(deploy)
    _required_step(deploy_steps, 'deploy', command='git fetch --no-tags origin main\ntest "$(git rev-parse FETCH_HEAD)" = "$GITHUB_SHA"')
    _required_step(deploy_steps, 'deploy', action='actions/deploy-pages')
    if len(DEPLOY_STEP.findall(content)) != 1:
        raise ValueError('the publisher must contain one Pages deployment action')

    verify = jobs['verify-deployment']
    _needs(verify, 'verify-deployment', ['deploy'])
    _unconditional(_fields(verify, 4), 'verify-deployment')
    verify_steps = _steps(verify)
    _required_step(verify_steps, 'verify-deployment', command='python3 scripts/verify_published_site.py --base-url "$SITE_URL" --expected-revision "$GITHUB_SHA"')
    _required_step(verify_steps, 'verify-deployment', command='npx playwright test tests/browser/published-live-site.spec.js --workers=1 --retries=2')
    return path


def main() -> None:
    repository_root = Path(__file__).resolve().parents[1]
    publisher = check_pages_publisher(repository_root)
    print(f'Verified single GitHub Pages publisher: {publisher.relative_to(repository_root)}')


if __name__ == '__main__':
    main()
