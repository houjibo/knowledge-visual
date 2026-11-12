'use strict';
const assert = require('node:assert/strict');
const {test} = require('node:test');
const Model = require('../computer/high/assets/search-strategies-model.js');

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(freeze);
  }
  return value;
}
function reference(values, target) {
  const linear = [];
  for (let index = 0; index < values.length; index++) {
    const matched = values[index] === target;
    linear.push({index, value: values[index], matched});
    if (matched) break;
  }
  const binary = [];
  if (values.every((value, index) => index === 0 || values[index - 1] < value)) {
    let low = 0, high = values.length - 1;
    while (low <= high) {
      const index = Math.floor((low + high) / 2), value = values[index];
      const relation = value === target ? 'equal' : target < value ? 'left' : 'right';
      const afterLow = relation === 'right' ? index + 1 : low;
      const afterHigh = relation === 'left' ? index - 1 : high;
      const discarded = relation === 'left' ? [index, high] : relation === 'right' ? [low, index] : null;
      binary.push({beforeLow: low, beforeHigh: high, index, value, relation,
        afterLow, afterHigh, discarded});
      if (relation === 'equal') break;
      low = afterLow; high = afterHigh;
    }
  }
  return {linear, binary};
}

test('all supported sizes, targets and orders match an independent trace at every tick', () => {
  for (const size of [7, 15]) for (const order of ['sorted', 'shuffled']) {
    for (let target = 1; target <= size + 1; target++) {
      const scenario = target === 1 ? 'front' : target === size - 1 ? 'near' : 'missing';
      if (![1, size - 1, size + 1].includes(target)) continue;
      let state = Model.createState({size, order, scenario});
      assert.equal(state.target, target);
      const {linear, binary} = reference(state.values, target);
      assert.equal(state.binary.available, order === 'sorted');
      const total = Math.max(linear.length, binary.length);
      for (let tick = 1; tick <= total; tick++) {
        const previous = freeze(state), serialized = JSON.stringify(previous);
        state = Model.step(previous);
        assert.equal(JSON.stringify(previous), serialized);
        assert.equal(state.ticks, tick);
        assert.deepEqual(state.linear.history, linear.slice(0, tick));
        assert.deepEqual(state.binary.history, binary.slice(0, tick));
        assert.equal(state.linear.comparisons, Math.min(tick, linear.length));
        assert.equal(state.binary.comparisons, Math.min(tick, binary.length));
        assert.equal(state.linear.done, tick >= linear.length);
        if (order === 'sorted') assert.equal(state.binary.done, tick >= binary.length);
        else assert.equal(state.binary.done, false);
        if (order === 'sorted' && tick <= binary.length) {
          assert.equal(state.binary.low, binary[tick - 1].afterLow);
          assert.equal(state.binary.high, binary[tick - 1].afterHigh);
        }
      }
      assert.equal(state.done, true);
      assert.equal(state.linear.foundIndex, state.values.indexOf(target) >= 0 ? state.values.indexOf(target) : null);
      assert.equal(state.binary.foundIndex, order === 'sorted' && target <= size ? target - 1 : null);
      const actualWinner = order === 'shuffled' ? null : linear.length < binary.length ? 'linear' :
        linear.length > binary.length ? 'binary' : 'tie';
      assert.equal(Model.winner(state), actualWinner);
      assert.strictEqual(Model.step(state), state);
    }
  }
});

test('named cases expose comparison reversal and input-size growth', () => {
  for (const [size, scenario, linear, binary, winner] of [
    [15, 'front', 1, 4, 'linear'], [15, 'near', 14, 3, 'binary'],
    [7, 'missing', 7, 3, 'binary'], [15, 'missing', 15, 4, 'binary']
  ]) {
    let state = Model.createState({size, scenario});
    while (!state.done) state = Model.step(state);
    assert.equal(state.linear.comparisons, linear);
    assert.equal(state.binary.comparisons, binary);
    assert.equal(Model.winner(state), winner);
  }
});

test('unsupported configuration and impossible active range are rejected', () => {
  for (const options of [{size: 8}, {size: 15, order: 'other'}, {scenario: 'other'}])
    assert.throws(() => Model.createState(options), RangeError);
  const state = Model.createState();
  assert.throws(() => Model.step({...state, binary: {...state.binary, low: 15}}), TypeError);
  assert.throws(() => Model.step({}), TypeError);
});
