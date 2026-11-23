const assert = require('node:assert/strict');
const model = require('../math/high/assets/inequality-foundations-model.js');

for (const start of ['equal', 'greater']) {
  for (const operation of ['add', 'multiply']) {
    for (const c of [-2, 0, 2]) {
      const state = model.evaluate(start, operation, c);
      const expectedLeft = operation === 'add' ? state.a + c : state.a * c;
      const expectedRight = operation === 'add' ? state.b + c : state.b * c;
      const expectedSign = expectedLeft < expectedRight ? '<' : expectedLeft > expectedRight ? '>' : '=';
      assert.equal(state.left, expectedLeft);
      assert.equal(state.right, expectedRight);
      assert.equal(state.after, expectedSign);
      assert.equal(model.check(start, operation, c, expectedSign).status, 'correct');
    }
  }
}
assert.equal(model.evaluate('greater', 'multiply', -2).after, '<');
assert.equal(model.evaluate('greater', 'multiply', 0).after, '=');
assert.equal(model.evaluate('equal', 'multiply', -2).after, '=');
assert.equal(model.evaluate('greater', 'add', -2).after, '>');
assert.match(model.check('greater', 'multiply', -2, '>').feedback, /同乘负数/);
assert.match(model.check('greater', 'multiply', 0, '>').feedback, /同乘零/);
assert.equal(model.check('equal', 'add', 2, '').status, 'incomplete');
assert.throws(() => model.evaluate('greater', 'multiply', 1), RangeError);
assert.throws(() => model.check('equal', 'add', 2, '≤'), RangeError);
console.log('inequality-foundations-model: 12 cases and boundaries passed');
