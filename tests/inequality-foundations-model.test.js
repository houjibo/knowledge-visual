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
const values = ['-1000', '-2.5', '-0.001', '0', '0.1', '3.25', '1000'];
for (const a of values) for (const b of values) for (const c of values) {
  for (const operation of ['add', 'multiply']) {
    const result = model.evaluateOpen(a, b, c, operation);
    const before = Number(a) < Number(b) ? '<' : Number(a) > Number(b) ? '>' : '=';
    const after = operation === 'add' || before === '=' ? before
      : Number(c) === 0 ? '=' : Number(c) > 0 ? before : before === '<' ? '>' : '<';
    assert.equal(result.before, before, `${a},${b},${c},${operation}`);
    assert.equal(result.after, after, `${a},${b},${c},${operation}`);
    assert.equal(result.formulaKey, operation === 'add' ? 'unchanged' : 'scaled');
    assert.equal(model.checkOpen(a, b, c, operation, after, result.formulaKey).status, 'correct');
  }
}
assert.equal(model.evaluateOpen('0.1', '0.3', '0.2', 'add').difference, '−0.2');
assert.equal(model.evaluateOpen('0.1', '0.1', '0.1', 'multiply').left, '0.01');
assert.equal(model.checkOpen('3', '1', '-2', 'multiply', '<', 'unchanged').status, 'wrong');
assert.equal(model.checkOpen('3', '1', '-2', 'multiply', '', 'scaled').status, 'incomplete');
for (const invalid of ['', 'Infinity', 'NaN', '0.1234', '1000.001', '1e2', 'abc']) {
  assert.equal(model.checkOpen(invalid, '1', '2', 'add', '>', 'unchanged').status, 'invalid', invalid);
}
assert.throws(() => model.evaluateOpen('1', '2', '3', 'divide'), RangeError);
console.log('inequality-foundations-model: 12 fixed cases, 686 open cases and boundaries passed');
