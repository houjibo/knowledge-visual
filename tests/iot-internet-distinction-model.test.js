const assert = require('node:assert/strict');
const Model = require('../computer/middle/assets/iot-internet-distinction-model.js');

const task = Model.getTask();
assert.equal(task.id, 'fictional-connection-cases');
assert.match(task.boundary, /不连接真实设备|不发送网络请求/);

const cases = Model.getCases();
assert.equal(cases.length, 6);
const internetIds = cases.filter(item => item.expected === 'internet').map(item => item.id).sort();
const iotIds = cases.filter(item => item.expected === 'iot').map(item => item.id).sort();
assert.deepEqual(internetIds, ['instant-message', 'video-streaming']);
assert.equal(iotIds.length, 4);
for (const item of cases) {
  assert.ok(['internet', 'iot'].includes(item.expected));
  assert.equal(typeof item.reason, 'string');
}

const correctClassification = Object.fromEntries(cases.map(item => [item.id, item.expected]));
const ok = Model.classify(correctClassification);
assert.equal(ok.correct, true);
assert.deepEqual(ok.mismatches, []);

const oneWrong = Model.classify({...correctClassification, 'temp-sensor': 'internet'});
assert.equal(oneWrong.correct, false);
assert.deepEqual(oneWrong.mismatches, [{caseId: 'temp-sensor', expected: 'iot', actual: 'internet'}]);

const allWrong = Model.classify(Object.fromEntries(cases.map(item => [item.id, item.expected === 'iot' ? 'internet' : 'iot'])));
assert.equal(allWrong.correct, false);
assert.equal(allWrong.mismatches.length, 6);
assert.throws(() => Model.classify({...correctClassification, unknown: 'iot'}), RangeError);
assert.throws(() => Model.classify({instant_message: 'internet'}), RangeError);
assert.throws(() => Model.classify({...correctClassification, 'video-streaming': 'web'}), RangeError);
assert.throws(() => Model.classify(Object.fromEntries(cases.slice(0, 3).map(item => [item.id, item.expected]))), RangeError);

const elements = Model.getThreeElements();
assert.equal(elements.sensor.label.length > 0, true);
assert.equal(elements.network.label.length > 0, true);
assert.equal(elements.actuator.label.length > 0, true);
const goodElements = {
  sensor: elements.sensor.id,
  network: elements.network.id,
  actuator: elements.actuator.id
};
const elementOk = Model.identifyElements(goodElements);
assert.equal(elementOk.correct, true);
assert.deepEqual(elementOk.mismatches, []);

const wrongActuator = Model.identifyElements({
  sensor: elements.sensor.id,
  network: elements.network.id,
  actuator: elements.distractors.find(item => item.role === 'app').id
});
assert.equal(wrongActuator.correct, false);
assert.deepEqual(wrongActuator.mismatches.map(item => item.field), ['actuator']);
assert.throws(() => Model.identifyElements({sensor: 'nope', network: elements.network.id, actuator: elements.actuator.id}), RangeError);
assert.throws(() => Model.identifyElements({sensor: elements.sensor.id, network: elements.network.id}), RangeError);

const benefitOptions = Model.getImpactOptions().benefits.map(item => item.id);
const riskOptions = Model.getImpactOptions().risks.map(item => item.id);
assert.ok(benefitOptions.includes('remote-convenience'));
assert.ok(riskOptions.includes('habit-privacy'));
const impactOk = Model.judgeImpact({benefit: 'remote-convenience', risk: 'habit-privacy'});
assert.equal(impactOk.correct, true);

const benefitOnly = Model.judgeImpact({benefit: 'remote-convenience', risk: 'no-risk'});
assert.equal(benefitOnly.correct, false);
assert.deepEqual(benefitOnly.mismatches.map(item => item.field), ['risk']);
const wrongBenefit = Model.judgeImpact({benefit: 'no-difference', risk: 'habit-privacy'});
assert.equal(wrongBenefit.correct, false);
assert.deepEqual(wrongBenefit.mismatches.map(item => item.field), ['benefit']);
assert.throws(() => Model.judgeImpact({benefit: 'x', risk: 'habit-privacy'}), RangeError);
assert.throws(() => Model.judgeImpact({benefit: 'remote-convenience'}), RangeError);

const snapshot = Model.getLocalSnapshot();
assert.equal(snapshot.networkRequests, 0);
assert.equal(snapshot.connectedToRealDevice, false);

assert.equal(Object.isFrozen(cases), true);
assert.equal(Object.isFrozen(cases[0]), true);
assert.equal(Object.isFrozen(ok.mismatches), true);
assert.equal(Object.isFrozen(snapshot), true);

console.log('IoT/Internet distinction model: classification, three elements, two-sided impact and local snapshot passed');
