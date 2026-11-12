'use strict';
const assert = require('node:assert/strict');
const {test} = require('node:test');
const Model = require('../computer/primary/assets/adjacent-swap-sort-model.js');

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(freeze);
  }
  return value;
}
function permutations(values) {
  if (!values.length) return [[]];
  return values.flatMap((value, index) => permutations(values.filter((_, position) => position !== index))
    .map(rest => [value, ...rest]));
}

test('all 120 five-card orders match an independent adjacent-comparison oracle', () => {
  for (const input of permutations([1, 2, 3, 4, 5])) {
    const expected = input.slice();
    let state = Model.createState(input), comparisons = 0, swaps = 0;
    let endedEarly = false;
    for (let pass = 1; pass <= 4; pass++) {
      let passSwaps = 0;
      for (let index = 0; index < 5 - pass; index++) {
        const left = expected[index], right = expected[index + 1];
        const swapped = left > right;
        if (swapped) { expected[index] = right; expected[index + 1] = left; swaps++; passSwaps++; }
        const previous = freeze(state), oldJSON = JSON.stringify(previous);
        state = Model.step(previous);
        comparisons++;
        assert.equal(JSON.stringify(previous), oldJSON);
        assert.deepEqual(state.values, expected);
        assert.equal(state.comparisons, comparisons);
        assert.equal(state.swaps, swaps);
        assert.deepEqual(state.last, {
          pass, pairIndex: index, left, right, swapped, after: expected.slice(),
          passEnded: index === 4 - pass, earlyStop: index === 4 - pass && passSwaps === 0
        });
        assert.equal(state.history.length, comparisons);
        if (index < 4 - pass) {
          assert.equal(state.pass, pass);
          assert.equal(state.pairIndex, index + 1);
          assert.equal(state.settledCount, pass - 1);
          assert.equal(state.done, false);
        }
      }
      assert.deepEqual(state.completedPasses.at(-1), {
        pass, comparisons: 5 - pass, swaps: passSwaps, fixedValue: expected[5 - pass]
      });
      assert.equal(state.settledCount, pass);
      if (passSwaps === 0) { endedEarly = true; assert.equal(state.done, true); break; }
      if (pass < 4) { assert.equal(state.pass, pass + 1); assert.equal(state.pairIndex, 0); assert.equal(state.passSwaps, 0); }
    }
    assert.deepEqual(state.values, [1, 2, 3, 4, 5]);
    assert.equal(state.done, true);
    assert.equal(state.last.earlyStop, endedEarly);
    assert.ok(comparisons <= 10);
    assert.strictEqual(Model.step(state), state);
  }
});

test('named examples expose distinct swap and early-stop boundaries', () => {
  const examples = [
    {values: Model.PRESETS.mixed, firstSwaps: 3, totalComparisons: 10},
    {values: Model.PRESETS.sorted, firstSwaps: 0, totalComparisons: 4},
    {values: Model.PRESETS.reversed, firstSwaps: 4, totalComparisons: 10}
  ];
  for (const {values, firstSwaps, totalComparisons} of examples) {
    let state = Model.createState(values);
    for (let index = 0; index < totalComparisons; index++) state = Model.step(state);
    assert.equal(state.done, true);
    assert.equal(state.comparisons, totalComparisons);
    assert.equal(state.completedPasses[0].swaps, firstSwaps);
    assert.deepEqual(state.values, [1, 2, 3, 4, 5]);
  }
});

test('input is copied; invalid sets and impossible continuation are rejected', () => {
  const cards = [9, 3, 7, 2, 5], state = Model.createState(cards);
  cards[0] = 1;
  assert.deepEqual(state.values, [9, 3, 7, 2, 5]);
  for (const invalid of [[1, 2, 3, 4], [1, 2, 3, 4, 4], [0, 2, 3, 4, 5], [1, 2, 3, 4, 10], [1, 2, 3, 4, 1.5]])
    assert.throws(() => Model.createState(invalid), RangeError);
  assert.throws(() => Model.step({...state, pairIndex: 4}), TypeError);
});
