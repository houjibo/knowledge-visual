const assert = require('node:assert/strict');
const Model = require('../computer/middle/assets/iot-autonomous-control-model.js');

const task = Model.getTask();
assert.equal(task.id, 'fictional-campus-iot-security');
assert.match(task.boundary, /不连接真实设备|不发送网络请求/);

// Step 1: supply chain trust
const sources = Model.getSupplySources();
assert.equal(sources.length, 4);
const sourceIds = sources.map(item => item.id).sort();
assert.deepEqual(sourceIds, ['official-store', 'signed-update', 'tampered-firmware', 'unknown-drive']);
const trustedIds = sources.filter(item => item.trustworthy).map(item => item.id).sort();
assert.deepEqual(trustedIds, ['official-store', 'signed-update']);

const correctTrust = Object.fromEntries(sources.map(item => [item.id, item.trustworthy ? 'trusted' : 'untrusted']));
const trustOk = Model.judgeSupplyChain(correctTrust);
assert.equal(trustOk.correct, true);
assert.deepEqual(trustOk.mismatches, []);

const trustWrong = Model.judgeSupplyChain({...correctTrust, 'tampered-firmware': 'trusted'});
assert.equal(trustWrong.correct, false);
assert.deepEqual(trustWrong.mismatches, [{sourceId: 'tampered-firmware', expected: 'untrusted', actual: 'trusted'}]);
assert.throws(() => Model.judgeSupplyChain({...correctTrust, extra: 'trusted'}), RangeError);
assert.throws(() => Model.judgeSupplyChain({officialStore: 'trusted'}), RangeError);
assert.throws(() => Model.judgeSupplyChain({...correctTrust, 'signed-update': 'maybe'}), RangeError);

// Step 2: update / maintenance
const maintenance = Model.getMaintenanceCases();
assert.equal(maintenance.length, 3);
const maintenanceIds = maintenance.map(item => item.id).sort();
assert.deepEqual(maintenanceIds, ['eol-device', 'ignore-updates', 'timely-patch']);
const correctMaintenance = Object.fromEntries(maintenance.map(item => [item.id, item.safe]));
const maintOk = Model.judgeMaintenance(correctMaintenance);
assert.equal(maintOk.correct, true);
assert.deepEqual(maintOk.mismatches, []);

const eolWrong = Model.judgeMaintenance({...correctMaintenance, 'eol-device': true});
assert.equal(eolWrong.correct, false);
assert.deepEqual(eolWrong.mismatches.map(item => item.caseId), ['eol-device']);
assert.throws(() => Model.judgeMaintenance({timelyPatch: 'safe'}), RangeError);
assert.throws(() => Model.judgeMaintenance({...correctMaintenance, 'ignore-updates': 'x'}), RangeError);

// Step 3: autonomous control by engineering attributes
const practices = Model.getControlPractices();
const practiceIds = practices.map(item => item.id);
assert.ok(practiceIds.includes('data-self-hosting'));
assert.ok(practiceIds.includes('open-standards'));
assert.ok(practiceIds.includes('brand-nationality-shortcut'));
const correctPractices = practices.filter(item => item.enhancesControl).map(item => item.id).sort();
const controlOk = Model.judgeControl(correctPractices);
assert.equal(controlOk.correct, true);
assert.deepEqual(controlOk.mismatches, []);

const brandShortcut = Model.judgeControl([...correctPractices, 'brand-nationality-shortcut']);
assert.equal(brandShortcut.correct, false);
assert.deepEqual(brandShortcut.mismatches.map(item => item.practiceId), ['brand-nationality-shortcut']);
const missingOne = Model.judgeControl(correctPractices.filter(id => id !== 'data-self-hosting'));
assert.equal(missingOne.correct, false);
assert.deepEqual(missingOne.mismatches.map(item => item.practiceId), ['data-self-hosting']);
assert.throws(() => Model.judgeControl(['data-self-hosting', 'made-up-id']), RangeError);
assert.throws(() => Model.judgeControl('data-self-hosting'), TypeError);

const snapshot = Model.getLocalSnapshot();
assert.equal(snapshot.networkRequests, 0);
assert.equal(snapshot.connectedToRealDevice, false);

assert.equal(Object.isFrozen(sources), true);
assert.equal(Object.isFrozen(sources[0]), true);
assert.equal(Object.isFrozen(maintenance), true);
assert.equal(Object.isFrozen(practices), true);
assert.equal(Object.isFrozen(trustOk.mismatches), true);
assert.equal(Object.isFrozen(snapshot), true);

console.log('IoT autonomous control model: supply chain, maintenance and control judgments passed');
