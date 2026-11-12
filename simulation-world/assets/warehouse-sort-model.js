(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  if (root) root.WarehouseSortModel = model;
})(typeof window !== 'undefined' ? window : undefined, function () {
  'use strict';

  const ROUTES = Object.freeze(['A', 'A', 'B', 'A', 'A', 'B', 'A', 'A', 'B', 'A', 'A', 'B']);
  const PARCELS = Object.freeze(ROUTES.map((route, index) => Object.freeze({id: `P${index + 1}`, route})));
  const DEFAULT_CONFIG = Object.freeze({arrivalInterval: 1, serviceA: 3, serviceB: 1});

  function checkConfig(config) {
    if (!config || typeof config !== 'object') throw new TypeError('configuration required');
    for (const [key, max] of [['arrivalInterval', 3], ['serviceA', 4], ['serviceB', 4]]) {
      if (!Number.isInteger(config[key]) || config[key] < 1 || config[key] > max)
        throw new RangeError(`${key} must be an integer from 1 to ${max}`);
    }
    return {arrivalInterval: config.arrivalInterval, serviceA: config.serviceA, serviceB: config.serviceB};
  }

  function createState(config = DEFAULT_CONFIG) {
    return {
      config: checkConfig(config), time: -1, nextArrival: 0,
      queues: {A: [], B: []}, active: {A: null, B: null}, done: [],
      peakQueue: {A: 0, B: 0}, firstQueue: null, complete: false,
      event: {arrived: null, started: [], completed: []},
    };
  }

  function assertState(state) {
    if (!state || typeof state !== 'object') throw new TypeError('state required');
    checkConfig(state.config);
    if (!Number.isInteger(state.time) || state.time < -1 || state.time > 100)
      throw new RangeError('invalid simulation time');
    if (!Number.isInteger(state.nextArrival) || state.nextArrival < 0 || state.nextArrival > PARCELS.length)
      throw new RangeError('invalid arrival index');
    const seen = new Set();
    const checkId = (id, route) => {
      const parcel = PARCELS.find(item => item.id === id);
      if (!parcel || parcel.route !== route || seen.has(id)) throw new Error('parcel conservation or route failed');
      seen.add(id);
    };
    for (const route of ['A', 'B']) {
      if (!Array.isArray(state.queues?.[route])) throw new TypeError('invalid queue');
      for (const id of state.queues[route]) checkId(id, route);
      const active = state.active?.[route];
      if (active !== null) {
        if (!active || !Number.isInteger(active.endAt) || active.endAt <= state.time)
          throw new Error('invalid active job');
        checkId(active.id, route);
      }
      if (!Number.isInteger(state.peakQueue?.[route]) || state.peakQueue[route] < state.queues[route].length)
        throw new Error('invalid queue peak');
    }
    if (!Array.isArray(state.done)) throw new TypeError('invalid completed parcels');
    for (const item of state.done) {
      if (!Number.isInteger(item.at) || item.at > state.time) throw new Error('invalid completion time');
      checkId(item.id, item.route);
    }
    if (seen.size !== state.nextArrival) throw new Error('arrived parcel conservation failed');
    for (let index = 0; index < state.nextArrival; index++) {
      if (!seen.has(PARCELS[index].id)) throw new Error('arrival order failed');
    }
    if (state.firstQueue !== null && !['A', 'B'].includes(state.firstQueue)) throw new Error('invalid first queue');
    const finished = state.nextArrival === PARCELS.length &&
      state.queues.A.length === 0 && state.queues.B.length === 0 &&
      state.active.A === null && state.active.B === null;
    if (state.complete !== finished) throw new Error('invalid completion flag');
    return true;
  }

  function step(state) {
    assertState(state);
    if (state.complete) return state;
    const next = {
      config: {...state.config}, time: state.time + 1, nextArrival: state.nextArrival,
      queues: {A: [...state.queues.A], B: [...state.queues.B]},
      active: {A: state.active.A && {...state.active.A}, B: state.active.B && {...state.active.B}},
      done: state.done.map(item => ({...item})),
      peakQueue: {...state.peakQueue}, firstQueue: state.firstQueue, complete: false,
      event: {arrived: null, started: [], completed: []},
    };
    for (const route of ['A', 'B']) {
      const active = next.active[route];
      if (active && active.endAt === next.time) {
        next.done.push({id: active.id, route, at: next.time});
        next.event.completed.push(active.id);
        next.active[route] = null;
      }
    }
    if (next.nextArrival < PARCELS.length &&
        next.time === next.nextArrival * next.config.arrivalInterval) {
      const parcel = PARCELS[next.nextArrival];
      next.queues[parcel.route].push(parcel.id);
      next.event.arrived = parcel.id;
      next.nextArrival++;
    }
    for (const route of ['A', 'B']) {
      if (next.active[route] === null && next.queues[route].length) {
        const id = next.queues[route].shift();
        next.active[route] = {
          id, startedAt: next.time,
          endAt: next.time + next.config[`service${route}`],
        };
        next.event.started.push(id);
      }
      next.peakQueue[route] = Math.max(next.peakQueue[route], next.queues[route].length);
      if (next.firstQueue === null && next.queues[route].length) next.firstQueue = route;
    }
    next.complete = next.nextArrival === PARCELS.length &&
      next.queues.A.length === 0 && next.queues.B.length === 0 &&
      next.active.A === null && next.active.B === null;
    assertState(next);
    return next;
  }

  function runToEnd(config = DEFAULT_CONFIG) {
    let state = createState(config);
    for (let count = 0; count < 100 && !state.complete; count++) state = step(state);
    if (!state.complete) throw new Error('simulation failed to finish');
    return state;
  }

  return {PARCELS, DEFAULT_CONFIG, createState, assertState, step, runToEnd};
});
