'use strict';
const assert = require('node:assert/strict');
const {test} = require('node:test');
const Model = require('../simulation-world/assets/assembly-line-model.js');

// Independent event-time recurrence: every operation waits for its part and its machine.
// It does not use the production model's per-second transition implementation.
function expectedSchedule(times) {
  const starts = Array.from({length: 3}, () => []);
  const ends = Array.from({length: 3}, () => []);
  for (let station = 0; station < 3; station++) for (let item = 0; item < 8; item++) {
    starts[station][item] = Math.max(station ? ends[station - 1][item] : 0, item ? ends[station][item - 1] : 0);
    ends[station][item] = starts[station][item] + times[station];
  }
  return {starts, ends};
}
function expectedAt(schedule, times, time) {
  const ids = Array.from({length: 8}, (_, index) => index + 1);
  return {
    pending: ids.filter(id => schedule.starts[0][id - 1] > time),
    queues: [0, 1].map(station => ids.filter(id => schedule.ends[station][id - 1] <= time && schedule.starts[station + 1][id - 1] > time)),
    stations: times.map((_, station) => {
      const id = ids.find(id => schedule.starts[station][id - 1] <= time && schedule.ends[station][id - 1] > time);
      return id ? {id, remaining: schedule.ends[station][id - 1] - time} : null;
    }),
    completed: ids.filter(id => schedule.ends[2][id - 1] <= time),
    completionTimes: schedule.ends[2].filter(end => end <= time)
  };
}
function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value); Object.values(value).forEach(deepFreeze);
  }
  return value;
}
function run(times) {
  let state = Model.createState(times);
  while (!state.done && state.time <= Model.MAX_TIME) state = Model.tick(state);
  assert.equal(state.done, true);
  return state;
}

test('initial state starts only part 1 at cutting, and input durations are copied', () => {
  const times = [2, 5, 2], state = Model.createState(times);
  times[0] = 6;
  assert.deepEqual(state.times, [2, 5, 2]);
  assert.deepEqual(state.pending, [2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(state.stations, [{id: 1, remaining: 2}, null, null]);
  assert.deepEqual(state.queues, [[], []]);
  assert.deepEqual(state.completed, []);
  assert.equal(state.time, 0);
  assert.equal(Model.getMetrics(state).wipCount, 1);
});

test('one-second stations cannot complete two operations in the same tick', () => {
  let state = Model.createState([1, 1, 1]);
  state = Model.tick(state);
  assert.deepEqual(state.stations, [{id: 2, remaining: 1}, {id: 1, remaining: 1}, null]);
  assert.deepEqual(state.completed, []);
  state = Model.tick(state);
  assert.deepEqual(state.stations, [{id: 3, remaining: 1}, {id: 2, remaining: 1}, {id: 1, remaining: 1}]);
  assert.deepEqual(state.completed, []);
  state = Model.tick(state);
  assert.deepEqual(state.completed, [1]);
  assert.deepEqual(state.completionTimes, [3]);
  assert.equal(run([1, 1, 1]).time, 10);
});

test('bottleneck and balanced examples have independently expected first and last delivery times', () => {
  const slow = run([2, 5, 2]), balanced = run([2, 2, 2]);
  assert.deepEqual(slow.completionTimes, [9, 14, 19, 24, 29, 34, 39, 44]);
  assert.deepEqual(balanced.completionTimes, [6, 8, 10, 12, 14, 16, 18, 20]);
  assert.equal(slow.time - balanced.time, 24);
  let state = Model.createState([2, 5, 2]);
  for (let second = 0; second < 6; second++) state = Model.tick(state);
  assert.deepEqual(state.queues[0], [2, 3]);
  assert.equal(Model.getMetrics(state).queuedCount, 2);
});

test('all 216 time combinations match independent operation schedules at every second', () => {
  let combinations = 0;
  for (let cut = 1; cut <= 6; cut++) for (let assembly = 1; assembly <= 6; assembly++) for (let quality = 1; quality <= 6; quality++) {
    const times = [cut, assembly, quality], schedule = expectedSchedule(times);
    const expectedEnd = times.reduce((sum, value) => sum + value, 0) + 7 * Math.max(...times);
    assert.equal(schedule.ends[2][7], expectedEnd);
    let state = Model.createState(times);
    for (let time = 0; time <= expectedEnd; time++) {
      const expected = expectedAt(schedule, times, time);
      for (const key of ['pending', 'queues', 'stations', 'completed', 'completionTimes']) assert.deepEqual(state[key], expected[key], `${times} t=${time} ${key}`);
      const ids = [...state.pending, ...state.queues.flat(), ...state.stations.filter(Boolean).map(station => station.id), ...state.completed];
      assert.equal(ids.length, 8); assert.equal(new Set(ids).size, 8);
      assert.deepEqual([...ids].sort((left, right) => left - right), [1, 2, 3, 4, 5, 6, 7, 8]);
      const metrics = Model.getMetrics(state);
      assert.equal(metrics.pendingCount + metrics.wipCount + metrics.completedCount, 8);
      assert.equal(state.done, time === expectedEnd);
      if (time < expectedEnd) {
        const before = JSON.stringify(state);
        deepFreeze(state);
        const next = Model.tick(state);
        assert.equal(JSON.stringify(state), before);
        assert.notEqual(next, state);
        state = next;
      }
    }
    assert.strictEqual(Model.tick(state), state);
    assert.equal(Model.getMetrics(state).firstCompletion, cut + assembly + quality);
    assert.equal(Model.getMetrics(state).batchDuration, expectedEnd);
    combinations++;
  }
  assert.equal(combinations, 216);
});

test('metrics distinguish steady supply capacity, startup time, and finite batch average', () => {
  const initial = Model.getMetrics(Model.createState([2, 5, 2]));
  assert.deepEqual(initial.bottleneckIndexes, [1]);
  assert.equal(initial.theoreticalRate, 12);
  assert.equal(initial.expectedFirstCompletion, 9);
  assert.equal(initial.expectedBatchDuration, 44);
  assert.equal(initial.firstCompletion, null);
  assert.equal(initial.batchDuration, null);
  assert.equal(initial.batchAverageRate, null);
  const finished = Model.getMetrics(run([2, 5, 2]));
  assert.equal(finished.batchAverageRate, 480 / 44);
  assert.notEqual(finished.batchAverageRate, finished.theoreticalRate);
  assert.deepEqual(Model.getMetrics(Model.createState([2, 2, 2])).bottleneckIndexes, [0, 1, 2]);
  assert.deepEqual(Model.getMetrics(Model.createState([6, 1, 6])).bottleneckIndexes, [0, 2]);
});

test('invalid parameters and damaged states are rejected without silently losing parts', () => {
  for (const times of [null, [], [2, 2], [2, 2, 2, 2], [0, 2, 2], [7, 2, 2], [1.5, 2, 2], ['2', 2, 2], [NaN, 2, 2], [Infinity, 2, 2], [2, , 2]]) assert.throws(() => Model.createState(times), /integer from 1 to 6/);
  const bad = mutate => {const state = Model.createState(); mutate(state); return () => Model.tick(state);};
  assert.throws(bad(state => state.pending.unshift(1)), /conserved/);
  assert.throws(bad(state => state.pending.pop()), /conserved/);
  assert.throws(bad(state => {delete state.pending[0];}), /FIFO/);
  assert.throws(bad(state => {state.queues[0] = new Array(1);}), /FIFO/);
  assert.throws(bad(state => {delete state.stations[0];}), /remaining/);
  assert.throws(bad(state => {state.stations[0].remaining = 0;}), /remaining/);
  assert.throws(bad(state => {state.pending = [3, 2, 4, 5, 6, 7, 8];}), /FIFO/);
  assert.throws(bad(state => {state.done = true;}), /completion flag/);
  assert.throws(bad(state => {state.time = -1;}), /simulation time/);
});
