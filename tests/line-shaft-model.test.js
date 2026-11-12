const assert = require('node:assert/strict');
const model = require('../simulation-world/assets/line-shaft-model.js');

const oneMachine = model.calculate(model.defaults);
assert.deepEqual([oneMachine.shaftRpm, oneMachine.aRpm, oneMachine.bRpm, oneMachine.bRelation],
  [60, 60, 0, 'stopped']);

const twoMachines = model.calculate({...model.defaults, bEngaged: true});
assert.equal(twoMachines.shaftRpm, oneMachine.shaftRpm);
assert.equal(twoMachines.aRpm, oneMachine.aRpm);
assert.equal(twoMachines.bRpm, 30);
assert.equal(twoMachines.bRelation, 'slower');
assert.equal(twoMachines.bRpm * Math.PI * 40, twoMachines.shaftRpm * Math.PI * 20);

const smallWheel = model.calculate({...model.defaults, bEngaged: true, bDiameter: 10});
assert.equal(smallWheel.bRpm, 120);
assert.equal(smallWheel.bRelation, 'faster');
assert.equal(smallWheel.bRpm * Math.PI * 10, smallWheel.shaftRpm * Math.PI * 20);

const sameWheel = model.calculate({...model.defaults, bEngaged: true, bDiameter: 20, aEngaged: false});
assert.deepEqual([sameWheel.aRpm, sameWheel.bRpm, sameWheel.bRelation], [0, 60, 'same']);

const quarterSecond = model.at({...model.defaults, bEngaged: true}, 0.25);
assert.deepEqual([quarterSecond.shaftAngle, quarterSecond.aAngle, quarterSecond.bAngle], [90, 90, 45]);
assert.equal(model.at(model.defaults, model.maxSeconds).finished, true);
assert.throws(() => model.at(model.defaults, model.maxSeconds + 0.01), RangeError);
assert.throws(() => model.at(model.defaults, NaN), RangeError);
assert.throws(() => model.calculate({...model.defaults, bDiameter: 0}), RangeError);
assert.throws(() => model.calculate({...model.defaults, aEngaged: 'on'}), TypeError);

console.log('Line shaft model tests passed');
