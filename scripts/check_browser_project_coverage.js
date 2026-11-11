#!/usr/bin/env node
'use strict';

const path = require('node:path');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');

const DEFAULT_PROJECTS = Object.freeze(['desktop', 'mobile']);
const REPOSITORY_ROOT = path.resolve(__dirname, '..');

function fail(message) { throw new Error(message); }
function record(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} must be an object`);
}
function textValue(value, label, allowEmpty = false) {
  if (typeof value !== 'string' || (!allowEmpty && value.length === 0) || value.includes('\0')) fail(`${label} must be a string${allowEmpty ? '' : ' with a value'}`);
  return value;
}
function names(values, label) {
  if (!Array.isArray(values) || values.length === 0) fail(`${label} must be a nonempty array`);
  const result = values.map((value, index) => textValue(value, `${label}[${index}]`));
  if (new Set(result).size !== result.length) fail(`${label} contains a duplicate project`);
  return result;
}
function sameNames(actual, expected, label) {
  const missing = expected.filter(name => !actual.includes(name));
  const extra = actual.filter(name => !expected.includes(name));
  if (missing.length || extra.length) fail(`${label}: missing projects [${missing.join(', ')}]; uncovered/extra projects [${extra.join(', ')}]`);
}

function relativeFile(file, rootDir, repositoryRoot) {
  textValue(file, 'spec.file');
  textValue(rootDir, 'config.rootDir');
  textValue(repositoryRoot, 'repositoryRoot');
  const windows = /^[a-z]:[\\/]|^\\\\/i.test(repositoryRoot) || /^[a-z]:[\\/]|^\\\\/i.test(rootDir);
  if (!windows && /^[a-z]:[\\/]|^\\\\/i.test(file)) fail(`spec.file is outside the repository path style: ${file}`);
  const paths = windows ? path.win32 : path.posix;
  const clean = value => value.replace(/\\/g, '/');
  const repo = paths.resolve(clean(repositoryRoot));
  const testRoot = paths.resolve(repo, clean(rootDir));
  const absolute = paths.resolve(testRoot, clean(file));
  const relative = clean(paths.relative(repo, absolute));
  if (!relative || relative === '..' || relative.startsWith('../') || paths.isAbsolute(relative)) fail(`spec.file is outside the repository: ${file}`);
  return relative;
}

function normalizeReport(report, {repositoryRoot = REPOSITORY_ROOT, label = 'report'} = {}) {
  record(report, label);
  if (!Array.isArray(report.errors)) fail(`${label}.errors must be an array`);
  if (report.errors.length) {
    const samples = report.errors.slice(0, 3).map(error => String(error && (error.message || error.value) || 'unknown collection error').slice(0, 300));
    fail(`${label} has collection errors: ${samples.join('; ')}`);
  }
  record(report.config, `${label}.config`);
  const config = report.config;
  if (!Array.isArray(config.projects) || config.projects.length === 0) fail(`${label}.config.projects must be a nonempty array`);
  const projectIds = new Map();
  const configuredProjects = names(config.projects.map((project, index) => {
    record(project, `${label}.config.projects[${index}]`);
    const name = textValue(project.name, 'project.name');
    const id = textValue(project.id, 'project.id');
    if (projectIds.has(id)) fail(`${label} contains a duplicate project id: ${id}`);
    projectIds.set(id, name);
    return name;
  }), `${label} configured projects`);
  if (!Array.isArray(config.filteredProjects)) fail(`${label}.config.filteredProjects must be an array`);
  const filteredProjects = names(config.filteredProjects.map((project, index) => {
    record(project, `${label}.config.filteredProjects[${index}]`);
    return project.name;
  }), `${label} filtered projects`);
  if (filteredProjects.some(name => !configuredProjects.includes(name))) fail(`${label} filtered projects include an unknown project`);
  if (config.shard !== undefined && config.shard !== null) fail(`${label} unexpectedly applies a positional shard`);
  textValue(config.rootDir, `${label}.config.rootDir`);
  if (!Array.isArray(report.suites)) fail(`${label}.suites must be an array`);

  const entries = [];
  function visit(suite, parents) {
    record(suite, `${label} suite`);
    const titles = [...parents, textValue(suite.title, `${label} suite.title`, true)];
    for (const key of ['suites', 'specs']) {
      if (suite[key] !== undefined && !Array.isArray(suite[key])) fail(`${label} suite.${key} must be an array`);
    }
    for (const spec of suite.specs || []) {
      record(spec, `${label} spec`);
      const title = textValue(spec.title, `${label} spec.title`, true);
      if (!Number.isInteger(spec.line) || spec.line < 1 || !Number.isInteger(spec.column) || spec.column < 1) fail(`${label} spec location must contain positive integer line and column`);
      const file = relativeFile(spec.file, config.rootDir, repositoryRoot);
      if (!Array.isArray(spec.tests) || spec.tests.length === 0) fail(`${label} spec.tests must be a nonempty array`);
      for (const test of spec.tests) {
        record(test, `${label} test`);
        const project = textValue(test.projectName, `${label} test.projectName`);
        const projectId = textValue(test.projectId, `${label} test.projectId`);
        if (projectIds.get(projectId) !== project || !filteredProjects.includes(project)) fail(`${label} test has an unknown, mismatched, or unselected project: ${project}/${projectId}`);
        // Keep the title array structured: delimiter characters inside a title are significant.
        entries.push(JSON.stringify([project, file, spec.line, spec.column, [...titles, title]]));
      }
    }
    for (const child of suite.suites || []) visit(child, titles);
  }
  for (const suite of report.suites) visit(suite, []);
  if (entries.length === 0) fail(`${label} has an empty test list`);
  const multiset = new Map();
  for (const identity of entries) multiset.set(identity, (multiset.get(identity) || 0) + 1);
  return {configuredProjects, filteredProjects, entries, multiset};
}

function fingerprint(multiset) {
  if (!(multiset instanceof Map) || multiset.size === 0) fail('fingerprint needs a nonempty identity multiset');
  const ordered = [...multiset].sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0);
  for (const [identity, count] of ordered) {
    textValue(identity, 'identity');
    if (!Number.isInteger(count) || count < 1) fail('identity counts must be positive integers');
  }
  return crypto.createHash('sha256').update(JSON.stringify(ordered)).digest('hex');
}

function identityDescription(identity) {
  const [project, file, line, column, titles] = JSON.parse(identity);
  return `${project} ${file}:${line}:${column} › ${titles.join(' › ')}`;
}

function compareProjectCoverage(fullReport, shards, {projects = DEFAULT_PROJECTS, repositoryRoot = REPOSITORY_ROOT} = {}) {
  const expected = names(projects, 'expected projects');
  const full = normalizeReport(fullReport, {repositoryRoot, label: 'full list'});
  sameNames(full.configuredProjects, expected, 'full configuration');
  sameNames(full.filteredProjects, expected, 'full selection');
  if (!Array.isArray(shards)) fail('project shards must be an array');
  const shardNames = names(shards.map((shard, index) => {
    record(shard, `shard[${index}]`);
    return shard.project;
  }), 'project shards');
  sameNames(shardNames, expected, 'project shards');

  const combined = new Map(), projectCounts = {};
  for (const project of expected) {
    const part = normalizeReport(shards.find(shard => shard.project === project).report, {repositoryRoot, label: `${project} list`});
    sameNames(part.configuredProjects, full.configuredProjects, `${project} configuration`);
    sameNames(part.filteredProjects, [project], `${project} selection`);
    if (part.entries.some(identity => JSON.parse(identity)[0] !== project)) fail(`${project} list contains the wrong project`);
    if (!full.entries.some(identity => JSON.parse(identity)[0] === project)) fail(`full list has no tests for project ${project}`);
    projectCounts[project] = part.entries.length;
    for (const [identity, count] of part.multiset) combined.set(identity, (combined.get(identity) || 0) + count);
  }

  const missing = [], extra = [];
  for (const [identity, count] of full.multiset) {
    const difference = count - (combined.get(identity) || 0);
    if (difference > 0) missing.push([identity, difference]);
  }
  for (const [identity, count] of combined) {
    const difference = count - (full.multiset.get(identity) || 0);
    if (difference > 0) extra.push([identity, difference]);
  }
  if (missing.length || extra.length) {
    const summarize = (items, prefix) => items.slice(0, 4).map(([identity, count]) => `${prefix} x${count}: ${identityDescription(identity)}`);
    fail(`project lists differ: missing ${missing.reduce((sum, [, count]) => sum + count, 0)}, extra ${extra.reduce((sum, [, count]) => sum + count, 0)}\n${[...summarize(missing, 'missing'), ...summarize(extra, 'extra')].join('\n')}`);
  }
  return {projectCounts, total: full.entries.length, fingerprint: fingerprint(full.multiset)};
}

function parseListResult(result, label = 'list command') {
  record(result, label);
  if (result.error) fail(`${label} could not complete: ${String(result.error.message || result.error).slice(0, 300)}`);
  if (result.status !== 0 || result.signal) fail(`${label} failed (exit ${result.status}, signal ${result.signal || 'none'}): ${String(result.stderr || '').trim().slice(0, 500)}`);
  if (typeof result.stdout !== 'string' || result.stdout.trim() === '') fail(`${label} returned no JSON`);
  try { return JSON.parse(result.stdout); }
  catch (error) { fail(`${label} returned invalid JSON: ${error.message.slice(0, 200)}`); }
}

function listArguments(project) {
  const args = ['run', '--silent', 'test:browser', '--', '--list', '--reporter=json'];
  if (project !== undefined) args.push(`--project=${textValue(project, 'project')}`);
  return args;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--help') {
    console.log('Compare the full test:browser --list JSON with desktop/mobile project lists. This collects identities; it does not execute browser tests.');
    return;
  }
  if (args.length) fail('This repository checks the fixed desktop/mobile matrix; no arguments are accepted (except --help).');
  const env = {...process.env};
  // --reporter=json must write to stdout even if a developer normally saves JSON reports.
  for (const key of Object.keys(env)) if (key.startsWith('PLAYWRIGHT_JSON_OUTPUT_')) delete env[key];
  const collect = project => parseListResult(spawnSync('npm', listArguments(project), {
    cwd: REPOSITORY_ROOT, env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 120000
  }), project ? `${project} collection` : 'full collection');
  const full = collect();
  const shards = DEFAULT_PROJECTS.map(project => ({project, report: collect(project)}));
  const result = compareProjectCoverage(full, shards);
  console.log(`OK browser project coverage (collection only): ${DEFAULT_PROJECTS.map(project => `${project}=${result.projectCounts[project]}`).join(' ')} total=${result.total}`);
  console.log(`coverage-fingerprint-sha256: ${result.fingerprint}`);
}

module.exports = {DEFAULT_PROJECTS, relativeFile, normalizeReport, fingerprint, compareProjectCoverage, parseListResult, listArguments};
if (require.main === module) {
  try { main(); }
  catch (error) { console.error(`Browser project coverage failed: ${error.message}`); process.exitCode = 1; }
}
