const assert = require('node:assert/strict');
const model = require('../math/middle/assets/scientific-approx-model.js');

assert.deepEqual(model.scientificForm('72500000'), {coefficient: '7.25', exponent: 7});
assert.deepEqual(model.scientificForm('0.000056'), {coefficient: '5.6', exponent: -5});
assert.deepEqual(model.scientificForm('-384000'), {coefficient: '-3.84', exponent: 5});
assert.deepEqual(model.scientificForm('0'), {coefficient: '0', exponent: null});
assert.equal(model.expandScientific('7.25', 7), '72500000');
assert.equal(model.expandScientific('5.6', -5), '0.000056');
assert.equal(model.expandScientific('-3.84', 5), '-384000');
assert.equal(model.checkScientific('72500000', '72.5', '6').status, 'equivalent-not-normalized');
assert.equal(model.checkScientific('72500000', '7.25', '7').status, 'correct');
assert.equal(model.checkScientific('0.000056', '5.6', '-5').status, 'correct');
assert.equal(model.checkScientific('-384000', '3.84', '5').status, 'wrong');
assert.equal(model.checkScientific('-384000', '-3.84', '5').status, 'correct');
assert.equal(model.checkScientific('72500000', '7.25', '6').status, 'wrong');
assert.equal(model.checkScientific('72500000', '0', '7').status, 'wrong');
assert.equal(model.checkScientific('72500000', '7.25', '1.5').status, 'invalid');
assert.equal(model.checkScientific('72500000', '7.25', '13').status, 'invalid');
assert.equal(model.checkScientific('72500000', '7.25e7', '0').status, 'invalid');
assert.throws(() => model.expandScientific('7.25', 13), /指数/);
assert.throws(() => model.checkScientific('0', '0', '0'), /零/);

assert.deepEqual(model.roundAt('12.346', -1), {
  expected: '12.3', lower: '12.3', upper: '12.4', position: 0.46, direction: 'down', nextDigit: 4
});
assert.deepEqual(model.roundAt('7.995', -2), {
  expected: '8.00', lower: '7.99', upper: '8.00', position: 0.5, direction: 'up', nextDigit: 5
});
assert.deepEqual(model.roundAt('124650', 3), {
  expected: '125000', lower: '124000', upper: '125000', position: 0.65, direction: 'up', nextDigit: 6
});
assert.equal(model.roundAt('0.00476', -3).expected, '0.005');
assert.equal(model.roundAt('0.1', -2).expected, '0.10');
assert.equal(model.roundAt('0.1', -2).direction, 'exact');
assert.equal(model.checkApprox('7.995', -2, '8.00').status, 'correct');
assert.equal(model.checkApprox('7.995', -2, '8').status, 'precision');
assert.equal(model.checkApprox('7.995', -2, '7.99').status, 'wrong');
assert.equal(model.checkApprox('7.995', -2, '<script>').status, 'invalid');
assert.throws(() => model.roundAt('-0.5', -1), /非负/);
assert.throws(() => model.roundAt('12.3e2', 0), /十进制/);

console.log('scientific notation and approximation model passed');
