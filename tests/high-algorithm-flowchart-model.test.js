const {test} = require('node:test');
const assert = require('node:assert/strict');
const Model = require('../computer/high/assets/algorithm-flowchart-model.js');

const correct = {...Model.EXPECTED};

test('the six constructed blocks must describe safe first-match search', () => {
  assert.deepEqual(Model.validateConstruction(correct), {valid: true, errors: []});
  assert.equal(Model.validateTerminationExplanation(Model.TERMINATION_EXPLANATION), true);
});

test('off-by-one and skipped-first-item constructions are rejected with reasons', () => {
  const offByOne = {...correct, condition: 'allow-index-equals-length'};
  assert.match(Model.validateConstruction(offByOne).errors.join(' '), /越界/);
  const skippedFirst = {...correct, initialize: 'start-at-one'};
  assert.match(Model.validateConstruction(skippedFirst).errors.join(' '), /漏掉/);
  assert.throws(() => Model.runCase('first-duplicate', offByOne), RangeError);
});

test('duplicate targets return the first index and stop without visiting the later match', () => {
  const result = Model.runCase('first-duplicate', correct);
  assert.equal(result.foundIndex, 1);
  assert.equal(result.comparisons, 2);
  assert.equal(result.terminated, true);
  assert.deepEqual(result.trace.filter(step => step.node === 'compare').map(step => step.index), [0, 1]);
});

test('the last-position target is found after visiting every valid index once', () => {
  const result = Model.runCase('last-match', correct);
  assert.equal(result.foundIndex, 4);
  assert.equal(result.comparisons, 5);
  assert.equal(result.trace.some(step => step.node === 'compare' && step.index === 5), false);
});

test('an absent target ends exactly at the list boundary without reading past it', () => {
  const result = Model.runCase('not-found', correct);
  assert.equal(result.found, false);
  assert.equal(result.foundIndex, null);
  assert.equal(result.comparisons, 5);
  assert.equal(result.trace.at(-1).node, 'not-found');
  assert.equal(result.trace.at(-1).index, 5);
  assert.equal(result.trace.some(step => step.node === 'compare' && step.index >= 5), false);
});

test('empty lists terminate immediately and input bounds are enforced', () => {
  const empty = Model.runSearch([], 4);
  assert.equal(empty.comparisons, 0);
  assert.equal(empty.termination, 'not-found');
  assert.equal(empty.trace.length, 2);
  assert.throws(() => Model.runSearch('not a list', 1), RangeError);
  assert.throws(() => Model.runSearch([1], 1.5), RangeError);
  const maximum = Model.runSearch(Array.from({length: Model.MAX_VALUES}, (_, index) => index), -1);
  assert.equal(maximum.comparisons, Model.MAX_VALUES);
  assert.equal(maximum.trace.length, 3 * Model.MAX_VALUES + 2);
  assert.equal(maximum.trace.at(-1).node, 'not-found');
  assert.throws(() => Model.runSearch(Array(51).fill(1), 1), RangeError);
  assert.throws(() => Model.runCase('missing-case', correct), RangeError);
});
