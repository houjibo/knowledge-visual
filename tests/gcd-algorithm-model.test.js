const {test} = require('node:test');
const assert = require('node:assert/strict');
const Model = require('../computer/high/assets/gcd-algorithm-model.js');

test('construction requires a preserved remainder and the correct state handoff', () => {
  assert.deepEqual(Model.validateConstruction(Model.EXPECTED), {valid: true, errors: []});
  const lostState = {...Model.EXPECTED, updateA: 'assign-remainder'};
  assert.match(Model.validateConstruction(lostState).errors.join(' '), /旧 b/);
  const badCondition = {...Model.EXPECTED, condition: 'while-a-diff-b'};
  assert.match(Model.validateConstruction(badCondition).errors.join(' '), /b 不等于 0/);
  assert.equal(Model.validateConstruction(null).valid, false);
});

test('Euclidean algorithm returns the gcd and traces each remainder state', () => {
  const result = Model.runEuclid(252, 105);
  assert.equal(result.gcd, 21);
  assert.equal(result.operations, 3);
  assert.deepEqual(result.trace.filter(step => step.kind === 'remainder').map(step => step.remainder), [42, 21, 0]);
  assert.deepEqual(Model.runEuclid(36, 24).gcd, 12);
  assert.deepEqual(Model.runEuclid(18, 18).gcd, 18);
  assert.equal(Model.runEuclid(0, 28).gcd, 28);
  assert.equal(Model.runEuclid(28, 0).gcd, 28);
});

test('input bounds and the undefined zero pair are rejected', () => {
  assert.equal(Model.validateInput(0, 999).valid, true);
  assert.equal(Model.validateInput(0, 0).valid, false);
  assert.equal(Model.validateInput(-1, 3).valid, false);
  assert.equal(Model.validateInput(1, 1000).valid, false);
  assert.equal(Model.validateInput(2.5, 5).valid, false);
  assert.throws(() => Model.runEuclid(0, 0), RangeError);
});

test('subtraction and remainder methods agree while operation counts depend on input', () => {
  const short = Model.compareAlgorithms(252, 105);
  assert.equal(short.sameResult, true);
  assert.equal(short.gcd, 21);
  const largeGap = Model.compareAlgorithms(987, 1);
  assert.equal(largeGap.sameResult, true);
  assert.equal(largeGap.euclid.operations, 1);
  assert.equal(largeGap.subtraction.operations, 986);
  assert.equal(largeGap.subtraction.trace.length, 12);
  assert.equal(largeGap.subtraction.omitted, 974);
  assert.throws(() => Model.runSubtraction(0, 28), RangeError);
});

test('fixed flawed draft detects a zero-value non-progress state within its hard bound', () => {
  const aZero = Model.runFixedDraft(12, 0);
  const bZero = Model.runFixedDraft(0, 12);
  assert.equal(aZero.terminated, false);
  assert.equal(aZero.repeatedState, true);
  assert.equal(aZero.operations, 1);
  assert.equal(bZero.terminated, false);
  assert.equal(bZero.operations, 1);
  assert.equal(aZero.trace.at(-1).a, 12);
  assert.equal(aZero.trace.at(-1).b, 0);
  assert.throws(() => Model.runFixedDraft(0, 0), RangeError);
});

test('a normally progressing fixed draft is bounded and returns the common divisor', () => {
  const result = Model.runFixedDraft(18, 12);
  assert.equal(result.terminated, true);
  assert.equal(result.result, 6);
  assert.ok(result.operations <= Model.MAX_DRAFT_STEPS);
});
