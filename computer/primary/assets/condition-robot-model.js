(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ConditionRobotModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const WIDTH = 5, HEIGHT = 3;
  const START = Object.freeze({column: 1, row: 3});
  const GOAL = Object.freeze({column: 5, row: 1});
  const WALLS = Object.freeze([Object.freeze({column: 3, row: 3}), Object.freeze({column: 5, row: 2})]);
  const DEFAULT_RULE = Object.freeze({check: 'right', whenTrue: 'up', whenFalse: 'right'});
  const DIRECTIONS = Object.freeze({
    up: Object.freeze({column: 0, row: -1, label: '向上'}),
    right: Object.freeze({column: 1, row: 0, label: '向右'}),
    down: Object.freeze({column: 0, row: 1, label: '向下'}),
    left: Object.freeze({column: -1, row: 0, label: '向左'})
  });
  const copyPosition = position => ({column: position.column, row: position.row});
  const samePosition = (left, right) => left.column === right.column && left.row === right.row;

  function checkCoordinates(position) {
    if (!position || !Number.isSafeInteger(position.column) || !Number.isSafeInteger(position.row)) throw new TypeError('A position needs integer column and row coordinates.');
  }
  function cellKind(position) {
    checkCoordinates(position);
    if (position.column < 1 || position.column > WIDTH || position.row < 1 || position.row > HEIGHT) return 'boundary';
    return WALLS.some(wall => samePosition(wall, position)) ? 'wall' : 'open';
  }
  function checkPosition(position) {
    if (cellKind(position) !== 'open') throw new RangeError('The robot must be on an open map cell.');
  }
  function validateRule(rule) {
    if (!rule || typeof rule !== 'object' || !['right', 'up'].includes(rule.check) || !Object.hasOwn(DIRECTIONS, rule.whenTrue) || !Object.hasOwn(DIRECTIONS, rule.whenFalse)) throw new RangeError('Choose right/up for the check and one of four absolute directions for each action.');
    return true;
  }
  function adjacent(position, direction) {
    return {column: position.column + DIRECTIONS[direction].column, row: position.row + DIRECTIONS[direction].row};
  }

  function evaluate(position, rule) {
    checkPosition(position); validateRule(rule);
    const positionBefore = copyPosition(position);
    const checkedPosition = adjacent(positionBefore, rule.check);
    const checkedKind = cellKind(checkedPosition);
    const condition = checkedKind !== 'open';
    const branch = condition ? 'if' : 'else';
    const action = condition ? rule.whenTrue : rule.whenFalse;
    const actionTarget = adjacent(positionBefore, action);
    const targetKind = cellKind(actionTarget);
    const movement = targetKind === 'open' ? 'moved' : targetKind;
    const positionAfter = movement === 'moved' ? copyPosition(actionTarget) : copyPosition(positionBefore);
    return {positionBefore, checkedPosition, checkedKind, condition, branch, action, actionTarget, movement, positionAfter, atGoal: samePosition(positionAfter, GOAL)};
  }

  function createState(rule = DEFAULT_RULE) {
    validateRule(rule);
    return {
      rule: {check: rule.check, whenTrue: rule.whenTrue, whenFalse: rule.whenFalse},
      position: copyPosition(START), steps: 0, trueCount: 0, falseCount: 0,
      collisions: 0, atGoal: false, eligible: false, snapshot: null
    };
  }

  function validateState(state) {
    if (!state || typeof state !== 'object') throw new TypeError('An exploration state is required.');
    validateRule(state.rule); checkPosition(state.position);
    for (const name of ['steps', 'trueCount', 'falseCount', 'collisions']) {
      if (!Number.isSafeInteger(state[name]) || state[name] < 0) throw new RangeError('Exploration counts must be nonnegative integers.');
    }
    if (state.trueCount + state.falseCount !== state.steps || state.collisions > state.steps) throw new RangeError('Judgment and collision counts must match the exploration.');
    const atGoal = samePosition(state.position, GOAL);
    const eligible = atGoal && state.collisions === 0 && state.trueCount > 0 && state.falseCount > 0;
    if (state.atGoal !== atGoal || state.eligible !== eligible) throw new RangeError('Goal and completion flags must match the current exploration.');
    if (state.steps === 0 ? state.snapshot !== null : !state.snapshot || typeof state.snapshot !== 'object') throw new TypeError('The latest snapshot must match whether a judgment has been made.');
    return true;
  }

  function step(state) {
    validateState(state);
    if (state.atGoal) return state;
    if (state.steps === Number.MAX_SAFE_INTEGER) throw new RangeError('Reset the exploration before the judgment count becomes too large.');
    const snapshot = evaluate(state.position, state.rule);
    const trueCount = state.trueCount + (snapshot.condition ? 1 : 0);
    const falseCount = state.falseCount + (snapshot.condition ? 0 : 1);
    const collisions = state.collisions + (snapshot.movement === 'moved' ? 0 : 1);
    const next = {
      rule: {...state.rule}, position: copyPosition(snapshot.positionAfter),
      steps: state.steps + 1, trueCount, falseCount, collisions,
      atGoal: snapshot.atGoal,
      eligible: snapshot.atGoal && collisions === 0 && trueCount > 0 && falseCount > 0,
      snapshot
    };
    validateState(next);
    return next;
  }

  return Object.freeze({WIDTH, HEIGHT, START, GOAL, WALLS, DEFAULT_RULE, DIRECTIONS, cellKind, validateRule, createState, validateState, evaluate, step});
});
