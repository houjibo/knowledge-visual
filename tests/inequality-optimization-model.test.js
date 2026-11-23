const assert = require('node:assert/strict');
const model = require('../math/high/assets/inequality-optimization-model.js');

for (const scenario of model.scenarios) {
  const objective = scenario.objective.includes('ab') ? pair => pair.a * pair.b : pair => pair.a + pair.b;
  assert(scenario.pairs.every(pair => pair.a >= 0 && pair.b >= 0));
  const best = scenario.objective.includes('最大值')
    ? Math.max(...scenario.pairs.map(objective)) : Math.min(...scenario.pairs.map(objective));
  assert.equal(best, scenario.optimum, scenario.id);
  const winningPair = scenario.pairs.find(pair => objective(pair) === scenario.optimum);
  assert.equal(model.check(scenario.id, winningPair.id, scenario.optimum).status, 'correct');
  assert.equal(model.check(scenario.id, winningPair.id, '').status, 'incomplete');
  assert.equal(model.check(scenario.id, winningPair.id, 'Infinity').status, 'incomplete');
  assert.equal(model.check(scenario.id, winningPair.id, scenario.optimum + 1).status, 'incorrect');
  assert.equal(model.check(scenario.id, '', scenario.optimum).status, 'incomplete');
}
assert.match(model.check('sum-restricted', '1-3', 4).feedback, /不符合 a≤1/);
assert.match(model.check('product-restricted', '1-4', 4).feedback, /不符合 a≤1/);
assert.match(model.check('sum-zero', '0-0', 0).feedback, /零边界成立/);
assert.match(model.check('product-zero', '0-0', 0).feedback, /没有最大值/);
assert.throws(() => model.check('unknown', '0-0', 0), RangeError);
console.log('inequality-optimization-model: six scenarios and boundary feedback passed');
