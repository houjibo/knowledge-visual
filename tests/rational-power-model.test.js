const assert = require('node:assert/strict');
const test = require('node:test');
const Model = require('../math/middle/assets/rational-power-model.js');

test('finite examples have exact, unique answers and the expected factor count', () => {
  const expected = new Map([
    ['positive', '8'], ['negative-even', '4'], ['negative-odd', '−8'],
    ['outside-minus', '−4'], ['fraction', '1/8'],
    ['negative-fraction', '1/4'], ['zero', '0']
  ]);
  assert.equal(Model.cases.length, expected.size);
  for (const item of Model.cases) {
    const trace = Model.powerTrace(item.id);
    assert.equal(trace.result, expected.get(item.id));
    assert.equal(trace.expression, item.expression);
    assert.equal(trace.factors.length, trace.exponent);
    assert.equal(new Set(trace.choices).size, trace.choices.length);
    assert.equal(trace.choices.filter(choice => choice === trace.result).length, 1);
    assert.ok(trace.explanation.length > 15);
  }
  assert.deepEqual(Model.powerTrace('negative-even').factors, ['−2', '−2']);
  assert.deepEqual(Model.powerTrace('outside-minus').factors, ['2', '2']);
  assert.equal(Model.powerTrace('outside-minus').outsideMinus, true);
  assert.throws(() => Model.powerTrace('unknown'), /未知/);
});
