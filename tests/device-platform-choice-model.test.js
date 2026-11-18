const assert = require('node:assert/strict');
const Model = require('../computer/high/assets/device-platform-choice-model.js');

const task = Model.getTask();
assert.equal(task.id, 'fictional-field-geology-study');
assert.match(task.title, /考察|地质/);
assert.match(task.boundary, /不连接真实|不发送网络请求/);

const devices = Model.getDevices();
assert.equal(devices.length, 4);
const deviceIds = devices.map(item => item.id);
assert.deepEqual(deviceIds.sort(), ['desktop-workstation', 'feature-phone', 'lightweight-laptop', 'rugged-tablet']);
for (const device of devices) {
  assert.equal(typeof device.label, 'string');
  assert.equal(typeof device.capabilities.offline, 'boolean');
}

assert.deepEqual(Model.chooseDevice('rugged-tablet'), {
  correct: true, reason: 'offline-camera-portable-fit'
});
assert.equal(Model.chooseDevice('lightweight-laptop').correct, false);
assert.equal(Model.chooseDevice('lightweight-laptop').reason, 'network-dependent-weak-battery');
assert.equal(Model.chooseDevice('desktop-workstation').correct, false);
assert.equal(Model.chooseDevice('desktop-workstation').reason, 'not-portable-needs-power');
assert.equal(Model.chooseDevice('feature-phone').correct, false);
assert.equal(Model.chooseDevice('feature-phone').reason, 'cannot-run-recording-program');
assert.throws(() => Model.chooseDevice('smart-watch'), RangeError);

const platforms = Model.getPlatforms();
assert.equal(platforms.length, 3);
const platformIds = platforms.map(item => item.id).sort();
assert.deepEqual(platformIds, ['cloud-doc', 'offline-notes', 'video-site']);
const videoSite = platforms.find(item => item.id === 'video-site');
assert.equal(videoSite.capabilities.collaborativeEditing, false);

const stages = Model.getStages();
assert.deepEqual(stages.map(item => item.id), ['field', 'camp', 'school']);

const correctMapping = {field: 'offline-notes', camp: 'cloud-doc', school: 'cloud-doc'};
const matchOk = Model.matchPlatforms(correctMapping);
assert.equal(matchOk.correct, true);
assert.deepEqual(matchOk.mismatches, []);
assert.equal(matchOk.reason, 'all-stages-match-conditions');

const fieldOnline = Model.matchPlatforms({field: 'cloud-doc', camp: 'cloud-doc', school: 'cloud-doc'});
assert.equal(fieldOnline.correct, false);
assert.deepEqual(fieldOnline.mismatches, [{stage: 'field', expected: 'offline-notes', actual: 'cloud-doc'}]);

const videoAsTool = Model.matchPlatforms({field: 'offline-notes', camp: 'video-site', school: 'cloud-doc'});
assert.equal(videoAsTool.correct, false);
assert.deepEqual(videoAsTool.mismatches.map(item => item.stage), ['camp']);

assert.throws(() => Model.matchPlatforms({field: 'offline-notes', camp: 'cloud-doc'}), RangeError);
assert.throws(() => Model.matchPlatforms({...correctMapping, school: 'unknown-app'}), RangeError);
assert.throws(() => Model.matchPlatforms({...correctMapping, extra: 'cloud-doc'}), RangeError);
assert.throws(() => Model.matchPlatforms({field: 1, camp: 'cloud-doc', school: 'cloud-doc'}), TypeError);

const platformData = Model.getPlatformData();
assert.ok(Array.isArray(platformData.contributions) && platformData.contributions.length === 3);
const activeIds = platformData.contributions.filter(item => item.active).map(item => item.memberId).sort();
assert.deepEqual(activeIds, ['member-a', 'member-b']);
assert.equal(platformData.syncConflict.recommended, 'keep-both-merge');

const goodDecision = Model.decideCollaboration({
  activeMembers: ['member-b', 'member-a'], conflictAction: 'keep-both-merge'
});
assert.equal(goodDecision.correct, true);
assert.deepEqual(goodDecision.mismatches, []);

const includeInactive = Model.decideCollaboration({
  activeMembers: ['member-a', 'member-b', 'member-c'], conflictAction: 'keep-both-merge'
});
assert.equal(includeInactive.correct, false);
assert.deepEqual(includeInactive.mismatches.map(item => item.field), ['activeMembers']);

const overwrite = Model.decideCollaboration({
  activeMembers: ['member-a', 'member-b'], conflictAction: 'overwrite-with-cloud'
});
assert.equal(overwrite.correct, false);
assert.deepEqual(overwrite.mismatches.map(item => item.field), ['conflictAction']);
assert.equal(overwrite.mismatches[0].reason, 'overwrite-loses-offline-data');

const missingMember = Model.decideCollaboration({
  activeMembers: ['member-a'], conflictAction: 'keep-both-merge'
});
assert.equal(missingMember.correct, false);
assert.throws(() => Model.decideCollaboration({activeMembers: 'member-a', conflictAction: 'keep-both-merge'}), TypeError);
assert.throws(() => Model.decideCollaboration({activeMembers: ['member-a', 'member-b'], conflictAction: 'delete'}), RangeError);

const snapshot = Model.getLocalSnapshot();
assert.equal(snapshot.networkRequests, 0);
assert.equal(snapshot.connectedToRealPlatform, false);

assert.equal(Object.isFrozen(devices), true);
assert.equal(Object.isFrozen(devices[0]), true);
assert.equal(Object.isFrozen(platforms), true);
assert.equal(Object.isFrozen(stages), true);
assert.equal(Object.isFrozen(platformData.contributions), true);
assert.equal(Object.isFrozen(matchOk.mismatches), true);
assert.equal(Object.isFrozen(snapshot), true);

console.log('Device platform choice model: device fit, stage-platform matching, platform data decisions and local snapshot passed');
