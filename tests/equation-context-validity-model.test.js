const assert = require('node:assert/strict');
const m = require('../math/middle/assets/equation-context-validity-model.js');
assert.equal(m.cases.length, 3);
for (const c of m.cases) {
  assert.equal(c.candidates.length, 3);
  assert.equal(new Set(c.candidates).size, 3);
  assert.equal(c.coefficient * c.solution + 2 * c.fixed, 2 * c.total);
  assert.ok(c.candidates.includes(c.solution));
  for (const x of c.candidates) {
    const result = m.inspect(c, x);
    assert.equal(result.equation, c.coefficient * x + 2 * c.fixed === 2 * c.total);
    assert.equal(result.allowed, x >= 0 && x % 2 === 0);
  }
}
assert.equal(m.actualSolution(m.getCase('whole')), 8);
assert.equal(m.actualSolution(m.getCase('fraction')), null);
assert.equal(m.actualSolution(m.getCase('negative')), null);
assert.deepEqual(m.inspect(m.getCase('fraction'), 9), {lhs: 11, equation:true, allowed:false});
assert.deepEqual(m.inspect(m.getCase('negative'), -2), {lhs: 1, equation:true, allowed:false});
assert.equal(m.inspect(m.getCase('negative'), 99), null);
assert.equal(m.getCase('missing'), null);
console.log('equation context validity: exact substitution and constraints pass');
