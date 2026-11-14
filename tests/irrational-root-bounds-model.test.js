const assert = require('node:assert/strict');
const m = require('../math/middle/assets/irrational-root-bounds-model.js');

let checked = 0;
for (let n = 2; n <= 99; n++) {
  if (Number.isInteger(Math.sqrt(n))) continue;
  const b = m.bounds(n);
  assert.ok(b.whole ** 2 < n && n < b.wholeUpper ** 2);
  assert.equal(b.wholeUpper, b.whole + 1);
  assert.ok(b.tenth ** 2 < 100 * n && 100 * n < b.tenthUpper ** 2);
  assert.equal(b.tenthUpper, b.tenth + 1);
  assert.equal(m.checkWhole(n, String(b.whole)).status, 'correct');
  assert.equal(m.checkTenth(n, (b.tenth / 10).toFixed(1)).status, 'correct');
  assert.equal(m.reasonOptions(n).filter(x => x.id === 'square-monotone').length, 1);
  assert.equal(m.checkCalculatorInput(n, String(n)).status, 'correct');
  const calculator = m.calculator(n);
  assert.ok(Number(calculator.lower) < Math.sqrt(n) && Math.sqrt(n) < Number(calculator.upper));
  assert.match(calculator.explanation, /≈/);
  assert.equal(m.group(n), n < 25 ? 'low' : n < 64 ? 'middle' : 'high');
  const lower = m.candidate(n, b.tenth / 10), upper = m.candidate(n, b.tenthUpper / 10);
  assert.equal(lower.comparison, 'less');
  assert.equal(upper.comparison, 'greater');
  checked++;
}
assert.equal(checked, 90);
for (const value of [0, 1, 4, 9, 25, 64, 81, 100, -2, 2.5, '02', '2e0', '2abc']) {
  assert.throws(() => m.radicand(value), RangeError);
}
for (const value of [-0.1, 10.1, 1.45, '1e0', NaN]) assert.throws(() => m.candidate(2, value), RangeError);
assert.equal(m.checkWhole(2, '2').status, 'incorrect');
assert.equal(m.checkWhole(2, '1.0').status, 'empty');
assert.equal(m.checkTenth(2, '1.5').status, 'incorrect');
assert.equal(m.checkTenth(2, '1.40').status, 'empty');
assert.equal(m.checkReason('reverse').status, 'incorrect');
assert.equal(m.checkReason('cubes').status, 'incorrect');
assert.equal(m.checkReason('square-monotone').status, 'correct');
assert.equal(m.checkCalculatorInput(50, '49').status, 'incorrect');
assert.equal(m.checkCalculatorInput(50, 'not a number').status, 'empty');
console.log(`无理数夹逼模型：${checked} 个非完全平方数、两级界限和错误反馈通过`);
