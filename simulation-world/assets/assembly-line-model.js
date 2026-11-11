(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AssemblyLineModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const BATCH_SIZE = 8;
  const STATION_NAMES = Object.freeze(['切割', '装配', '质检']);
  const MAX_TIME = 144;

  function checkTimes(times) {
    if (!Array.isArray(times) || times.length !== 3 || Array.from(times).some(value => !Number.isInteger(value) || value < 1 || value > 6)) {
      throw new RangeError('Each of the three processing times must be an integer from 1 to 6.');
    }
    return [...times];
  }

  function validateState(state) {
    if (!state || typeof state !== 'object') throw new TypeError('A simulation state is required.');
    checkTimes(state.times);
    if (state.batchSize !== BATCH_SIZE || !Number.isInteger(state.time) || state.time < 0 || state.time > MAX_TIME) throw new RangeError('Invalid batch size or simulation time.');
    if (!Array.isArray(state.pending) || !Array.isArray(state.queues) || state.queues.length !== 2 || Array.from(state.queues).some(queue => !Array.isArray(queue)) || !Array.isArray(state.stations) || state.stations.length !== 3 || !Array.isArray(state.completed)) {
      throw new TypeError('The state must contain pending parts, two queues, three stations, and completed parts.');
    }
    const orderedLists = [state.pending, ...state.queues, state.completed];
    for (const list of orderedLists) {
      if (Array.from(list).some((id, index) => !Number.isInteger(id) || id < 1 || id > BATCH_SIZE || (index > 0 && list[index - 1] >= id))) throw new RangeError('Part queues must preserve increasing FIFO identifiers.');
    }
    const active = [];
    for (let index = 0; index < 3; index++) {
      const station = state.stations[index];
      if (station === null) continue;
      if (!station || !Number.isInteger(station.id) || station.id < 1 || station.id > BATCH_SIZE || !Number.isInteger(station.remaining) || station.remaining < 1 || station.remaining > state.times[index]) throw new RangeError('An active station needs a valid part and remaining processing time.');
      active.push(station.id);
    }
    const all = [...state.pending, ...state.queues.flat(), ...active, ...state.completed];
    if (all.length !== BATCH_SIZE || new Set(all).size !== BATCH_SIZE || all.some(id => !Number.isInteger(id) || id < 1 || id > BATCH_SIZE)) throw new RangeError('The eight unique part identifiers must be conserved.');
    if (state.completed.some((id, index) => id !== index + 1)) throw new RangeError('Completed parts must preserve FIFO order.');
    if (!Array.isArray(state.completionTimes) || state.completionTimes.length !== state.completed.length || Array.from(state.completionTimes).some((time, index) => !Number.isInteger(time) || time < 1 || time > state.time || (index > 0 && state.completionTimes[index - 1] >= time))) throw new RangeError('Completion timestamps must match the completed parts.');
    if (typeof state.done !== 'boolean' || state.done !== (state.completed.length === BATCH_SIZE)) throw new RangeError('The completion flag must match the batch.');
    if (!Array.isArray(state.events)) throw new TypeError('The latest events must be an array.');
    return true;
  }

  function createState(times = [2, 5, 2]) {
    const durations = checkTimes(times);
    return {
      time: 0, times: durations, batchSize: BATCH_SIZE,
      pending: Array.from({length: BATCH_SIZE - 1}, (_, index) => index + 2),
      queues: [[], []],
      stations: [{id: 1, remaining: durations[0]}, null, null],
      completed: [], completionTimes: [], done: false,
      events: [{type: 'start', station: 0, id: 1, time: 0}]
    };
  }

  function tick(state) {
    validateState(state);
    if (state.done) return state;
    if (state.time >= MAX_TIME) throw new RangeError('The finite simulation exceeded its time bound.');
    const next = {
      time: state.time + 1, times: [...state.times], batchSize: BATCH_SIZE,
      pending: [...state.pending], queues: state.queues.map(queue => [...queue]),
      stations: state.stations.map(station => station ? {...station} : null),
      completed: [...state.completed], completionTimes: [...state.completionTimes],
      done: false, events: []
    };

    // First advance only the parts that were already being processed at the old time.
    const finished = [];
    next.stations.forEach((station, index) => {
      if (!station) return;
      station.remaining--;
      if (station.remaining === 0) {
        finished.push({id: station.id, station: index});
        next.stations[index] = null;
      }
    });
    // All completions enter their destination before any empty station takes a new part.
    for (const part of finished) {
      next.events.push({type: 'finish', ...part, time: next.time});
      if (part.station === 2) {
        next.completed.push(part.id);
        next.completionTimes.push(next.time);
      } else next.queues[part.station].push(part.id);
    }
    next.stations.forEach((station, index) => {
      const queue = index === 0 ? next.pending : next.queues[index - 1];
      if (!station && queue.length) {
        const id = queue.shift();
        next.stations[index] = {id, remaining: next.times[index]};
        next.events.push({type: 'start', station: index, id, time: next.time});
      }
    });
    next.done = next.completed.length === BATCH_SIZE;
    validateState(next);
    return next;
  }

  function getMetrics(state) {
    validateState(state);
    const slowest = Math.max(...state.times);
    const activeCount = state.stations.filter(Boolean).length;
    const queuedCount = state.queues.reduce((sum, queue) => sum + queue.length, 0);
    return {
      pendingCount: state.pending.length,
      activeCount, queuedCount, wipCount: activeCount + queuedCount,
      completedCount: state.completed.length,
      bottleneckIndexes: state.times.flatMap((time, index) => time === slowest ? [index] : []),
      theoreticalRate: 60 / slowest,
      expectedFirstCompletion: state.times.reduce((sum, time) => sum + time, 0),
      expectedBatchDuration: state.times.reduce((sum, time) => sum + time, 0) + (BATCH_SIZE - 1) * slowest,
      firstCompletion: state.completionTimes[0] ?? null,
      batchDuration: state.done ? state.time : null,
      batchAverageRate: state.done ? BATCH_SIZE * 60 / state.time : null
    };
  }

  return Object.freeze({BATCH_SIZE, STATION_NAMES, MAX_TIME, createState, tick, getMetrics, validateState});
});
