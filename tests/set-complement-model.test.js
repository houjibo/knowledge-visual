const assert = require('node:assert/strict');
const {test} = require('node:test');
const model = require('../math/high/assets/set-complement-model.js');

test('same A gives different complements when U expands', () => {
  const small = model.stateFor(model.presets.small.universe, model.presets.small.setA);
  const large = model.stateFor(model.presets.large.universe, model.presets.large.setA);
  assert.deepEqual(small.complement, [1, 3]);
  assert.deepEqual(large.complement, [1, 3, 5, 6]);
  assert.deepEqual(small.setA, large.setA);
});

test('all nonempty U and A subsets obey independent set difference and empty-set law', () => {
  const candidates = model.domain;
  let cases = 0;
  for (let uMask = 1; uMask < 1 << candidates.length; uMask++) {
    const universe = candidates.filter((_, i) => uMask & (1 << i));
    for (let aMask = 0; aMask < 1 << candidates.length; aMask++) {
      if (aMask & ~uMask) continue;
      const setA = candidates.filter((_, i) => aMask & (1 << i));
      const expected = universe.filter(n => !setA.includes(n));
      const state = model.stateFor([...universe].reverse(), [...setA].reverse());
      assert.deepEqual(state.complement, expected);
      assert.equal(state.isEmpty, setA.length === universe.length);
      const emptyChoice = expected.length ? 'nonempty' : 'empty';
      const right = model.checkPrediction(universe, setA, expected, emptyChoice);
      assert.equal(right.status, 'correct');
      assert.deepEqual(right.complement, expected);
      const wrongJudgment = model.checkPrediction(universe, setA, expected,
        expected.length ? 'empty' : 'nonempty');
      assert.equal(wrongJudgment.status, 'wrong');
      assert.equal(wrongJudgment.emptyCorrect, false);
      const flipped = expected.includes(universe[0])
        ? expected.filter(n => n !== universe[0]) : [...expected, universe[0]];
      assert.equal(model.checkPrediction(universe, setA, flipped, emptyChoice).status, 'wrong');
      cases++;
    }
  }
  assert.equal(cases, 728);
});

test('feedback separates missing, extra and empty-set judgment', () => {
  const result = model.checkPrediction([1, 2, 3, 4], [2, 4], [2, 3], 'empty');
  assert.equal(result.status, 'wrong');
  assert.deepEqual(result.missing, [1]);
  assert.deepEqual(result.extra, [2]);
  assert.equal(result.emptyCorrect, false);
  assert.match(result.feedback, /漏选补集元素 1/);
  assert.match(result.feedback, /多选了 A 中的元素 2/);
  assert.match(result.feedback, /不是空集/);
  assert.equal(model.checkPrediction([1], [], [1]).status, 'incomplete');
});

test('invalid universes, subsets, predictions and judgments are rejected', () => {
  assert.throws(() => model.stateFor([], []), /至少/);
  assert.throws(() => model.stateFor([1, 1], []), /不重复/);
  assert.throws(() => model.stateFor([1], [2]), /子集/);
  assert.throws(() => model.stateFor([1, 7], []), /候选/);
  assert.throws(() => model.checkPrediction([1], [], [2], 'nonempty'), /只能选 U/);
  assert.throws(() => model.checkPrediction([1], [], [1, 1], 'nonempty'), /不重复/);
  assert.throws(() => model.checkPrediction([1], [], [1], 'maybe'), /未知/);
});
