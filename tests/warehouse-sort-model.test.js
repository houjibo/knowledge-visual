const {test} = require('node:test');
const assert = require('node:assert/strict');
const Model = require('../simulation-world/assets/warehouse-sort-model.js');

const routes = ['A', 'A', 'B', 'A', 'A', 'B', 'A', 'A', 'B', 'A', 'A', 'B'];

function independentSchedule(config) {
  const freeAt = {A: 0, B: 0};
  const jobs = routes.map((route, index) => {
    const arrival = index * config.arrivalInterval;
    const start = Math.max(arrival, freeAt[route]);
    const end = start + config[`service${route}`];
    freeAt[route] = end;
    return {id: `P${index + 1}`, route, arrival, start, end};
  });
  const time = Math.max(...jobs.map(job => job.end));
  const peak = {A: 0, B: 0};
  for (let second = 0; second <= time; second++) {
    for (const route of ['A', 'B']) {
      peak[route] = Math.max(peak[route], jobs.filter(job => job.route === route && job.arrival <= second && job.start > second).length);
    }
  }
  const firstWaiting = jobs.find(job => job.start > job.arrival);
  return {jobs, time, peak, firstQueue: firstWaiting?.route || null};
}

test('48 valid configurations match an independent per-parcel schedule', () => {
  for (let arrivalInterval = 1; arrivalInterval <= 3; arrivalInterval++) {
    for (let serviceA = 1; serviceA <= 4; serviceA++) {
      for (let serviceB = 1; serviceB <= 4; serviceB++) {
        const config = {arrivalInterval, serviceA, serviceB};
        const expected = independentSchedule(config);
        let state = Model.createState(config);
        let previous = state;
        for (let count = 0; count < 100 && !state.complete; count++) {
          state = Model.step(state);
          assert.notEqual(state, previous);
          assert.equal(Model.assertState(state), true);
          previous = state;
        }
        assert.equal(state.complete, true, JSON.stringify(config));
        assert.equal(state.time, expected.time, JSON.stringify(config));
        assert.deepEqual(state.peakQueue, expected.peak, JSON.stringify(config));
        assert.equal(state.firstQueue, expected.firstQueue, JSON.stringify(config));
        assert.deepEqual(state.done.map(item => item.id).sort(), expected.jobs.map(job => job.id).sort());
        for (const job of expected.jobs) {
          const actual = state.done.find(item => item.id === job.id);
          assert.equal(actual.at, job.end, `${job.id} ${JSON.stringify(config)}`);
          assert.equal(actual.route, job.route);
        }
        assert.equal(Model.step(state), state);
      }
    }
  }
});

test('named examples expose A pressure, B pressure and no waiting', () => {
  const a = Model.runToEnd({arrivalInterval: 1, serviceA: 3, serviceB: 1});
  const b = Model.runToEnd({arrivalInterval: 1, serviceA: 1, serviceB: 4});
  const balanced = Model.runToEnd({arrivalInterval: 1, serviceA: 1, serviceB: 1});
  assert.equal(a.firstQueue, 'A');
  assert.equal(a.peakQueue.B, 0);
  assert.equal(b.firstQueue, 'B');
  assert.equal(b.peakQueue.A, 0);
  assert.equal(balanced.firstQueue, null);
  assert.deepEqual(balanced.peakQueue, {A: 0, B: 0});
  assert.ok(a.time > balanced.time);
});

test('event order and input boundaries are explicit', () => {
  let state = Model.createState();
  assert.equal(state.time, -1);
  state = Model.step(state);
  assert.equal(state.time, 0);
  assert.equal(state.event.arrived, 'P1');
  assert.equal(state.active.A.id, 'P1');
  assert.equal(state.active.A.endAt, 3);
  state = Model.step(state);
  assert.deepEqual(state.queues.A, ['P2']);
  assert.equal(state.firstQueue, 'A');
  assert.deepEqual(state.done, []);
  for (const bad of [null, {}, {arrivalInterval: 0, serviceA: 3, serviceB: 1},
    {arrivalInterval: 4, serviceA: 3, serviceB: 1},
    {arrivalInterval: 1, serviceA: 1.5, serviceB: 1},
    {arrivalInterval: 1, serviceA: 3, serviceB: Infinity}]) {
    assert.throws(() => Model.createState(bad));
  }
  const corrupt = Model.createState();
  corrupt.nextArrival = 1;
  assert.throws(() => Model.step(corrupt), /conservation/);
});
