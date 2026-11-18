const assert = require('node:assert/strict');
const model = require('../math/middle/assets/three-var-linear-system-model.js');

assert.match(model.task.boundary, /选学|不连接外部服务/);
assert.equal(model.cases.length, 3);

// Every case has a consistent integer reference solution.
for (const c of model.cases) {
  assert.ok(Number.isInteger(c.solution.x) && Number.isInteger(c.solution.y) && Number.isInteger(c.solution.z));
  for (const eq of c.equations) {
    const lhs = eq.a * c.solution.x + eq.b * c.solution.y + eq.c * c.solution.z;
    assert.equal(lhs, eq.rhs, `case ${c.id} equation ${eq.id} not satisfied by reference solution`);
  }
  assert.ok(Array.isArray(c.steps) && c.steps.length >= 3);
}

const first = model.cases[0];

// Correct reference solution
const ok = model.checkSolution(first.id, {...first.solution});
assert.equal(ok.status, 'correct');

// One wrong unknown
const wrongX = model.checkSolution(first.id, {...first.solution, x: first.solution.x + 1});
assert.equal(wrongX.status, 'wrong');
assert.ok(wrongX.feedback.length > 0);

const wrongZ = model.checkSolution(first.id, {...first.solution, z: first.solution.z - 2});
assert.equal(wrongZ.status, 'wrong');

// All wrong
const allWrong = model.checkSolution(first.id, {x: 0, y: 0, z: 0});
assert.equal(allWrong.status, 'wrong');

// Invalid inputs
assert.equal(model.checkSolution(first.id, null).status, 'invalid');
assert.equal(model.checkSolution(first.id, {x: '1', y: 2, z: 3}).status, 'invalid');
assert.equal(model.checkSolution(first.id, {x: NaN, y: 2, z: 3}).status, 'invalid');
assert.equal(model.checkSolution(first.id, {x: Infinity, y: 2, z: 3}).status, 'invalid');
assert.equal(model.checkSolution(first.id, {x: '<script>', y: 2, z: 3}).status, 'invalid');
assert.equal(model.checkSolution(first.id, {x: 1.5, y: 2, z: 3}).status, 'invalid');
assert.throws(() => model.checkSolution('no-such-case', {x: 1, y: 2, z: 3}), /case/i);

// Frozen
assert.equal(Object.isFrozen(model.cases), true);
assert.equal(Object.isFrozen(model.cases[0].solution), true);
assert.equal(Object.isFrozen(ok), true);

console.log('Three-var linear system model: elimination cases and checks passed');
