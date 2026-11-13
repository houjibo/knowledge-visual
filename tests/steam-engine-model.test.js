const assert = require('node:assert/strict');
const model = require('../simulation-world/assets/steam-engine-model.js');

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} ≠ ${expected}`);

for (const rpm of model.speeds) {
  near(model.at(0, rpm).pistonX, 165);
  near(model.at(180, rpm).pistonX, 295);
  near(model.at(90, rpm).pistonX, 430 - Math.sqrt(200 ** 2 - 65 ** 2));
  assert.equal(model.at(0, rpm).intake, 'left');
  assert.equal(model.at(179.99, rpm).intake, 'left');
  assert.equal(model.at(180, rpm).intake, 'right');
  assert.equal(model.at(359.99, rpm).intake, 'right');
  near(model.at(360, rpm).pistonX, model.at(0, rpm).pistonX);
  near(model.at(180, rpm).displacement, 130);
  near(model.at(0, rpm).displacement, 0);
  near(model.elapsedSeconds(360, rpm), 60 / rpm);
  near(model.elapsedSeconds(720, rpm), 120 / rpm);
  for (let angle = 0; angle < 360; angle += 15) {
    const state = model.at(angle, rpm);
    near(state.crossheadX - state.pistonX, model.pistonRodLength);
    near(Math.hypot(state.pinX - state.crossheadX, state.pinY - model.crankY), model.rodLength);
    near(Math.hypot(state.pinX - model.crankX, state.pinY - model.crankY), model.radius);
    assert.ok(state.displacement >= -1e-8 && state.displacement <= 130 + 1e-8);
  }
}
assert.equal(model.at(0, 15).periodSeconds, 4);
assert.equal(model.at(0, 30).periodSeconds, 2);
assert.throws(() => model.at(NaN, 15), RangeError);
assert.throws(() => model.at(0, 45), RangeError);
assert.throws(() => model.elapsedSeconds(721, 15), RangeError);
console.log('steam engine model: endpoints, linkage, phase, period and bounds passed');
