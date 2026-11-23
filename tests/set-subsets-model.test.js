const assert = require('node:assert/strict');
const model = require('../math/high/assets/set-subsets-model.js');

for (const mask of model.candidates) {
  const expected = model.subsetsOf(mask);
  assert.equal(expected.length, 2 ** model.members(mask).length);
  assert.ok(expected.includes(0));
  assert.ok(expected.includes(mask));
  assert.equal(model.check(mask, expected.length, expected).status, 'correct');
}
assert.deepEqual(model.subsetsOf(0), [0]);
assert.deepEqual(model.subsetsOf(7), model.candidates);
assert.match(model.check(3, 4, [1, 2, 3]).feedback, /漏选 ∅/);
assert.match(model.check(3, 4, [0, 1, 2, 3, 4]).feedback, /桃 不属于 A/);
assert.match(model.check(3, 3, [0, 1, 2, 3]).feedback, /个数应为 4/);
assert.equal(model.check(3, '', []).status, 'incomplete');
assert.throws(() => model.subsetsOf(8), RangeError);
assert.throws(() => model.check(3, 4, [0, 0]), TypeError);
console.log('set-subsets-model: all cases passed');
