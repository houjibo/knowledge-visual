const assert = require('node:assert/strict');
const m = require('../math/middle/assets/inequality-context-model.js');
assert.equal(m.scenarios.length, 3);
for (const s of m.scenarios) {
  assert.equal(m.checkExpression(s, String(s.coefficient), String(s.fixed), s.relation, String(s.limit)), true);
  assert.equal(m.checkExpression(s, String(s.coefficient), String(s.fixed), s.relation === 'le' ? 'ge' : 'le', String(s.limit)), false);
  const n = m.boundary(s);
  assert.equal(m.trial(s, String(n)).meets, true);
  assert.equal(m.trial(s, String(n + (s.kind === 'max' ? 1 : -1))).meets, false);
  for (let x = 0; x <= 10; x++) {
    const expected = s.kind === 'max' ? x <= n : x >= n;
    assert.equal(m.trial(s, String(x)).meets, expected, `${s.id} x=${x}`);
  }
}
assert.deepEqual(m.scenarios.map(m.boundary), [5, 4, 5]);
for (const value of ['', '-1', '0.5', '1e2', 'Infinity', '9007199254740992']) assert.equal(m.integer(value), null);
assert.equal(m.trial(m.scenarios[0], '11'), null);
assert.equal(m.getScenario('missing'), null);
console.log('inequality context model: exact integer boundaries pass');
