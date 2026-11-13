const assert = require('node:assert/strict');
const test = require('node:test');
const Model = require('../math/middle/assets/rational-number-model.js');

test('signed integers, brackets and precedence match independent arithmetic', () => {
  const examples = new Map([
    ['-3+5', 2], ['(-2)×(-3)', 6], ['0×(-4)', 0],
    ['1+2×3', 7], ['(1+2)×3', 9], ['6÷(-2)+4', 1],
    ['-(2+3)×2', -10], ['.5+1.25', 1.75],
  ]);
  for (const [expression, expected] of examples) {
    assert.equal(Model.evaluate(expression).value, expected, expression);
  }
  for (let left = -5; left <= 5; left++) {
    for (let right = -5; right <= 5; right++) {
      assert.equal(Model.evaluate(`(${left})+(${right})`).value, left + right);
      assert.equal(Model.evaluate(`(${left})×(${right})`).value, left * right || 0);
      if (right !== 0) assert.equal(Model.evaluate(`(${left})÷(${right})`).value, left / right || 0);
    }
  }
});

test('zero has no positive or negative sign and repeating decimals are marked approximate', () => {
  assert.match(Model.evaluate('0×(-4)').rule, /既不是正数也不是负数/);
  assert.match(Model.evaluate('0÷(-4)').rule, /既不是正数也不是负数/);
  assert.match(Model.evaluate('(-2)×(-3)').rule, /结果为正/);
  assert.match(Model.evaluate('(-2)×3').rule, /结果为负/);
  assert.equal(Model.evaluate('1÷3').approximate, true);
  assert.equal(Model.evaluate('1÷3').text, '0.333333');
  assert.equal(Model.evaluate('0.1+0.2').text, '0.3');
});

test('invalid input cannot become a result or run JavaScript', () => {
  for (const expression of ['', '1÷0', '1÷(2-2)', '1+', '(-2', '1..2',
    '1+2)', '2**3', 'globalThis.x=1', '9'.repeat(81), '99999999+2']) {
    assert.throws(() => Model.evaluate(expression), expression);
  }
  assert.equal(globalThis.x, undefined);
});
