const assert = require('node:assert/strict');
const m = require('../math/middle/assets/square-cube-roots-model.js');

for (let n = 1; n <= 10; n++) {
  const square = m.power(n, 2), cube = m.power(n, 3);
  assert.equal(square.count, n * n);
  assert.equal(square.layerSize, n * n);
  assert.equal(square.layers, 1);
  assert.equal(cube.count, n ** 3);
  assert.equal(cube.layerSize * cube.layers, cube.count);
  for (const [id, kind, answer] of [[`sq-${n * n}`, 'square-positive', String(n)], [`cb-${n ** 3}`, 'cube-positive', String(n)], [`cb-${-(n ** 3)}`, 'cube-negative', String(-n)]]) {
    const current = m.item(id);
    assert.equal(current.kind, kind);
    assert.equal(m.checkPrediction(current, answer).status, 'correct');
    assert.equal(m.checkReason(current, 'inverse').status, 'correct');
    assert.equal(m.reasonOptions(current).filter(x => x.id === 'inverse').length, 1);
    assert.match(m.calculator(current), /回代/);
  }
}
for (const id of ['sq-0', 'cb-0']) {
  const current = m.item(id);
  assert.equal(m.checkPrediction(current, '0').status, 'correct');
  assert.equal(m.checkReason(current, 'inverse').status, 'correct');
}
for (const id of ['sq--9', 'sq--16']) {
  const current = m.item(id);
  assert.equal(m.checkPrediction(current, 'none').status, 'correct');
  assert.equal(m.checkPrediction(current, '-3').status, 'incorrect');
  assert.equal(m.checkReason(current, 'nonnegative').status, 'correct');
  assert.match(m.calculator(current), /实数范围无结果/);
}
assert.equal(m.cases().length, 34);
for (const value of [0, 11, -1, 1.5, '01', '1e1']) assert.throws(() => m.power(value, 2), RangeError);
for (const exp of [0, 4, '2']) assert.throws(() => m.power(2, exp), RangeError);
for (const id of ['sq-121', 'cb-1331', 'none']) assert.throws(() => m.item(id), RangeError);
assert.equal(m.checkPrediction(m.item('sq-49'), '-7').status, 'incorrect');
assert.equal(m.checkPrediction(m.item('cb--64'), '4').status, 'incorrect');
assert.equal(m.checkPrediction(m.item('sq-49'), '7abc').status, 'empty');
assert.equal(m.checkReason(m.item('sq-49'), 'both').status, 'incorrect');
assert.equal(m.checkReason(m.item('cb--64'), 'absolute').status, 'incorrect');
assert.equal(m.checkReason(m.item('sq--9'), 'negative-root').status, 'incorrect');
console.log('平方与立方开方模型：1—10 全域、零、负数及错误反馈通过');
