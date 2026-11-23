const assert = require('node:assert/strict');
const model = require('../math/high/assets/quadratic-function-link-model');

const cases = [
  [[1, -2, -3], 2, 'outside', '(-∞, -1) ∪ (3, +∞)'],
  [[-1, 2, 3], 2, 'inside', '(-1, 3)'],
  [[1, -2, 1], 1, 'except', '{x∈ℝ | x≠1}'],
  [[-1, 2, -1], 1, 'none', '∅'],
  [[1, 0, 1], 0, 'all', 'ℝ'],
  [[-1, 0, -1], 0, 'none', '∅'],
  [[-1, 5, -4], 2, 'inside', '(1, 4)'],
  [[0.5, 0, -1], 2, 'outside', '(-∞, (0−√8)/2) ∪ ((0+√8)/2, +∞)'],
  [[1.5, 0.5, 0], 2, 'outside', '(-∞, -1/3) ∪ (0, +∞)'],
  [[0.5, 0.5, 0], 2, 'outside', '(-∞, -1) ∪ (0, +∞)'],
];
for (const [coefficients, count, region, solution] of cases) {
  const state = model.analyze(...coefficients);
  assert.equal(state.rootCount, count, coefficients.join(','));
  assert.equal(state.region, region, coefficients.join(','));
  assert.equal(state.solution, solution, coefficients.join(','));
  for (const root of state.roots) {
    assert.ok(Math.abs(coefficients[0]*root*root + coefficients[1]*root + coefficients[2]) < 1e-10);
  }
}
assert.equal(model.checkScenario('garden', 'area-greater', '2', 'inside').status, 'correct');
assert.equal(model.checkScenario('garden', 'area-less', '2', 'inside').status, 'wrong');
assert.equal(model.checkScenario('garden', '', '2', 'inside').status, 'incomplete');
assert.match(model.checkScenario('garden', 'area-greater', '2', 'inside').feedback, /0<x<5.*1<x<4/);
assert.equal(model.analyze(0.5, 0.5, 0).discriminant, 0.25);
assert.throws(() => model.analyze(0, 2, 1), RangeError);
assert.throws(() => model.analyze(0.1, 2, 1), RangeError);
console.log('quadratic function link model: passed');
