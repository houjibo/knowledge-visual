const assert = require('node:assert/strict');
const model = require('../chemistry/high/assets/reaction-equilibrium-model.js');

const close = (actual, expected, tolerance = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≠ ${expected}`);

for (const mode of ['forward', 'reverse', 'both']) {
  const start = model.simpleState(mode, 0);
  close(start.a + start.b, 1);
  close(start.a, {forward: 1, reverse: 0, both: 0.5}[mode]);
  for (const time of [0.01, 0.1, 1, 3, 8, 20]) {
    const state = model.simpleState(mode, time);
    const next = model.simpleState(mode, time + 0.00001);
    close(state.a + state.b, 1);
    close(state.forwardRate, model.K_FORWARD * state.a);
    close(state.reverseRate, model.K_REVERSE * state.b);
    close(-(next.a - state.a) / 0.00001,
      state.forwardRate - state.reverseRate, 0.000002);
  }
  const end = model.simpleState(mode, 20);
  close(end.b / end.a, model.K_FORWARD / model.K_REVERSE, 0.00001);
  close(end.forwardRate, end.reverseRate, 0.000001);
}
close(model.simpleState('reverse', 0).forwardRate, 0);
assert.ok(model.simpleState('reverse', 0).reverseRate > 0);
assert.throws(() => model.simpleState('forward', -1), RangeError);

const initial = model.initialAmmoniaState();
close(initial.postRatio, 1);
close(model.ammoniaQuotient(initial, 1), model.AMMONIA_BASE_K);
const signs = {
  tempUp: -1, tempDown: 1, pressUp: 1,
  pressDown: -1, addN2: 1, addNH3: -1
};
for (const [action, sign] of Object.entries(signs)) {
  const result = model.perturbAmmonia(initial, action);
  assert.equal(Math.sign(result.extent), sign, action);
  assert.equal(Math.sign(result.preRatio - 1), -sign, action);
  close(result.postRatio, 1, 1e-11);
}

function inventories(state) {
  return {nitrogen: 2 * state.n2 + state.nh3, hydrogen: 2 * state.h2 + 3 * state.nh3};
}

let state = initial;
const sequence = ['addN2', 'addNH3', 'pressUp', 'tempUp', 'pressDown', 'tempDown'];
for (let i = 0; i < 120; i++) {
  const action = sequence[i % sequence.length];
  const before = inventories(state);
  const after = model.perturbAmmonia(state, action);
  assert.ok(after.n2 >= 0 && after.h2 >= 0 && after.nh3 >= 0, action);
  close(after.postRatio, 1, 1e-10);
  const addedN = action === 'addN2' ? 10 : action === 'addNH3' ? 6 : 0;
  const addedH = action === 'addNH3' ? 18 : 0;
  close(inventories(after).nitrogen, before.nitrogen + addedN, 1e-8);
  close(inventories(after).hydrogen, before.hydrogen + addedH, 1e-8);
  state = after;
}
assert.throws(() => model.perturbAmmonia(initial, 'unknown'), RangeError);
assert.throws(() => model.ammoniaQuotient({n2: -1, h2: 3, nh3: 2}, 1), RangeError);
console.log('reaction equilibrium model: three initial states, rates, six disturbances and 120 conserved steps passed');
