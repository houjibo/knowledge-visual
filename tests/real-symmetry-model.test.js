const assert = require('node:assert/strict');
const model = require('../math/middle/assets/real-symmetry-model.js');

const expected = new Map([
  ['root-positive', Math.sqrt(2)], ['root-negative', -Math.sqrt(2)],
  ['pi-positive', Math.PI], ['pi-negative', -Math.PI],
  ['e-positive', Math.E], ['e-negative', -Math.E],
  ['rational-positive', 1.5], ['rational-negative', -1.5], ['zero', 0], ['root-zero', 0]
]);
assert.equal(model.cases.length, expected.size);
assert.equal(new Set(model.cases.map(item => item.id)).size, expected.size);
assert.equal(new Set(model.cases.map(item => item.group)).size, 4);
for (const item of model.cases) {
  assert.equal(item.value, expected.get(item.id), item.id);
  assert.ok(model.percent(item.value) >= 0 && model.percent(item.value) <= 100);
  const nearest = (Math.round(item.value * 10) / 10).toFixed(1);
  const opposite = (Math.round(-item.value * 10) / 10).toFixed(1);
  assert.equal(model.checkPosition(item, 'original', nearest).valid, true, item.id);
  assert.equal(model.checkPosition(item, 'opposite', opposite).valid, true, item.id);
  assert.equal(model.checkPosition(item, 'original', '0.0').valid, item.value === 0, item.id);
  assert.equal(model.checkPosition(item, 'opposite', '0.0').valid, item.value === 0, item.id);
  assert.equal(model.options(item).length, 3);
  assert.equal(new Set(model.options(item)).size, 3);
  assert.equal(model.checkConclusion(item, item.opposite, item.absolute, 'distance').valid, true, item.id);
  assert.equal(model.checkConclusion(item, item.label, '0', 'distance').valid, item.id === 'zero', item.id);
  assert.equal(model.checkConclusion(item, item.opposite, item.absolute, 'same-sign').valid, false);
  assert.ok(model.solution(item).text.includes(`|${item.label}|=${item.absolute}`));
  if (item.kind === 'irrational') assert.ok(model.solution(item).distance.startsWith('≈'));
  else assert.ok(model.solution(item).distance.startsWith('='));
}
assert.equal(model.checkPosition(model.getCase('root-positive'), 'original', '1.8').valid, false);
assert.equal(model.checkPosition(model.getCase('rational-positive'), 'original', '1.4').valid, false);
for (const input of ['4.1', '-4.1', '1.25', 'Infinity', '1e0', 'abc']) assert.equal(model.point(input), null);
assert.equal(model.point('−1.4'), null);
assert.equal(model.displayPoint(-1.4), '−1.4');
assert.equal(model.percent(-4), 0);
assert.equal(model.percent(4), 100);
assert.equal(model.getCase('missing'), null);
assert.equal(model.solution(null), null);
console.log('实数对称模型：10 个案例、近似定位、精确符号与非法输入通过');
