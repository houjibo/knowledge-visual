const test = require('node:test');
const assert = require('node:assert/strict');
const Model = require('../simulation-world/assets/cam-factory-model.js');

function near(actual, expected, description, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${description}: ${actual} != ${expected}`);
}

test('all selectable timing conditions match an independent window calculation', () => {
  let checked = 0;
  for (const rpm of Model.speeds) for (const dwellDegrees of Model.dwellAngles) {
    for (const feedSeconds of Model.feedTimes) {
      const result = Model.calculate({rpm, dwellDegrees, feedSeconds});
      const expectedDwell = dwellDegrees / (rpm * 6); // rpm × 6 is degrees per second.
      near(result.cycleSeconds, 360 / (rpm * 6), 'cycle duration');
      near(result.dwellSeconds, expectedDwell, 'dwell duration');
      assert.equal(result.windowEnough, expectedDwell + 1e-10 >= feedSeconds);
      assert.equal(result.lowDwellDegrees + dwellDegrees, 180);
      checked++;
    }
  }
  assert.equal(checked, 64);
  near(Model.calculate(Model.defaults).dwellSeconds, 0.5, 'default window');
  near(Model.calculate({...Model.defaults, rpm: 60}).dwellSeconds, 0.25, 'faster window');
  near(Model.calculate({...Model.defaults, rpm: 60, dwellDegrees: 150}).dwellSeconds, 5 / 12, 'longer dwell');
});

test('four motion phases meet at continuous boundaries', () => {
  for (const dwellDegrees of Model.dwellAngles) {
    const c = {...Model.defaults, dwellDegrees};
    const landmarks = [[0, 'rise', 0], [90, 'high-dwell', 1],
      [90 + dwellDegrees, 'fall', 1], [180 + dwellDegrees, 'low-dwell', 0],
      [360, 'rise', 0]];
    for (const [angle, phase, height] of landmarks) {
      const state = Model.at(c, angle);
      assert.equal(state.phase, phase);
      near(state.height, height, `height at ${angle}°`);
      near(Model.at(c, angle - (angle > 0 ? 1e-4 : 0)).height, height,
        `left continuity at ${angle}°`, 1e-6);
    }
    near(Model.at(c, 45).height, 0.5, 'mid rise');
    near(Model.at(c, 135 + dwellDegrees).height, 0.5, 'mid fall');
  }
});

test('six complete cycles conserve a finite batch and insufficient windows complete none', () => {
  const enough = Model.defaults;
  const short = {...Model.defaults, rpm: 60};
  for (let cycles = 0; cycles <= 6; cycles++) {
    const angle = cycles * 360;
    const good = Model.at(enough, angle);
    const bad = Model.at(short, angle);
    assert.equal(good.attemptedCycles, cycles);
    assert.equal(good.completedCount, cycles);
    assert.equal(good.remainingCount, 6 - cycles);
    assert.equal(bad.attemptedCycles, cycles);
    assert.equal(bad.completedCount, 0);
    assert.equal(bad.remainingCount, 6);
    if (cycles < 6) assert.equal(Model.at(enough, angle + 359.9).completedCount, cycles);
  }
  assert.equal(Model.at(enough, 2160).finished, true);
  assert.equal(Model.at(short, 2160).finished, true);
});

test('unsupported conditions and out-of-range phases fail without modifying input', () => {
  const config = {...Model.defaults};
  Model.at(config, 45);
  assert.deepEqual(config, Model.defaults);
  for (const invalid of [null, {}, {...config, rpm: 25}, {...config, dwellDegrees: 180},
    {...config, feedSeconds: 0}, {...config, rpm: NaN}, {...config, feedSeconds: '0.4'}]) {
    assert.throws(() => Model.calculate(invalid));
  }
  for (const angle of [-1, 2160.1, Infinity, NaN, '45']) {
    assert.throws(() => Model.at(config, angle));
  }
});
