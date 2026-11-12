'use strict';
const assert = require('node:assert/strict');
const {test} = require('node:test');
const Model = require('../computer/primary/assets/sequential-search-model.js');

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(freeze);
  }
  return value;
}

test('three card orders and every offered target match an independent position oracle', () => {
  for (const values of Object.values(Model.PRESETS)) for (const target of [1, 2, 4, 5, 7, 9]) {
    const expectedPosition = values.indexOf(target);
    const expectedCount = expectedPosition < 0 ? 5 : expectedPosition + 1;
    let state = Model.createState(values, target);
    assert.deepEqual(state.values, values);
    assert.equal(state.comparisons, 0);
    for (let index = 0; index < expectedCount; index++) {
      const previous = freeze(state);
      state = Model.step(previous);
      assert.notStrictEqual(state, previous);
      assert.equal(state.comparisons, index + 1);
      assert.deepEqual(state.history, values.slice(0, index + 1).map((value, position) => ({
        index: position, value, match: value === target
      })));
      assert.equal(state.done, index === expectedCount - 1);
      assert.equal(state.nextIndex, index + 1);
    }
    assert.equal(state.foundIndex, expectedPosition < 0 ? null : expectedPosition);
    assert.strictEqual(Model.step(state), state);
    assert.equal(state.comparisons, expectedCount);
  }
});

test('inputs are copied and invalid card sets or targets are rejected', () => {
  const values = [4, 2, 7, 1, 5], state = Model.createState(values, 7);
  values[0] = 8;
  assert.deepEqual(state.values, [4, 2, 7, 1, 5]);
  for (const cards of [[1, 2, 3, 4], [1, 2, 3, 4, 4], [1, 2, 3, 4, 10], [1, 2, 3, 4, 1.5]])
    assert.throws(() => Model.createState(cards, 7), RangeError);
  for (const target of [0, 10, NaN, '7']) assert.throws(() => Model.createState([4, 2, 7, 1, 5], target), RangeError);
});
