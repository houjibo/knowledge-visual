const assert = require('node:assert/strict');
const Model = require('../ai/middle/assets/ai-application-recognition-model.js');

const task = Model.getTask();
assert.equal(task.id, 'fictional-everyday-ai-apps');
assert.match(task.boundary, /不连接真实服务|不发送网络请求/);

// Step 1: AI application vs fixed automation
const apps = Model.getApplications();
assert.ok(apps.length >= 6);
const aiCount = apps.filter(a => a.kind === 'ai').length;
const autoCount = apps.filter(a => a.kind === 'automation').length;
assert.ok(aiCount >= 3 && autoCount >= 2);
const correctKind = Object.fromEntries(apps.map(a => [a.id, a.kind]));
const kindOk = Model.classifyApplications(correctKind);
assert.equal(kindOk.correct, true);
assert.deepEqual(kindOk.mismatches, []);

const door = apps.find(a => a.id === 'auto-door');
assert.equal(door.kind, 'automation');
const kindWrong = Model.classifyApplications({...correctKind, 'auto-door': 'ai'});
assert.equal(kindWrong.correct, false);
assert.deepEqual(kindWrong.mismatches, [{appId: 'auto-door', expected: 'automation', actual: 'ai'}]);
assert.throws(() => Model.classifyApplications({...correctKind, extra: 'ai'}), RangeError);
assert.throws(() => Model.classifyApplications({[apps[0].id]: correctKind[apps[0].id]}), RangeError);
assert.throws(() => Model.classifyApplications({...correctKind, [apps[0].id]: 'maybe'}), RangeError);

// Step 2: impact domains (learning / life / work), multi-select with fixed answer
const aiApps = apps.filter(a => a.kind === 'ai');
for (const app of aiApps) assert.ok(Array.isArray(app.impacts) && app.impacts.length >= 1);
const correctImpacts = Object.fromEntries(aiApps.map(a => [a.id, a.impacts]));
const impactOk = Model.judgeImpacts(correctImpacts);
assert.equal(impactOk.correct, true);
assert.deepEqual(impactOk.mismatches, []);

const first = aiApps[0];
const missingOne = Model.judgeImpacts({...correctImpacts, [first.id]: first.impacts.slice(0, first.impacts.length - 1)});
assert.equal(missingOne.correct, false);
assert.deepEqual(missingOne.mismatches.map(m => m.appId), [first.id]);
const extraDomain = Model.judgeImpacts({...correctImpacts, [first.id]: [...first.impacts, 'work']});
assert.equal(extraDomain.correct, false);
assert.throws(() => Model.judgeImpacts({[first.id]: first.impacts}), RangeError);
assert.throws(() => Model.judgeImpacts({...correctImpacts, [first.id]: ['bogus']}), RangeError);

// Step 3: capability boundary
const boundaries = Model.getCapabilityCases();
assert.ok(boundaries.length >= 4);
const correctBoundary = Object.fromEntries(boundaries.map(c => [c.id, c.needsHumanReview ? 'human-review' : 'ai-reliable']));
const boundaryOk = Model.judgeBoundary(correctBoundary);
assert.equal(boundaryOk.correct, true);
assert.deepEqual(boundaryOk.mismatches, []);
assert.ok(boundaries.some(c => c.needsHumanReview));
assert.ok(boundaries.some(c => !c.needsHumanReview));

const reviewCase = boundaries.find(c => c.needsHumanReview);
const boundaryWrong = Model.judgeBoundary({...correctBoundary, [reviewCase.id]: 'ai-reliable'});
assert.equal(boundaryWrong.correct, false);
assert.deepEqual(boundaryWrong.mismatches, [{caseId: reviewCase.id, expected: 'human-review', actual: 'ai-reliable'}]);
assert.throws(() => Model.judgeBoundary({[boundaries[0].id]: correctBoundary[boundaries[0].id]}), RangeError);
assert.throws(() => Model.judgeBoundary({...correctBoundary, [boundaries[0].id]: 'x'}), RangeError);

const snapshot = Model.getLocalSnapshot();
assert.equal(snapshot.networkRequests, 0);
assert.equal(snapshot.connectedToRealService, false);

assert.equal(Object.isFrozen(apps), true);
assert.equal(Object.isFrozen(apps[0]), true);
assert.equal(Object.isFrozen(boundaries), true);
assert.equal(Object.isFrozen(kindOk.mismatches), true);
assert.equal(Object.isFrozen(snapshot), true);

console.log('AI application recognition model: classification, impacts and boundary passed');
