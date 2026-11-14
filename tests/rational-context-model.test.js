const assert = require('node:assert/strict');
const model = require('../math/middle/assets/rational-context-model.js');

assert.deepEqual(model.scenarios.map(item => item.id), ['warming', 'height', 'robot', 'cooling']);
assert.equal(model.resultFor('warming'), '3');
assert.equal(model.resultFor('height'), '-5');
assert.equal(model.resultFor('robot'), '-0.75');
assert.equal(model.resultFor('cooling'), '2.5');
assert.equal(model.addDecimal('-0.2', '0.1'), '-0.1');
assert.equal(model.addDecimal('-0.125', '0.125'), '0');
assert.equal(model.addDecimal('0.005', '0.005'), '0.01');
assert.equal(model.checkExpression('warming', 'warm-start').status, 'wrong');
assert.match(model.checkExpression('warming', 'warm-start').feedback, /−6/);
assert.equal(model.checkExpression('warming', 'warm-right').status, 'correct');
assert.equal(model.checkExpression('warming', null).status, 'invalid');
assert.equal(model.checkResult('height', '-5').status, 'correct');
assert.equal(model.checkResult('height', '5').status, 'wrong-sign');
assert.equal(model.checkResult('robot', '−0.750').status, 'correct');
assert.equal(model.checkResult('robot', '-0.7').status, 'wrong');
assert.equal(model.checkResult('warming', '3°C').status, 'invalid');
assert.equal(model.checkResult('warming', 'Infinity').status, 'invalid');
assert.equal(model.checkResult('warming', '<script>').status, 'invalid');
assert.equal(model.checkInterpretation('height', 'height-below').status, 'correct');
assert.match(model.checkInterpretation('height', 'height-above').feedback, /负数/);
assert.equal(model.checkInterpretation('height', null).status, 'invalid');
assert.throws(() => model.scenario('unknown'), /未知/);
assert.throws(() => model.parseDecimal('1e3'), /十进制/);

console.log('rational context model passed');
