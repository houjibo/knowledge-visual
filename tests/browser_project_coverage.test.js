'use strict';

const assert = require('node:assert/strict');
const {test} = require('node:test');
const {
  relativeFile, normalizeReport, fingerprint, compareProjectCoverage, parseListResult, listArguments
} = require('../scripts/check_browser_project_coverage.js');

const ROOT = '/fixture/repository';
const PROJECTS = ['desktop', 'mobile'];
function entry(project, title = 'case', overrides = {}) {
  return {project, title, file: 'sample.spec.js', suites: ['outer', 'inner'], line: 12, column: 3, ...overrides};
}
function report(entries, {configured = PROJECTS, selected = configured, rootDir = `${ROOT}/tests/browser`} = {}) {
  return {
    config: {
      rootDir, shard: null,
      projects: configured.map(name => ({name, id: `id-${name}`})),
      filteredProjects: selected.map(name => ({name}))
    },
    suites: entries.map(item => {
      const spec = {title: item.title, file: item.file, line: item.line, column: item.column,
        tests: [{projectName: item.project, projectId: `id-${item.project}`, status: 'skipped', results: []}]};
      let suite = {title: item.suites.at(-1), specs: [spec]};
      for (let index = item.suites.length - 2; index >= 0; index--) suite = {title: item.suites[index], suites: [suite]};
      return {title: 'sample.spec.js', file: item.file, line: 0, column: 0, suites: [suite]};
    }),
    errors: [], stats: {skipped: entries.length, unexpected: 0}
  };
}
function inputs(entries = [entry('desktop'), entry('mobile')]) {
  return {
    full: report(entries),
    shards: PROJECTS.map(project => ({project, report: report(entries.filter(item => item.project === project), {selected: [project]})}))
  };
}
function compare(data) { return compareProjectCoverage(data.full, data.shards, {repositoryRoot: ROOT}); }

test('real JSON list shape compares project/name/file/location/full nested titles', () => {
  const result = compare(inputs());
  assert.deepEqual(result.projectCounts, {desktop: 1, mobile: 1});
  assert.equal(result.total, 2);
  assert.match(result.fingerprint, /^[a-f0-9]{64}$/);
  const normalized = normalizeReport(report([entry('desktop')], {selected: ['desktop']}), {repositoryRoot: ROOT});
  assert.deepEqual(JSON.parse(normalized.entries[0]), ['desktop', 'tests/browser/sample.spec.js', 12, 3, ['sample.spec.js', 'outer', 'inner', 'case']]);
  // A list report marks every collected test skipped; this is not execution evidence.
  assert.equal(normalized.entries.length, 1);
});

test('identical total with a different title/file/line/column/suite is rejected', () => {
  for (const change of [
    {title: 'different case'}, {file: 'different.spec.js'}, {line: 13}, {column: 4}, {suites: ['different', 'inner']}
  ]) {
    const data = inputs();
    data.shards[0].report = report([entry('desktop', 'case', change)], {selected: ['desktop']});
    assert.throws(() => compare(data), /missing 1, extra 1/);
  }
});

test('same total cannot hide one missing case behind an extra repeated case', () => {
  const data = inputs([entry('desktop', 'a'), entry('desktop', 'b'), entry('mobile')]);
  data.shards[0].report = report([entry('desktop', 'a'), entry('desktop', 'a')], {selected: ['desktop']});
  assert.throws(() => compare(data), /missing 1, extra 1/);
});

test('multisets retain repeated identities and compare their counts', () => {
  const data = inputs([entry('desktop'), entry('desktop'), entry('mobile')]);
  const fullResult = compare(data);
  assert.equal(fullResult.total, 3);
  data.shards[0].report = report([entry('desktop')], {selected: ['desktop']});
  assert.throws(() => compare(data), /missing 1, extra 0/);
  data.shards[0].report = report([entry('desktop'), entry('desktop'), entry('desktop')], {selected: ['desktop']});
  assert.throws(() => compare(data), /missing 0, extra 1/);
  assert.notEqual(fullResult.fingerprint, compare(inputs()).fingerprint);
});

test('fingerprint is independent of collection and shard order', () => {
  const data = inputs([entry('desktop', 'z'), entry('desktop', 'a'), entry('mobile')]);
  const first = compare(data);
  data.full.suites.reverse();
  data.shards.reverse();
  for (const shard of data.shards) shard.report.suites.reverse();
  assert.equal(compare(data).fingerprint, first.fingerprint);
});

test('structured titles do not collapse when titles contain separators', () => {
  const left = normalizeReport(report([entry('desktop', 'c', {suites: ['a › b']})], {selected: ['desktop']}), {repositoryRoot: ROOT});
  const right = normalizeReport(report([entry('desktop', 'b › c', {suites: ['a']})], {selected: ['desktop']}), {repositoryRoot: ROOT});
  assert.notEqual(left.entries[0], right.entries[0]);
});

test('relative file identity is portable across repository locations and slashes', () => {
  assert.equal(relativeFile('sample.spec.js', `${ROOT}/tests/browser`, ROOT), 'tests/browser/sample.spec.js');
  assert.equal(relativeFile(`${ROOT}/tests/browser/sample.spec.js`, `${ROOT}/tests/browser`, ROOT), 'tests/browser/sample.spec.js');
  assert.equal(relativeFile('nested\\sample.spec.js', 'C:\\work\\repo\\tests\\browser', 'C:\\work\\repo'), 'tests/browser/nested/sample.spec.js');
  assert.equal(relativeFile('../browser/sample.spec.js', `${ROOT}/tests/browser`, ROOT), 'tests/browser/sample.spec.js');
  assert.throws(() => relativeFile('../../../outside.spec.js', `${ROOT}/tests/browser`, ROOT), /outside the repository/);
  assert.throws(() => relativeFile('C:\\outside.spec.js', `${ROOT}/tests/browser`, ROOT), /outside the repository/);
  const moved = inputs();
  for (const item of [moved.full, ...moved.shards.map(part => part.report)]) item.config.rootDir = '/different/location/tests/browser';
  const movedResult = compareProjectCoverage(moved.full, moved.shards, {repositoryRoot: '/different/location'});
  assert.equal(movedResult.fingerprint, compare(inputs()).fingerprint);
});

test('duplicate, omitted, and extra project shards fail', () => {
  const duplicate = inputs(); duplicate.shards.push(duplicate.shards[0]);
  assert.throws(() => compare(duplicate), /duplicate project/);
  const omitted = inputs(); omitted.shards.pop();
  assert.throws(() => compare(omitted), /missing projects \[mobile\]/);
  const extra = inputs(); extra.shards.push({project: 'tablet', report: report([entry('tablet')])});
  assert.throws(() => compare(extra), /extra projects \[tablet\]/);
});

test('a newly configured project is rejected even when it has no collected cases', () => {
  const data = inputs();
  data.full.config.projects.push({name: 'tablet', id: 'id-tablet'});
  data.full.config.filteredProjects.push({name: 'tablet'});
  assert.throws(() => compare(data), /uncovered\/extra projects \[tablet\]/);
});

test('a required configured project or its collected cases cannot disappear', () => {
  const noConfiguration = inputs();
  noConfiguration.full = report([entry('desktop')], {configured: ['desktop']});
  assert.throws(() => compare(noConfiguration), /missing projects \[mobile\]/);
  const noCases = inputs(); noCases.full = report([entry('desktop')]);
  assert.throws(() => compare(noCases), /no tests for project mobile/);
});

test('wrong project, mixed project selection, and changed shard configuration fail', () => {
  const wrong = inputs(); wrong.shards[0].report = report([entry('mobile')], {selected: ['mobile']});
  assert.throws(() => compare(wrong), /desktop selection/);
  const mixed = inputs(); mixed.shards[0].report = report([entry('desktop'), entry('mobile')]);
  assert.throws(() => compare(mixed), /desktop selection/);
  const changed = inputs(); changed.shards[0].report.config.projects.push({name: 'tablet', id: 'id-tablet'});
  assert.throws(() => compare(changed), /desktop configuration/);
  const mismatch = inputs(); mismatch.shards[0].report.suites[0].suites[0].suites[0].specs[0].tests[0].projectId = 'id-mobile';
  assert.throws(() => compare(mismatch), /mismatched/);
});

test('collection errors, empty full/shard lists, and positional shards fail', () => {
  const errors = inputs(); errors.full.errors = [{message: 'collect failed'}];
  assert.throws(() => compare(errors), /collection errors: collect failed/);
  const emptyFull = inputs(); emptyFull.full.suites = [];
  assert.throws(() => compare(emptyFull), /empty test list/);
  const emptyShard = inputs(); emptyShard.shards[1].report.suites = [];
  assert.throws(() => compare(emptyShard), /mobile list has an empty test list/);
  const sliced = inputs(); sliced.full.config.shard = {current: 1, total: 2};
  assert.throws(() => compare(sliced), /positional shard/);
});

test('malformed report fields fail with a location instead of silently losing cases', () => {
  const mutate = fn => {const data = inputs(); fn(data.full); return () => compare(data);};
  for (const [fn, message] of [
    [r => {r.errors = null;}, /errors must be an array/],
    [r => {r.config = null;}, /config must be an object/],
    [r => {r.config.projects = [];}, /projects must be a nonempty array/],
    [r => {r.config.projects[1].id = 'id-desktop';}, /duplicate project id/],
    [r => {r.config.filteredProjects = [];}, /nonempty array/],
    [r => {r.suites = {};}, /suites must be an array/],
    [r => {r.suites[0].title = null;}, /suite.title must be a string/],
    [r => {r.suites[0].suites = {};}, /suite.suites must be an array/],
    [r => {r.suites[0].suites[0].suites[0].specs[0].line = 0;}, /positive integer/],
    [r => {r.suites[0].suites[0].suites[0].specs[0].tests = [];}, /tests must be a nonempty array/],
    [r => {r.suites[0].suites[0].suites[0].specs[0].file = '/outside.spec.js';}, /outside the repository/]
  ]) assert.throws(mutate(fn), message);
  assert.throws(() => normalizeReport(null), /must be an object/);
  assert.throws(() => fingerprint(new Map()), /nonempty identity multiset/);
});

test('command parsing rejects failed exits, signals, empty and invalid JSON', () => {
  const valid = JSON.stringify(inputs().full);
  assert.deepEqual(parseListResult({status: 0, stdout: valid}), inputs().full);
  assert.throws(() => parseListResult({status: 1, stdout: valid, stderr: 'collection failed'}), /exit 1.*collection failed/);
  assert.throws(() => parseListResult({status: 0, signal: 'SIGTERM', stdout: valid}), /SIGTERM/);
  assert.throws(() => parseListResult({status: null, error: new Error('timeout')}), /could not complete: timeout/);
  assert.throws(() => parseListResult({status: 0, stdout: '  '}), /no JSON/);
  assert.throws(() => parseListResult({status: 0, stdout: 'npm output then {}'}), /invalid JSON/);
  assert.throws(() => normalizeReport(parseListResult({status: 0, stdout: '{}'})), /errors must be an array/);
});

test('all collections reuse one npm entry and only append their project selector', () => {
  const base = ['run', '--silent', 'test:browser', '--', '--list', '--reporter=json'];
  assert.deepEqual(listArguments(), base);
  assert.deepEqual(listArguments('desktop'), [...base, '--project=desktop']);
  assert.deepEqual(listArguments('mobile'), [...base, '--project=mobile']);
});
