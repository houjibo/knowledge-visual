const assert = require('node:assert/strict');
const model = require('../physics/high/assets/electrostatic-model.js');

function close(actual, expected, tolerance, label) {
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `${label}: ${actual} is not within ${tolerance} of ${expected}`);
}

const defaultForce = model.coulombForceMagnitude(5, -3, 0.15);
close(defaultForce, 5.9917011949, 1e-9, 'default Coulomb force in newtons');
close(model.coulombForceMagnitude(5, -3, 0.3), defaultForce / 4, 1e-12, 'inverse-square distance');
assert.equal(model.coulombForceMagnitude(0, -3, 0.15), 0, 'neutral charge has no force');
assert.equal(model.forceType(5, 3), 'repulsive');
assert.equal(model.forceType(5, -3), 'attractive');
assert.equal(model.forceType(0, -3), 'none');
assert.throws(() => model.coulombForceMagnitude(1, 1, 0), RangeError);

const positive = [{x: 0, y: 0, qMicroC: 1}];
assert.ok(model.electricFieldAt(positive, {x: 1, y: 0}).x > 0, 'positive charge field points outward');
assert.ok(model.electricFieldAt([{x: 0, y: 0, qMicroC: -1}], {x: 1, y: 0}).x < 0,
  'negative charge field points inward');
assert.equal(model.electricFieldAt([{x: 0, y: 0, qMicroC: 0}], {x: 1, y: 0}).magnitude, 0);
assert.throws(() => model.electricFieldAt(positive, {x: 0, y: 0}), RangeError);

const oneMicroCAtOneMeter = model.electricPotentialAt(positive, {x: 1, y: 0});
close(oneMicroCAtOneMeter, 8987.5517923, 1e-8, 'point-charge potential in volts');
close(model.electricPotentialAt([{x: 0, y: 0, qMicroC: -1}], {x: 1, y: 0}),
  -oneMicroCAtOneMeter, 1e-8, 'negative point-charge potential');
close(model.electricPotentialAt([
  {x: -1, y: 0, qMicroC: 10},
  {x: 1, y: 0, qMicroC: -10},
], {x: 0, y: 0}), 0, 1e-10, 'dipole midpoint potential');
close(model.electricPotentialAt([{x: 0, y: 0, qMicroC: 1}], {x: 0, y: 0}, 0.1),
  model.COULOMB_CONSTANT * 1e-6 / 0.1, 1e-8, 'visualized source-core softening');
assert.throws(() => model.electricPotentialAt(positive, {x: 0, y: 0}), RangeError);

console.log('Electrostatic model scenarios passed: Coulomb units, direction, zero charge, field and potential superposition');
