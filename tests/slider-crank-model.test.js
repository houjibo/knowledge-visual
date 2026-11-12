'use strict';

const assert = require('node:assert/strict');
const {test} = require('node:test');
const {readFileSync} = require('node:fs');
const {resolve} = require('node:path');
const vm = require('node:vm');
const Model = require('../simulation-world/assets/slider-crank-model.js');

function close(actual, expected, message = '') {
  assert.ok(Number.isFinite(actual), `${message}: finite value required, got ${actual}`);
  assert.ok(Math.abs(actual - expected) <= 1e-8, `${message}: ${actual} != ${expected}`);
}

test('defaults and parameter validation preserve caller data and require explicit geometry', () => {
  assert.deepEqual(Model.defaults, {radius: 40, rodLength: 140, rpm: 30, angle: 0});
  const input = Object.freeze({radius: 60, rodLength: 100, angle: 123.456});
  const validated = Model.validateParameters(input);
  assert.deepEqual(validated, {radius: 60, rodLength: 100, angle: 123.456, rpm: 30});
  assert.notStrictEqual(validated, input);
  Model.position(input);
  assert.deepEqual(input, {radius: 60, rodLength: 100, angle: 123.456});
  assert.deepEqual(Model.defaults, {radius: 40, rodLength: 140, rpm: 30, angle: 0});
});

test('closed-form landmarks distinguish exact slider motion from a sinusoidal approximation', () => {
  const landmarks = [
    [0, 160, 60, 0, 0],
    [90, 80, 0, 60, 80],
    [180, 40, -60, 0, 120],
    [270, 80, 0, -60, 80],
    [360, 160, 60, 0, 0],
  ];
  for (const [angle, x, crankX, crankY, displacement] of landmarks) {
    const result = Model.position({radius: 60, rodLength: 100, angle});
    for (const [key, expected] of Object.entries({x, y: 0, crankX, crankY, displacement, stroke: 120, travel: 240})) {
      close(result[key], expected, `${angle}° ${key}`);
    }
  }
  const small = Model.position({radius: 20, rodLength: 100, angle: 90});
  close(small.x, 40 * Math.sqrt(6));
  close(small.displacement, 120 - 40 * Math.sqrt(6));
  assert.notEqual(Model.position({radius: 60, rodLength: 100, angle: 90}).displacement, 60);
});

test('all 30 size pairs satisfy independent rigid-link constraints throughout a revolution', () => {
  let combinations = 0, positions = 0;
  for (let radius = 20; radius <= 60; radius += 10) {
    for (let rodLength = 100; rodLength <= 200; rodLength += 20) {
      let previousDisplacement = -1;
      for (let angle = 0; angle <= 360; angle++) {
        const point = Model.position({radius, rodLength, angle});
        const label = `r=${radius} l=${rodLength} θ=${angle}`;
        // These are geometric constraints, not a second copy of the production square-root formula.
        close(Math.hypot(point.crankX, point.crankY), radius, `${label} crank length`);
        close(Math.hypot(point.x - point.crankX, point.y - point.crankY), rodLength, `${label} rod length`);
        close(point.y, 0, `${label} guide rail`);
        assert.ok(point.x >= point.crankX, `${label} forward assembly branch`);
        assert.ok(point.x >= rodLength - radius - 1e-8 && point.x <= rodLength + radius + 1e-8, `${label} slider bounds`);
        assert.ok(point.displacement >= -1e-8 && point.displacement <= 2 * radius + 1e-8, `${label} displacement bounds`);
        close(point.x + point.displacement, radius + rodLength, `${label} outer-dead-centre reference`);
        close(point.stroke, 2 * radius, `${label} one-way stroke`);
        close(point.travel, 4 * radius, `${label} complete out-and-back travel`);
        close(point.x, Model.position({radius, rodLength, angle: 360 - angle}).x, `${label} reflection symmetry`);
        if (angle <= 180) assert.ok(point.displacement >= previousDisplacement - 1e-8, `${label} monotonic outgoing stroke`);
        previousDisplacement = point.displacement;
        positions++;
      }
      combinations++;
    }
  }
  assert.equal(combinations, 30);
  assert.equal(positions, 10830);
});

test('rod length changes intermediate position while radius alone sets stroke and cycle travel', () => {
  for (const radius of [20, 40, 60]) {
    const short = Model.position({radius, rodLength: 100, angle: 90, rpm: 10});
    const long = Model.position({radius, rodLength: 200, angle: 90, rpm: 60});
    assert.ok(short.displacement > long.displacement);
    assert.equal(short.stroke, long.stroke);
    assert.equal(short.travel, long.travel);
    assert.deepEqual(short, Model.position({radius, rodLength: 100, angle: 90, rpm: 60}));
  }
});

test('elapsed seconds determine phase with wraparound and composable time slices', () => {
  close(Model.advanceAngle(0, 10, 1), 60);
  close(Model.advanceAngle(0, 60, 0.25), 90);
  close(Model.advanceAngle(350, 10, 0.25), 5);
  close(Model.advanceAngle(360, 30, 0), 0);
  close(Model.advanceAngle(45, 30, 0.5), 135);
  close(Model.advanceAngle(0, 10, 10), 240);
  for (const rpm of [10, 20, 30, 40, 50, 60]) {
    for (const angle of [0, 0.125, 90, 350, 360]) {
      const whole = Model.advanceAngle(angle, rpm, 12.75);
      const split = Model.advanceAngle(Model.advanceAngle(angle, rpm, 0.125), rpm, 12.625);
      close(split, whole, `${rpm}rpm phase composition`);
      assert.ok(whole >= 0 && whole < 360);
    }
  }
});

test('invalid dimensions, steps, phase, speed and elapsed time fail without silent correction', () => {
  for (const value of [undefined, null, [], 'parameters', 42, {}, {radius: 40}, {radius: 40, rodLength: 140}]) {
    assert.throws(() => Model.validateParameters(value));
    assert.throws(() => Model.position(value));
  }
  const invalid = {
    radius: [undefined, null, '40', NaN, Infinity, -Infinity, 10, 70, 25, 40.5],
    rodLength: [undefined, null, '140', NaN, Infinity, 80, 220, 110, 140.5],
    angle: [undefined, null, '90', NaN, Infinity, -Infinity, -1, 360.1],
    rpm: [null, '30', NaN, Infinity, 0, 70, 15, 30.5],
  };
  for (const [field, values] of Object.entries(invalid)) {
    for (const value of values) {
      const parameters = {...Model.defaults, [field]: value};
      assert.throws(() => Model.validateParameters(parameters), `${field}=${value}`);
      assert.throws(() => Model.position(parameters), `${field}=${value}`);
    }
  }
  for (const angle of [undefined, null, '0', NaN, Infinity, -1, 361]) assert.throws(() => Model.advanceAngle(angle, 30, 1));
  for (const rpm of [undefined, null, '30', NaN, Infinity, 0, 70, 15]) assert.throws(() => Model.advanceAngle(0, rpm, 1));
  for (const seconds of [undefined, null, '1', NaN, Infinity, -1]) assert.throws(() => Model.advanceAngle(0, 30, seconds));
});

test('browser global export works without CommonJS or runtime dependencies', () => {
  const context = {};
  context.window = context;
  vm.runInNewContext(readFileSync(resolve(__dirname, '../simulation-world/assets/slider-crank-model.js'), 'utf8'), context);
  assert.equal(typeof context.SliderCrankModel.position, 'function');
  close(context.SliderCrankModel.position({radius: 60, rodLength: 100, angle: 90}).displacement, 80);
  close(context.SliderCrankModel.advanceAngle(350, 10, 0.25), 5);
});
