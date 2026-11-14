const assert = require('node:assert/strict');
const {parseNumber, squareArea} = require('../math/middle/assets/real-number-model.js');

const cases = [
  ['√4', 2, 'rational', true],
  ['4/2', 2, 'rational', true],
  ['√1.44', 1.2, 'rational', false],
  ['√1.3', Math.sqrt(1.3), 'irrational', false],
  ['√0', 0, 'rational', true],
  ['-√4', -2, 'rational', true],
  ['π/2', Math.PI / 2, 'irrational', false],
  ['e-1', Math.E - 1, 'irrational', false],
  ['π*0', 0, 'rational', true],
  ['-3/2', -1.5, 'rational', false],
  ['1/2', 0.5, 'rational', false],
  ['sqrt(9)', 3, 'rational', true],
];
for (const [input, value, kind, isInteger] of cases) {
  const result = parseNumber(input);
  assert.ok(result, `${input} should parse`);
  assert.ok(Math.abs(result.value - value) < 1e-12, `${input} has wrong value`);
  assert.equal(result.kind, kind, `${input} has wrong kind`);
  assert.equal(result.isInteger, isInteger, `${input} has wrong integer status`);
}

const invalid = ['π/0', '1/0', '√-2', '2foo', 'π+e', '√2garbage',
  'π/2;globalThis.realNumberInjection=1', 'alert(1)', ''];
for (const input of invalid) assert.equal(parseNumber(input), null, `${input} should be rejected`);
assert.equal(globalThis.realNumberInjection, undefined);

function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a;
}
for (let tenths = 10; tenths <= 250; tenths++) {
  const factor = gcd(tenths, 10);
  const numerator = tenths / factor;
  const denominator = 10 / factor;
  const exactRationalRoot = Number.isInteger(Math.sqrt(numerator)) && Number.isInteger(Math.sqrt(denominator));
  const result = squareArea(String(tenths / 10));
  assert.equal(result.kind, exactRationalRoot ? 'rational' : 'irrational', `area ${tenths / 10}`);
  assert.equal(result.isSqrtTwo, tenths === 20, `special area ${tenths / 10}`);
}
console.log('real number model: 241 slider areas and input boundaries passed');
