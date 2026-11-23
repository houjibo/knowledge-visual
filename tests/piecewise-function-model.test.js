const assert = require('node:assert/strict');
const model = require('../math/high/assets/piecewise-function-model');

for (const [id, input, branch, value] of [
  ['shipping', '0.01', 'first', 5], ['shipping', '1.99', 'first', 5],
  ['shipping', '2', 'first', 5], ['shipping', '2.01', 'second', 8],
  ['shipping', '5', 'second', 8], ['tank', '0', 'first', 0],
  ['tank', '1.99', 'first', 3.98], ['tank', '2', 'first', 4],
  ['tank', '2.01', 'second', 4.01], ['tank', '5', 'second', 7]
]) {
  const result = model.evaluate(id, input);
  assert.equal(result.status, 'valid', `${id}/${input}`);
  assert.equal(result.branch, branch, `${id}/${input}`);
  assert.equal(result.value, value, `${id}/${input}`);
  assert.equal(model.check(id, input, 'correct', 'first', String(value)).status, 'correct');
}
for (const [id, input] of [
  ['shipping', '0'], ['shipping', '-0.01'], ['shipping', '5.01'],
  ['tank', '-0.01'], ['tank', '5.01'], ['tank', '2.001'],
  ['tank', 'Infinity'], ['tank', ''], ['tank', 'foo']
]) assert.equal(model.evaluate(id, input).status, 'invalid', `${id}/${input}`);
assert.equal(model.check('shipping', '2', '', '', '').status, 'incomplete');
assert.equal(model.check('shipping', '2', 'boundary-next', 'first', '5').status, 'wrong');
assert.equal(model.check('shipping', '2', 'correct', 'second', '5').status, 'wrong');
assert.equal(model.check('tank', '2.01', 'correct', 'first', '4').status, 'wrong');
assert.deepEqual(model.table('shipping'), [
  {input:1.9,value:5},{input:2,value:5},{input:2.1,value:8}
]);
assert.deepEqual(model.table('tank'), [
  {input:1.9,value:3.8},{input:2,value:4},{input:2.1,value:4.1}
]);
const [shippingFirst, shippingSecond] = model.getScenario('shipping').segments;
assert.equal(shippingFirst.endClosed, true);
assert.equal(shippingSecond.startClosed, false);
const [tankFirst, tankSecond] = model.getScenario('tank').segments;
assert.equal(tankFirst.yTo, tankSecond.yFrom);
assert.throws(() => model.evaluate('unknown', '1'), RangeError);
console.log('piecewise function model: passed');
