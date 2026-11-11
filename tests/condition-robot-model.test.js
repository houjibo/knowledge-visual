'use strict';
const assert = require('node:assert/strict');
const {test} = require('node:test');
const Model = require('../computer/primary/assets/condition-robot-model.js');

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(freeze); }
  return value;
}
const point = (column, row) => ({column, row});
// Independent, row-based map oracle; it does not call model geometry or movement helpers.
const ROWS = ['.....', '....#', '..#..'];
const ACTIONS = ['up', 'right', 'down', 'left'];
function referenceKind(p) {
  if (p.column < 1 || p.column > 5 || p.row < 1 || p.row > 3) return 'boundary';
  return ROWS[p.row - 1][p.column - 1] === '#' ? 'wall' : 'open';
}
function referenceNeighbor(p, action) {
  switch (action) {
    case 'up': return point(p.column, p.row - 1);
    case 'right': return point(p.column + 1, p.row);
    case 'down': return point(p.column, p.row + 1);
    case 'left': return point(p.column - 1, p.row);
    default: throw new Error('Unknown reference action');
  }
}
function reference(p, rule) {
  const checkedPosition = referenceNeighbor(p, rule.check), checkedKind = referenceKind(checkedPosition);
  const condition = checkedKind !== 'open', branch = condition ? 'if' : 'else';
  const action = rule[condition ? 'whenTrue' : 'whenFalse'];
  const actionTarget = referenceNeighbor(p, action), kind = referenceKind(actionTarget);
  const positionAfter = kind === 'open' ? actionTarget : {...p};
  return {positionBefore: {...p}, checkedPosition, checkedKind, condition, branch, action, actionTarget,
    movement: kind === 'open' ? 'moved' : kind, positionAfter, atGoal: positionAfter.column === 5 && positionAfter.row === 1};
}

test('both valid rules follow independent exact six-step paths and observe true and false', () => {
  const examples = [
    {rule: {check: 'right', whenTrue: 'up', whenFalse: 'right'}, coordinates: [[2,3],[2,2],[3,2],[4,2],[4,1],[5,1]], truths: [false,true,false,false,true,false]},
    {rule: {check: 'up', whenTrue: 'right', whenFalse: 'up'}, coordinates: [[1,2],[1,1],[2,1],[3,1],[4,1],[5,1]], truths: [false,false,true,true,true,true]}
  ];
  for (const example of examples) {
    let state = Model.createState(example.rule);
    for (let index = 0; index < 6; index++) {
      const old = state, serialized = JSON.stringify(old);
      freeze(old); state = Model.step(old);
      assert.equal(JSON.stringify(old), serialized);
      assert.deepEqual(state.position, point(...example.coordinates[index]));
      assert.equal(state.snapshot.condition, example.truths[index]);
      assert.equal(state.snapshot.branch, example.truths[index] ? 'if' : 'else');
      assert.deepEqual(state.snapshot, reference(old.position, example.rule));
      assert.equal(state.steps, index + 1);
      assert.equal(state.eligible, index === 5);
    }
    assert.equal(state.collisions, 0);
    assert.equal(state.trueCount > 0 && state.falseCount > 0, true);
    assert.strictEqual(Model.step(state), state);
  }
});

test('final historical false result is not replaced by the condition at the new position', () => {
  let state = Model.createState();
  for (let index = 0; index < 6; index++) state = Model.step(state);
  assert.deepEqual(state.snapshot.positionBefore, point(4,1));
  assert.deepEqual(state.snapshot.checkedPosition, point(5,1));
  assert.equal(state.snapshot.checkedKind, 'open');
  assert.equal(state.snapshot.condition, false);
  assert.equal(state.snapshot.action, 'right');
  assert.deepEqual(state.snapshot.positionAfter, point(5,1));
  assert.equal(Model.evaluate(state.position, state.rule).condition, true);
  assert.equal(state.snapshot.condition, false);
});

test('all 32 rules match the finite-state oracle, with exactly two successful rules', () => {
  const successful = [];
  let configurations = 0;
  for (const check of ['right', 'up']) for (const whenTrue of ACTIONS) for (const whenFalse of ACTIONS) {
    const rule = {check, whenTrue, whenFalse};
    let state = Model.createState(rule), p = point(1,3);
    const seen = new Set();
    while (!state.atGoal && !seen.has(`${p.column},${p.row}`)) {
      seen.add(`${p.column},${p.row}`);
      assert.equal(seen.size <= 13, true, 'only thirteen open cells are possible');
      const expected = reference(p, rule), previous = JSON.stringify(state);
      freeze(state); const next = Model.step(state);
      assert.equal(JSON.stringify(state), previous);
      assert.deepEqual(next.snapshot, expected);
      assert.deepEqual(next.position, expected.positionAfter);
      assert.equal(next.trueCount + next.falseCount, next.steps);
      p = expected.positionAfter; state = next;
    }
    if (state.atGoal) {
      assert.equal(state.eligible, true); assert.equal(state.collisions, 0);
      successful.push(`${check}/${whenTrue}/${whenFalse}`);
    } else {
      const again = Model.step(state);
      assert.deepEqual(again.snapshot, reference(p, rule));
      assert.equal(again.eligible, false);
    }
    configurations++;
  }
  assert.equal(configurations, 32);
  assert.deepEqual(successful.sort(), ['right/up/right', 'up/right/up']);
});

test('checking an obstacle and executing a colliding action are separate outcomes', () => {
  const wall = Model.evaluate(point(2,3), {check: 'right', whenTrue: 'right', whenFalse: 'up'});
  assert.equal(wall.checkedKind, 'wall'); assert.equal(wall.condition, true);
  assert.equal(wall.branch, 'if'); assert.equal(wall.action, 'right');
  assert.equal(wall.movement, 'wall'); assert.deepEqual(wall.positionAfter, point(2,3));
  const falseButBlocked = Model.evaluate(point(1,3), {check: 'right', whenTrue: 'up', whenFalse: 'left'});
  assert.equal(falseButBlocked.condition, false); assert.equal(falseButBlocked.branch, 'else');
  assert.equal(falseButBlocked.movement, 'boundary'); assert.deepEqual(falseButBlocked.positionAfter, point(1,3));
  const boundaryCheck = Model.evaluate(point(1,1), {check: 'up', whenTrue: 'right', whenFalse: 'down'});
  assert.equal(boundaryCheck.checkedKind, 'boundary'); assert.deepEqual(boundaryCheck.checkedPosition, point(1,0));
  assert.equal(boundaryCheck.movement, 'moved'); assert.deepEqual(boundaryCheck.positionAfter, point(2,1));
});

test('all open positions and rules preserve one action, snapshots, and input values', () => {
  for (let row = 1; row <= 3; row++) for (let column = 1; column <= 5; column++) {
    if (referenceKind(point(column,row)) !== 'open') continue;
    for (const check of ['right', 'up']) for (const whenTrue of ACTIONS) for (const whenFalse of ACTIONS) {
      const p = freeze(point(column,row)), rule = freeze({check, whenTrue, whenFalse});
      const actual = Model.evaluate(p, rule);
      assert.deepEqual(actual, reference(p, rule));
      assert.notStrictEqual(actual.positionBefore, p); assert.notStrictEqual(actual.positionAfter, p);
      assert.equal(actual.action, actual.condition ? whenTrue : whenFalse);
      assert.equal(Math.abs(actual.positionAfter.column - column) + Math.abs(actual.positionAfter.row - row), actual.movement === 'moved' ? 1 : 0);
    }
  }
});

test('initial state copies rules and rejects invalid directions, positions and counts', () => {
  const rule = {check: 'right', whenTrue: 'up', whenFalse: 'right'}, state = Model.createState(rule);
  rule.whenTrue = 'left'; assert.equal(state.rule.whenTrue, 'up');
  assert.deepEqual(state.position, point(1,3)); assert.equal(state.snapshot, null); assert.equal(state.steps, 0);
  assert.throws(() => Model.createState({check: 'left', whenTrue: 'up', whenFalse: 'right'}), /right\/up/);
  assert.throws(() => Model.createState({check: 'right', whenTrue: 'jump', whenFalse: 'right'}), /four absolute/);
  assert.throws(() => Model.evaluate(point(3,3), Model.DEFAULT_RULE), /open map cell/);
  assert.throws(() => Model.evaluate(point(0,3), Model.DEFAULT_RULE), /open map cell/);
  assert.throws(() => Model.cellKind({column: 1.5, row: 2}), /integer/);
  assert.throws(() => Model.step({...state, trueCount: 1}), /counts must match/);
  assert.throws(() => Model.step({...state, atGoal: true}), /flags must match/);
});
