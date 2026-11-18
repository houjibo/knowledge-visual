const assert = require('node:assert/strict');
const Model = require('../computer/middle/assets/iot-device-identity-model.js');

const task = Model.getTask();
assert.equal(task.id, 'fictional-connected-devices');
assert.match(task.boundary, /不连接真实设备|不发送网络请求/);

const devices = Model.getDevices();
assert.equal(devices.length, 4);
const deviceIds = devices.map(item => item.id).sort();
assert.deepEqual(deviceIds, ['gateway', 'smart-meter', 'smart-speaker', 'wearable']);
for (const device of devices) {
  assert.equal(typeof device.label, 'string');
  assert.equal(typeof device.identityId, 'string');
}
const identityOptions = Model.getIdentityOptions();
assert.ok(identityOptions.includes('national-id'));
assert.ok(identityOptions.some(value => value !== 'national-id'));

const correctIdentity = Object.fromEntries(devices.map(item => [item.id, item.identityId]));
const identityOk = Model.matchIdentities(correctIdentity);
assert.equal(identityOk.correct, true);
assert.deepEqual(identityOk.mismatches, []);

const nationalIdWrong = Model.matchIdentities({...correctIdentity, wearable: 'national-id'});
assert.equal(nationalIdWrong.correct, false);
assert.deepEqual(nationalIdWrong.mismatches, [{deviceId: 'wearable', expected: correctIdentity.wearable, actual: 'national-id'}]);
assert.throws(() => Model.matchIdentities({...correctIdentity, unknown: 'x'}), RangeError);
assert.throws(() => Model.matchIdentities({gateway: correctIdentity.gateway}), RangeError);
assert.throws(() => Model.matchIdentities({...correctIdentity, gateway: 'made-up-id'}), RangeError);

const dataFlows = Model.getDataFlows();
assert.equal(dataFlows.length, 3);
const correctInference = Object.fromEntries(dataFlows.map(item => [item.id, item.inferable]));
const inferenceOk = Model.judgeInference(correctInference);
assert.equal(inferenceOk.correct, true);
assert.deepEqual(inferenceOk.mismatches, []);

const noPrivacy = Model.judgeInference(Object.fromEntries(dataFlows.map(item => [item.id, 'none'])));
assert.equal(noPrivacy.correct, false);
assert.equal(noPrivacy.mismatches.length, 3);
const oneWrong = Model.judgeInference({...correctInference, 'smart-meter': 'none'});
assert.deepEqual(oneWrong.mismatches.map(item => item.flowId), ['smart-meter']);
assert.throws(() => Model.judgeInference({[dataFlows[0].id]: correctInference[dataFlows[0].id]}), RangeError);
assert.throws(() => Model.judgeInference({...correctInference, wearable: 'bogus'}), RangeError);

const goodProtection = {
  anonymize: 'rotate-random-id',
  minimize: 'collect-required-only'
};
const protectionOk = Model.chooseProtection(goodProtection);
assert.equal(protectionOk.correct, true);
assert.deepEqual(protectionOk.mismatches, []);

const fixedId = Model.chooseProtection({anonymize: 'keep-fixed-id', minimize: 'collect-required-only'});
assert.equal(fixedId.correct, false);
assert.deepEqual(fixedId.mismatches.map(item => item.field), ['anonymize']);
const overCollect = Model.chooseProtection({anonymize: 'rotate-random-id', minimize: 'collect-everything'});
assert.equal(overCollect.correct, false);
assert.deepEqual(overCollect.mismatches.map(item => item.field), ['minimize']);
assert.throws(() => Model.chooseProtection({anonymize: 'rotate-random-id'}), RangeError);
assert.throws(() => Model.chooseProtection({anonymize: 'x', minimize: 'y'}), RangeError);

const snapshot = Model.getLocalSnapshot();
assert.equal(snapshot.networkRequests, 0);
assert.equal(snapshot.connectedToRealDevice, false);

assert.equal(Object.isFrozen(devices), true);
assert.equal(Object.isFrozen(devices[0]), true);
assert.equal(Object.isFrozen(dataFlows), true);
assert.equal(Object.isFrozen(identityOk.mismatches), true);
assert.equal(Object.isFrozen(snapshot), true);

console.log('IoT device identity model: identity matching, inference and privacy protection passed');
