const assert = require('node:assert/strict');
const test = require('node:test');
const Model = require('../computer/middle/assets/iot-sensor-feedback-model.js');

test('two feedback rounds use the first action as the second reading', () => {
  assert.deepEqual(Model.runScenario('dry'), [
    {reading: 25, previousPump: false, delivered: true, command: true, next: 45},
    {reading: 45, previousPump: true, delivered: true, command: false, next: 40},
  ]);
  assert.deepEqual(Model.runScenario('wet'), [
    {reading: 55, previousPump: false, delivered: true, command: false, next: 50},
  ]);
});

test('lost reading retains the previous command, unlike a delivered reading', () => {
  assert.deepEqual(Model.runScenario('lost'), [
    {reading: 45, previousPump: true, delivered: false, command: true, next: 65},
  ]);
  assert.deepEqual(Model.computeRound(45, true, true),
    {reading: 45, previousPump: true, delivered: true, command: false, next: 40});
});

test('threshold, bounds and invalid states are explicit', () => {
  assert.equal(Model.computeRound(39, false, true).command, true);
  assert.equal(Model.computeRound(40, true, true).command, false);
  assert.equal(Model.computeRound(99, false, true).next, 94);
  assert.equal(Model.computeRound(100, true, false).next, 100);
  assert.equal(Model.computeRound(0, false, false).next, 0);
  assert.throws(() => Model.computeRound(-1, false, true));
  assert.throws(() => Model.computeRound(10.5, false, true));
  assert.throws(() => Model.computeRound(50, 'on', true));
  assert.throws(() => Model.runScenario('unknown'));
});
