const {test} = require('node:test');
const assert = require('node:assert/strict');
const Model = require('../computer/high/assets/information-system-model.js');

const safe = {loanLimit: 1, accessCheck: true, connection: 'online'};
const studentBorrow = {actor: 'S-01', action: 'borrow'};

test('normal borrowing changes only the named student and the stock', () => {
  const original = Model.createState(2);
  const first = Model.simulate(safe, studentBorrow, original);
  assert.equal(first.outcome, 'borrowed');
  assert.deepEqual(first.before, {stock: 2, loans: {'S-01': 0, 'S-02': 0}, revision: 0});
  assert.deepEqual(first.after, {stock: 1, loans: {'S-01': 1, 'S-02': 0}, revision: 1});
  assert.deepEqual(original, first.before, 'pure model must not mutate the input');
  assert.deepEqual(first.trace.map(item => item.stage), ['input', 'network', 'rules', 'data', 'output']);
  assert.equal(first.trace.find(item => item.stage === 'data').state, 'changed');
});

test('loan limit and empty stock deny without changing any data', () => {
  const borrowed = Model.simulate(safe, studentBorrow, Model.createState(2)).after;
  const limit = Model.simulate(safe, studentBorrow, borrowed);
  assert.equal(limit.outcome, 'limit');
  assert.deepEqual(limit.after, borrowed);
  assert.equal(limit.changed, false);
  const empty = Model.simulate(safe, {actor: 'S-02', action: 'borrow'}, Model.createState(0));
  assert.equal(empty.outcome, 'out-of-stock');
  assert.equal(empty.after.stock, 0);
  assert.equal(empty.trace.find(item => item.stage === 'data').state, 'unchanged');
});

test('access check stops unauthorized writes; turning it off exposes the controlled risk', () => {
  const before = Model.createState(2);
  const request = {actor: 'S-01', action: 'restock'};
  const blocked = Model.simulate(safe, request, before);
  assert.equal(blocked.outcome, 'forbidden');
  assert.equal(blocked.risk, false);
  assert.deepEqual(blocked.after, before);
  const unsafe = Model.simulate({...safe, accessCheck: false}, request, before);
  assert.equal(unsafe.outcome, 'restocked');
  assert.equal(unsafe.risk, true);
  assert.deepEqual(unsafe.after, {stock: 3, loans: {'S-01': 0, 'S-02': 0}, revision: 1});
  assert.equal(unsafe.trace.find(item => item.stage === 'rules').state, 'passed');
  const librarian = Model.simulate(safe, {actor: 'L-01', action: 'restock'}, before);
  assert.equal(librarian.outcome, 'restocked');
  assert.equal(librarian.risk, false);
});

test('offline means no server processing, and capacity stops restocking', () => {
  const initial = Model.createState(3);
  const offline = Model.simulate({...safe, connection: 'offline'}, studentBorrow, initial);
  assert.equal(offline.outcome, 'offline');
  assert.deepEqual(offline.after, initial);
  assert.equal(offline.trace.find(item => item.stage === 'network').state, 'blocked');
  assert.equal(offline.trace.find(item => item.stage === 'rules').state, 'skipped');
  const full = Model.simulate(safe, {actor: 'L-01', action: 'restock'}, Model.createState(4));
  assert.equal(full.outcome, 'stock-full');
  assert.equal(full.changed, false);
  const wrongRole = Model.simulate(safe, {actor: 'L-01', action: 'borrow'}, initial);
  assert.equal(wrongRole.outcome, 'wrong-role');
});

test('loan limit can be changed while state is retained', () => {
  const oneLoan = Model.simulate(safe, studentBorrow, Model.createState(2)).after;
  const allowed = Model.simulate({...safe, loanLimit: 2}, studentBorrow, oneLoan);
  assert.equal(allowed.outcome, 'borrowed');
  assert.equal(allowed.after.stock, 0);
  assert.equal(allowed.after.loans['S-01'], 2);
  assert.equal(allowed.after.revision, 2);
});

test('invalid rules, requests and state are rejected without silent coercion', () => {
  assert.throws(() => Model.createState('2'), RangeError);
  assert.throws(() => Model.createState(5), RangeError);
  assert.throws(() => Model.simulate({...safe, loanLimit: 0}, studentBorrow, Model.createState()), RangeError);
  assert.throws(() => Model.simulate({...safe, accessCheck: 'false'}, studentBorrow, Model.createState()), RangeError);
  assert.throws(() => Model.simulate(safe, {actor: 'visitor', action: 'borrow'}, Model.createState()), RangeError);
  assert.throws(() => Model.simulate(safe, studentBorrow, {stock: -1, loans: {'S-01': 0, 'S-02': 0}, revision: 0}), RangeError);
  assert.throws(() => Model.simulate(safe, studentBorrow, {stock: 2, loans: {'S-01': 2.5, 'S-02': 0}, revision: 0}), RangeError);
});

test('element classification requires each distinct system function', () => {
  assert.equal(Model.checkElements({input: 'request', rule: 'policy', data: 'inventory', output: 'decision'}).ready, true);
  const mistaken = Model.checkElements({input: 'request', rule: 'inventory', data: 'policy', output: 'decision'});
  assert.equal(mistaken.ready, false);
  assert.equal(mistaken.rule, false);
  assert.equal(mistaken.data, false);
  assert.equal(mistaken.input, true);
});
