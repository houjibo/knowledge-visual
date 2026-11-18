const assert = require('node:assert/strict');
const Model = require('../ai/middle/assets/smart-society-system-model.js');

const task = Model.getTask();
assert.equal(task.id, 'fictional-smart-city');
assert.match(task.boundary, /不连接真实平台|不发送网络请求/);

// Step 1: six system elements
const elements = Model.getSystemElements();
assert.equal(elements.length, 6);
const elementIds = elements.map(item => item.id).sort();
assert.deepEqual(elementIds, ['application', 'data-platform', 'decision', 'network', 'people-rule', 'sensing'].sort());
const correctMapping = Object.fromEntries(elements.map(item => [item.id, item.componentId]));
const mapOk = Model.matchElements(correctMapping);
assert.equal(mapOk.correct, true);
assert.deepEqual(mapOk.mismatches, []);

const mapWrong = Model.matchElements({...correctMapping, sensing: 'travel-app'});
assert.equal(mapWrong.correct, false);
assert.deepEqual(mapWrong.mismatches, [{elementId: 'sensing', expected: correctMapping.sensing, actual: 'travel-app'}]);
assert.throws(() => Model.matchElements({...correctMapping, extra: 'x'}), RangeError);
assert.throws(() => Model.matchElements({sensing: correctMapping.sensing}), RangeError);
assert.throws(() => Model.matchElements({...correctMapping, network: 'made-up'}), RangeError);

// Step 2: system vs single automation
const scenarios = Model.getBoundaryScenarios();
assert.equal(scenarios.length, 5);
const correctBoundary = Object.fromEntries(scenarios.map(item => [item.id, item.isSystem ? 'system' : 'single-automation']));
const boundaryOk = Model.judgeBoundary(correctBoundary);
assert.equal(boundaryOk.correct, true);
assert.deepEqual(boundaryOk.mismatches, []);
// At least two single-automation distractors and two system cases
assert.ok(scenarios.filter(item => !item.isSystem).length >= 2);
assert.ok(scenarios.filter(item => item.isSystem).length >= 2);

const doorWrong = Model.judgeBoundary({...correctBoundary, 'auto-door': 'system'});
assert.equal(doorWrong.correct, false);
assert.deepEqual(doorWrong.mismatches, [{scenarioId: 'auto-door', expected: 'single-automation', actual: 'system'}]);
assert.throws(() => Model.judgeBoundary({...correctBoundary, unknown: 'system'}), RangeError);
assert.throws(() => Model.judgeBoundary({[scenarios[0].id]: correctBoundary[scenarios[0].id]}), RangeError);
assert.throws(() => Model.judgeBoundary({...correctBoundary, 'auto-door': 'maybe'}), RangeError);

// Step 3: autonomous control practices
const practices = Model.getControlPractices();
const goodPractices = practices.filter(item => item.enhancesControl).map(item => item.id).sort();
assert.ok(goodPractices.includes('data-self-hosting'));
assert.ok(practices.some(item => item.id === 'single-vendor-lockin' && !item.enhancesControl));
const controlOk = Model.judgeControl(goodPractices);
assert.equal(controlOk.correct, true);
assert.deepEqual(controlOk.mismatches, []);

const lockin = Model.judgeControl([...goodPractices, 'single-vendor-lockin']);
assert.equal(lockin.correct, false);
assert.deepEqual(lockin.mismatches.map(item => item.practiceId), ['single-vendor-lockin']);
const missingOne = Model.judgeControl(goodPractices.filter(id => id !== 'data-self-hosting'));
assert.equal(missingOne.correct, false);
assert.deepEqual(missingOne.mismatches.map(item => item.practiceId), ['data-self-hosting']);
assert.throws(() => Model.judgeControl(['data-self-hosting', 'bogus']), RangeError);
assert.throws(() => Model.judgeControl('data-self-hosting'), TypeError);

const snapshot = Model.getLocalSnapshot();
assert.equal(snapshot.networkRequests, 0);
assert.equal(snapshot.connectedToRealPlatform, false);

assert.equal(Object.isFrozen(elements), true);
assert.equal(Object.isFrozen(elements[0]), true);
assert.equal(Object.isFrozen(scenarios), true);
assert.equal(Object.isFrozen(practices), true);
assert.equal(Object.isFrozen(mapOk.mismatches), true);
assert.equal(Object.isFrozen(snapshot), true);

console.log('Smart society system model: elements, boundary and control judgments passed');
