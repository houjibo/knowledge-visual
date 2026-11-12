const test = require('node:test');
const assert = require('node:assert/strict');
const Model = require('../simulation-world/assets/belt-pulley-model.js');

function near(actual, expected, message, tolerance = 1e-8) {
  assert.ok(Math.abs(actual - expected) < tolerance, `${message}: ${actual} differs from ${expected}`);
}

function orientation(a, b, c) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

test('all selectable configurations conserve belt travel and give the expected direction', () => {
  let checked = 0;
  for (const driverDiameter of Model.diameters) for (const drivenDiameter of Model.diameters) {
    for (const inputRpm of Model.speeds) for (const layout of ['open', 'crossed']) {
      const config = {driverDiameter, drivenDiameter, inputRpm, layout, slipObserved: false};
      const result = Model.calculate(config);
      // In one minute the input wheel travels inputRpm circumferences along the belt.
      const travelMm = inputRpm * Math.PI * driverDiameter;
      const independentOutputTurns = travelMm / (Math.PI * drivenDiameter);
      near(result.idealOutputRpm, independentOutputTurns, 'output rpm');
      near(result.beltSpeedMps, travelMm / 1000 / 60, 'belt speed');
      near(result.signedOutputDegreesPerDriverTurn,
        360 * independentOutputTurns / inputRpm * (layout === 'open' ? 1 : -1), 'turn step');
      assert.equal(result.direction, layout === 'open' ? 'same' : 'opposite');
      assert.equal(result.speedTrend, driverDiameter > drivenDiameter ? 'faster' :
        driverDiameter < drivenDiameter ? 'slower' : 'same');
      assert.equal(result.actualOutputRpm, result.idealOutputRpm);
      checked++;
    }
  }
  assert.equal(checked, 720);
});

test('geometry endpoints lie on both rims and each straight span is tangent', () => {
  for (const driverDiameter of Model.diameters) for (const drivenDiameter of Model.diameters) {
    for (const layout of ['open', 'crossed']) {
      const g = Model.geometry({...Model.defaults, driverDiameter, drivenDiameter, layout});
      for (const [driverPoint, drivenPoint] of [g.first, g.second]) {
        const span = {x: drivenPoint.x - driverPoint.x, y: drivenPoint.y - driverPoint.y};
        const driverRadial = {x: driverPoint.x - g.centers.driver.x,
          y: driverPoint.y - g.centers.driver.y};
        const drivenRadial = {x: drivenPoint.x - g.centers.driven.x,
          y: drivenPoint.y - g.centers.driven.y};
        near(Math.hypot(driverRadial.x, driverRadial.y), g.r1, 'driver rim');
        near(Math.hypot(drivenRadial.x, drivenRadial.y), g.r2, 'driven rim');
        near(span.x * driverRadial.x + span.y * driverRadial.y, 0, 'driver tangent');
        near(span.x * drivenRadial.x + span.y * drivenRadial.y, 0, 'driven tangent');
      }
      const [a, b] = g.first, [c, d] = g.second;
      const spansCross = orientation(a, b, c) * orientation(a, b, d) < 0 &&
        orientation(c, d, a) * orientation(c, d, b) < 0;
      assert.equal(spansCross, layout === 'crossed');
      assert.match(g.path, /^M .* L .* A .* L .* A /);
    }
  }
});

test('slip removes actual values without fabricating a measured loss rate', () => {
  const ideal = Model.calculate(Model.defaults);
  assert.equal(ideal.idealOutputRpm, 30);
  assert.equal(ideal.direction, 'same');
  assert.equal(ideal.signedOutputDegreesPerDriverTurn, 180);
  const slip = Model.calculate({...Model.defaults, slipObserved: true});
  assert.equal(slip.idealOutputRpm, 30);
  assert.equal(slip.actualOutputRpm, null);
  assert.equal(slip.actualDirection, null);
});

test('invalid or incomplete conditions fail without mutating the caller', () => {
  const defaults = {...Model.defaults};
  Model.calculate(defaults); Model.geometry(defaults);
  assert.deepEqual(defaults, Model.defaults);
  for (const invalid of [null, {}, {...defaults, driverDiameter: NaN},
    {...defaults, driverDiameter: 70}, {...defaults, drivenDiameter: 0},
    {...defaults, inputRpm: Infinity}, {...defaults, inputRpm: 0},
    {...defaults, layout: 'twisted'}, {...defaults, slipObserved: 'false'}]) {
    assert.throws(() => Model.calculate(invalid));
    assert.throws(() => Model.geometry(invalid));
  }
});
