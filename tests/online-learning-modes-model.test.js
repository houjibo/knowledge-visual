const assert = require('node:assert/strict');
const test = require('node:test');
const Model = require('../computer/middle/assets/online-learning-modes-model.js');

test('the same remote question changes recommendation when shared time disappears', () => {
  const together = Model.scenario('remote-question');
  const shifted = Model.scenario('remote-shifted');
  assert.equal(together.times.a, '18:00');
  assert.equal(together.times.b, '18:00');
  assert.equal(shifted.times.a, '18:00');
  assert.equal(shifted.times.b, '20:00');
  assert.deepEqual(Model.feasibleFor('remote-question'), {live: true, board: true, face: false});
  assert.deepEqual(Model.feasibleFor('remote-shifted'), {live: false, board: true, face: false});
  assert.deepEqual(Model.assess('remote-question', 'live', 'immediate').expected,
    {mode: 'live', reason: 'immediate'});
  assert.equal(Model.assess('remote-question', 'live', 'immediate').status, 'correct');
  assert.equal(Model.assess('remote-shifted', 'board', 'flexible').status, 'correct');
  assert.match(Model.assess('remote-shifted', 'board', 'flexible').feedback, /不能保证即时答疑/);
});

test('delayed club discussion and same-room outage use different constraints', () => {
  assert.deepEqual(Model.feasibleFor('club-plan'), {live: false, board: true, face: false});
  assert.equal(Model.assess('club-plan', 'board', 'flexible').status, 'correct');
  assert.deepEqual(Model.feasibleFor('classroom-offline'), {live: false, board: false, face: true});
  assert.equal(Model.assess('classroom-offline', 'face', 'nearby').status, 'correct');
});

test('wrong choice distinguishes unavailable from feasible but less suitable', () => {
  const feasibleAlternative = Model.assess('remote-question', 'board', 'flexible');
  assert.equal(feasibleAlternative.status, 'wrong');
  assert.equal(feasibleAlternative.modeCorrect, false);
  assert.match(feasibleAlternative.feedback, /可行，但不优先/);
  const unavailable = Model.assess('remote-shifted', 'live', 'immediate');
  assert.equal(unavailable.status, 'wrong');
  assert.match(unavailable.feedback, /不可行/);
  const reasonOnly = Model.assess('classroom-offline', 'face', 'immediate');
  assert.equal(reasonOnly.modeCorrect, true);
  assert.equal(reasonOnly.reasonCorrect, false);
  assert.match(reasonOnly.feedback, /同地可直接讨论且无需网络/);
});

test('incomplete and invalid inputs are explicit', () => {
  assert.equal(Model.assess('remote-question', '', '').status, 'incomplete');
  assert.equal(Model.assess('remote-question', 'live', '').status, 'incomplete');
  assert.throws(() => Model.assess('invalid', 'live', 'immediate'), /未知情境/);
  assert.throws(() => Model.assess('remote-question', 'telephone', 'immediate'), /未知选择/);
  assert.throws(() => Model.assess('remote-question', 'live', 'always'), /未知选择/);
});

test('conclusion rejects universal online or offline claims', () => {
  assert.equal(Model.checkConclusion(null).status, 'incomplete');
  assert.equal(Model.checkConclusion('conditional').status, 'correct');
  assert.equal(Model.checkConclusion('online-always').status, 'wrong');
  assert.equal(Model.checkConclusion('offline-always').status, 'wrong');
  assert.throws(() => Model.checkConclusion('invalid'), /未知结论/);
});
