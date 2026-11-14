const assert = require('node:assert/strict');
const model = require('../math/middle/assets/rational-order-model.js');

assert.equal(model.cases.length, 6);
assert.deepEqual(new Set(model.cases.map(item => item.group)), new Set(['negative', 'cross', 'equal']));
for (const item of model.cases) {
  assert.equal(model.getCase(item.id), item);
  assert.equal(model.unitsFromSlider(String(item.aUnits / 4)), item.aUnits);
  assert.equal(model.unitsFromSlider(String(item.bUnits / 4)), item.bUnits);
  assert.equal(model.percent(item.aUnits), (item.aUnits + 16) * 100 / 32);
  assert.equal(model.checkPositions(item, item.aUnits, item.bUnits).valid, true);
  assert.equal(model.checkPositions(item, item.aUnits + 1, item.bUnits).a, false);
  const expected = item.aUnits < item.bUnits ? ['less', 'left', '<']
    : item.aUnits > item.bUnits ? ['greater', 'right', '>'] : ['equal', 'same', '='];
  assert.equal(model.relation(item), expected[0]);
  assert.equal(model.checkComparison(item, expected[0], expected[1]).valid, true);
  assert.equal(model.checkComparison(item, expected[0], 'wrong').reason, false);
  assert.equal(model.relationText(item), `${item.a} ${expected[2]} ${item.b}`);
}
assert.equal(model.getCase('missing'), null);
for (const value of ['', '1/2', 'Infinity', '4.25', '-4.25', '0.1', '1 + 1']) {
  assert.equal(model.unitsFromSlider(value), null, value);
}
assert.equal(model.unitsFromSlider('-0.5'), -2);
assert.equal(model.displayUnits(-2), '−0.5');
assert.equal(model.displayUnits(3), '0.75');
assert.equal(model.percent(-16), 0);
assert.equal(model.percent(16), 100);
console.log('rational-order-model: pass');
