const assert = require('node:assert/strict');
const Model = require('../computer/high/assets/iot-feedback-control-model.js');

const calm = Model.runComparison({target: 24, scenario: 'calm'});
assert.equal(calm.scheduled.trace.length, 5);
assert.equal(calm.feedback.trace.length, 5);
assert.equal(calm.scheduled.finalTemperature, 26);
assert.equal(calm.feedback.finalTemperature, 23);
assert.equal(calm.scheduled.totalDeviation, 13);
assert.equal(calm.feedback.totalDeviation, 10);
assert.equal(calm.fixedModel, true);

const tied = Model.runComparison({target: 26, scenario: 'calm'});
assert.equal(tied.scheduled.finalTemperature, 26);
assert.equal(tied.feedback.finalTemperature, 26);
assert.equal(tied.scheduled.totalDeviation, tied.feedback.totalDeviation);

const disturbed = Model.runComparison({target: 24, scenario: 'heatPulse'});
assert.equal(disturbed.scheduled.trace[2].disturbance, 5);
assert.equal(disturbed.scheduled.trace[2].action, 'idle');
assert.equal(disturbed.feedback.trace[2].action, 'fan');
assert.equal(disturbed.feedback.totalDeviation < disturbed.scheduled.totalDeviation, true);
assert.equal(disturbed.scheduled.finalTemperature, 31);
assert.equal(disturbed.feedback.finalTemperature, 25);

assert.throws(() => Model.runComparison({target: 19}), RangeError);
assert.throws(() => Model.runComparison({scenario: 'unexpected'}), RangeError);
assert.throws(() => Model.runDeploymentTrial({architecture: 'device'}), RangeError);
assert.throws(() => Model.runDeploymentTrial({temperature: 9}), RangeError);
assert.throws(() => Model.runDeploymentTrial({networkAvailable: 1}), TypeError);

const localOffline = Model.runDeploymentTrial({architecture: 'local', networkAvailable: false, temperature: 32, target: 24});
assert.equal(localOffline.decisionIssued, true);
assert.equal(localOffline.decisionSource, 'local');
assert.equal(localOffline.action, 'fan');
assert.equal(localOffline.after, 29);

const cloudOffline = Model.runDeploymentTrial({architecture: 'cloud', networkAvailable: false, temperature: 32, target: 24});
assert.equal(cloudOffline.decisionIssued, false);
assert.equal(cloudOffline.decisionSource, 'fallback');
assert.equal(cloudOffline.action, 'idle');
assert.equal(cloudOffline.after, 32);

const cloudOnline = Model.runDeploymentTrial({architecture: 'cloud', networkAvailable: true, temperature: 32, target: 24});
assert.equal(cloudOnline.decisionIssued, true);
assert.equal(cloudOnline.decisionSource, 'cloud');
assert.equal(cloudOnline.action, 'fan');

console.log('IoT feedback control model: disturbance response, fixed schedule, bounds and offline paths passed');
