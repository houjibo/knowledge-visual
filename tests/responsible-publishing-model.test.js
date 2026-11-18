const assert = require('node:assert/strict');
const Model = require('../computer/high/assets/responsible-publishing-model.js');

const task = Model.getTask();
assert.equal(task.id, 'fictional-water-saving-release');
assert.match(task.title, /节水/);
assert.match(task.boundary, /不连接真实平台|不发送网络请求/);

const platforms = Model.getPlatforms();
assert.equal(platforms.length, 3);
const ids = platforms.map(item => item.id);
assert.deepEqual(ids, ['personal-public', 'class-space', 'school-platform']);
for (const platform of platforms) {
  assert.equal(typeof platform.audience, 'string');
  assert.equal(typeof platform.retractable, 'string');
}

assert.deepEqual(Model.choosePlatform('school-platform'), {
  correct: true, reason: 'audience-and-retraction-match'
});
assert.equal(Model.choosePlatform('personal-public').correct, false);
assert.equal(Model.choosePlatform('personal-public').reason, 'over-public-uncontrolled-spread');
assert.equal(Model.choosePlatform('class-space').correct, false);
assert.equal(Model.choosePlatform('class-space').reason, 'audience-too-narrow');
assert.throws(() => Model.choosePlatform('unknown'), RangeError);

const draft = Model.getDraft();
assert.equal(draft.conclusionHasSource, false);
assert.equal(draft.containsRealName, true);
assert.equal(draft.imageAuthorized, false);
assert.equal(draft.permissionOnSchoolPlatform, true);

const correctChecks = {source: false, privacy: false, authorization: false, permission: true};
const passResult = Model.checkPrepublish(correctChecks);
assert.equal(passResult.correct, true);
assert.equal(passResult.canPublish, false);
assert.deepEqual(passResult.mismatches, []);
assert.equal(passResult.reason, 'blockers-identified-draft-withheld');

const missPrivacy = Model.checkPrepublish({source: false, privacy: true, authorization: false, permission: true});
assert.equal(missPrivacy.correct, false);
assert.equal(missPrivacy.canPublish, false);
assert.deepEqual(missPrivacy.mismatches, [{field: 'privacy', expected: false, actual: true}]);

const trustAll = Model.checkPrepublish({source: true, privacy: true, authorization: true, permission: true});
assert.equal(trustAll.correct, false);
assert.deepEqual(trustAll.mismatches.map(item => item.field).sort(),
  ['authorization', 'privacy', 'source']);
assert.throws(() => Model.checkPrepublish({source: 'no', privacy: false, authorization: false, permission: true}), TypeError);
assert.throws(() => Model.checkPrepublish({source: false, privacy: false, authorization: false}), RangeError);
assert.throws(() => Model.checkPrepublish({...correctChecks, extra: true}), RangeError);

assert.deepEqual(Model.checkWithdrawal('retract-original-copies-persist'), {
  correct: true, reason: 'original-retractable-forwarded-copies-persist'
});
assert.equal(Model.checkWithdrawal('recall-everywhere').correct, false);
assert.equal(Model.checkWithdrawal('recall-everywhere').reason, 'forwarded-copies-not-controllable');
assert.equal(Model.checkWithdrawal('no-effect').correct, false);
assert.equal(Model.checkWithdrawal('no-effect').reason, 'original-can-still-be-retracted');
assert.throws(() => Model.checkWithdrawal('delete-all'), RangeError);

const spread = Model.getSpreadState();
assert.equal(spread.originalRetractable, true);
assert.equal(spread.forwardedCopies, 1);
assert.equal(spread.copyRetractableByPublisher, false);
assert.equal(spread.networkRequests, 0);

const snapshot = Model.getLocalSnapshot();
assert.equal(snapshot.published, false);
assert.equal(snapshot.networkRequests, 0);
assert.ok(snapshot.entries.length >= 1);
assert.doesNotMatch(JSON.stringify(snapshot), /真实姓名|李明/);

assert.equal(Object.isFrozen(platforms), true);
assert.equal(Object.isFrozen(platforms[0]), true);
assert.equal(Object.isFrozen(draft), true);
assert.equal(Object.isFrozen(passResult.mismatches), true);
assert.equal(Object.isFrozen(snapshot.entries), true);

console.log('Responsible publishing model: platform choice, pre-publish gate, withdrawal boundary and local snapshot passed');
