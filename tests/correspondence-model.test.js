const assert = require('node:assert/strict');
const model = require('../math/high/assets/correspondence-model');

assert.deepEqual(model.domain, [-2, 0, 2]);
assert.deepEqual(model.codomain, [0, 2, 4]);
const square = model.analyze(model.presets.square);
assert.equal(square.isFunction, true);
assert.deepEqual(square.range, [0, 4]);
assert.deepEqual(square.missing, []);
assert.deepEqual(square.multiple, []);
assert.equal(model.check(model.presets.square, 'yes', [0, 4]).status, 'correct');
assert.equal(model.check(model.presets.square, 'yes', [0, 2, 4]).status, 'wrong');
assert.equal(model.check(model.presets.square, 'no', []).status, 'wrong');
assert.equal(model.check(model.presets.square, 'yes', []).status, 'incomplete');
assert.equal(model.check(model.presets.square, '', []).status, 'incomplete');

const missing = model.analyze(model.presets.missing);
assert.equal(missing.isFunction, false);
assert.deepEqual(missing.missing, [0]);
assert.equal(missing.range, null);
assert.match(model.check(model.presets.missing, 'no', []).feedback, /x=0 没有对应值/);
assert.equal(model.check(model.presets.missing, 'no', []).status, 'correct');
const multiple = model.analyze(model.presets.multiple);
assert.equal(multiple.isFunction, false);
assert.deepEqual(multiple.multiple, [-2]);
assert.equal(multiple.range, null);
assert.match(model.check(model.presets.multiple, 'no', []).feedback, /x=-2 同时对应 2 和 4/);
assert.equal(model.check(model.presets.multiple, 'no', []).status, 'correct');

const mixed = model.analyze({'-2': [], '0': [0, 2], '2': [4]});
assert.deepEqual(mixed.missing, [-2]);
assert.deepEqual(mixed.multiple, [0]);
assert.equal(mixed.range, null);
assert.equal(model.check({'-2': [4, 4], '0': [0], '2': [4]}, 'yes', [0, 4]).status, 'correct');
assert.deepEqual(model.presets.square['-2'], [4]);
assert.throws(() => model.analyze({'-2': [5], '0': [0], '2': [4]}), RangeError);
assert.throws(() => model.analyze({'-2': [4], '0': null, '2': [4]}), RangeError);
assert.throws(() => model.check(model.presets.square, 'yes', [5]), RangeError);
console.log('correspondence model: passed');
