const assert = require('node:assert/strict');
const test = require('node:test');
const Model = require('../computer/middle/assets/online-collaboration-model.js');

test('independent copies require one deliberate delivery per peer, in either order', () => {
  for (const first of ['b', 'c']) {
    const second = first === 'b' ? 'c' : 'b';
    const initial = Model.initial('offline');
    const edited = Model.edit(initial);
    assert.deepEqual(initial.versions, {a: 1, b: 1, c: 1});
    assert.equal(edited.shared, null);
    const afterFirst = Model.assess(edited, first, first === 'b' ? 2 : 1, first === 'c' ? 2 : 1);
    assert.equal(afterFirst.status, 'correct');
    assert.deepEqual(afterFirst.next.versions, first === 'b'
      ? {a: 2, b: 2, c: 1} : {a: 2, b: 1, c: 2});
    assert.equal(afterFirst.next.steps, 1);
    assert.equal(Model.isComplete(afterFirst.next), false);
    const afterSecond = Model.assess(afterFirst.next, second, 2, 2);
    assert.equal(afterSecond.status, 'correct');
    assert.deepEqual(afterSecond.next.versions, {a: 2, b: 2, c: 2});
    assert.equal(afterSecond.next.steps, 2);
    assert.equal(Model.isComplete(afterSecond.next), true);
    assert.deepEqual(edited.versions, {a: 2, b: 1, c: 1});
  }
});

test('connected peers receive one shared version in one simulated sync', () => {
  const edited = Model.edit(Model.initial('online'));
  assert.deepEqual(edited.versions, {a: 2, b: 1, c: 1});
  assert.equal(edited.shared, 2);
  const result = Model.assess(edited, null, 2, 2);
  assert.equal(result.status, 'correct');
  assert.deepEqual(result.delivered, ['b', 'c']);
  assert.deepEqual(result.next.versions, {a: 2, b: 2, c: 2});
  assert.equal(result.next.steps, 1);
  assert.equal(Model.isComplete(result.next), true);
});

test('disconnected peer stays old through reconnection and updates on a later sync', () => {
  const edited = Model.edit(Model.initial('disconnected'));
  const first = Model.assess(edited, null, 2, 1);
  assert.equal(first.status, 'correct');
  assert.deepEqual(first.delivered, ['b']);
  assert.deepEqual(first.next.versions, {a: 2, b: 2, c: 1});
  assert.match(first.feedback, /C 仍断线，保留旧版/);
  assert.throws(() => Model.advance(first.next, null), /重连/);
  const reconnected = Model.reconnectC(first.next);
  assert.equal(reconnected.connected.c, true);
  assert.deepEqual(reconnected.versions, {a: 2, b: 2, c: 1});
  assert.equal(reconnected.steps, 1);
  const second = Model.assess(reconnected, null, 2, 2);
  assert.equal(second.status, 'correct');
  assert.deepEqual(second.delivered, ['c']);
  assert.deepEqual(second.next.versions, {a: 2, b: 2, c: 2});
  assert.match(second.feedback, /C 已重连，本步取得新版/);
  assert.doesNotMatch(second.feedback, /仍断线/);
  assert.equal(second.next.steps, 2);
});

test('wrong, incomplete and invalid actions give feedback without mutating inputs', () => {
  const edited = Model.edit(Model.initial('offline'));
  assert.equal(Model.assess(edited, 'b', null, 1).status, 'incomplete');
  assert.throws(() => Model.assess(edited, '', 2, 1), /递送目标/);
  const wrong = Model.assess(edited, 'b', 1, 2);
  assert.equal(wrong.status, 'wrong');
  assert.equal(wrong.correctB, false);
  assert.equal(wrong.correctC, false);
  assert.deepEqual(wrong.expected, {b: 2, c: 1});
  assert.deepEqual(edited.versions, {a: 2, b: 1, c: 1});
  assert.throws(() => Model.edit(edited), /已经修改/);
  assert.throws(() => Model.advance(edited, 'a'), /递送目标/);
  assert.throws(() => Model.advance(wrong.next, 'b'), /已经拿到新版/);
  assert.throws(() => Model.reconnectC(edited), /不能让 C 重连/);
  assert.throws(() => Model.advance(Model.initial('online'), null), /先让 A 修改/);
  assert.throws(() => Model.initial('unknown'), /未知情境/);
});

test('conclusion distinguishes conditional sharing from instant delivery and offline impossibility', () => {
  assert.equal(Model.checkConclusion(null).status, 'incomplete');
  assert.equal(Model.checkConclusion('always-instant').status, 'wrong');
  assert.equal(Model.checkConclusion('offline-impossible').status, 'wrong');
  assert.equal(Model.checkConclusion('conditional-sharing').status, 'correct');
});
