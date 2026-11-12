(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SearchStrategiesModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SHUFFLED = Object.freeze({
    7: Object.freeze([4, 1, 7, 2, 6, 3, 5]),
    15: Object.freeze([8, 1, 15, 3, 12, 5, 10, 7, 14, 9, 2, 13, 4, 11, 6])
  });

  function createState({size = 15, order = 'sorted', scenario = 'near'} = {}) {
    if (![7, 15].includes(size) || !['sorted', 'shuffled'].includes(order) ||
        !['front', 'near', 'missing'].includes(scenario))
      throw new RangeError('Choose a supported size, order and target scenario.');
    const values = order === 'sorted' ? Array.from({length: size}, (_, index) => index + 1) : SHUFFLED[size].slice();
    const target = scenario === 'front' ? 1 : scenario === 'near' ? size - 1 : size + 1;
    return {size, order, scenario, target, values, ticks: 0, done: false,
      linear: {next: 0, comparisons: 0, foundIndex: null, done: false, history: [], last: null},
      binary: {available: order === 'sorted', low: 0, high: size - 1, comparisons: 0,
        foundIndex: null, done: false, history: [], last: null}};
  }

  function step(state) {
    if (!state || ![7, 15].includes(state.size) || !Array.isArray(state.values) ||
        state.values.length !== state.size || !state.linear || !state.binary ||
        !Array.isArray(state.linear.history) || !Array.isArray(state.binary.history))
      throw new TypeError('Invalid search strategies state.');
    if (state.done) return state;
    const {values, target, size} = state;
    let linear = state.linear, binary = state.binary;
    if (!linear.done) {
      const index = linear.next;
      if (!Number.isInteger(index) || index < 0 || index >= size) throw new TypeError('Invalid linear position.');
      const value = values[index], matched = value === target;
      const last = {index, value, matched};
      linear = {next: index + 1, comparisons: linear.comparisons + 1,
        foundIndex: matched ? index : null, done: matched || index + 1 === size,
        history: linear.history.concat(last), last};
    }
    if (binary.available && !binary.done) {
      const {low, high} = binary;
      if (!Number.isInteger(low) || !Number.isInteger(high) || low < 0 || high >= size || low > high)
        throw new TypeError('Invalid binary range.');
      const index = Math.floor((low + high) / 2), value = values[index];
      const relation = target === value ? 'equal' : target < value ? 'left' : 'right';
      const afterLow = relation === 'right' ? index + 1 : low;
      const afterHigh = relation === 'left' ? index - 1 : high;
      const discarded = relation === 'left' ? [index, high] : relation === 'right' ? [low, index] : null;
      const last = {beforeLow: low, beforeHigh: high, index, value, relation,
        afterLow, afterHigh, discarded};
      binary = {available: true, low: afterLow, high: afterHigh,
        comparisons: binary.comparisons + 1, foundIndex: relation === 'equal' ? index : null,
        done: relation === 'equal' || afterLow > afterHigh,
        history: binary.history.concat(last), last};
    }
    return {...state, ticks: state.ticks + 1, done: linear.done && (!binary.available || binary.done),
      linear, binary};
  }

  function winner(state) {
    if (!state || !state.done || !state.binary.available) return null;
    return state.linear.comparisons < state.binary.comparisons ? 'linear' :
      state.linear.comparisons > state.binary.comparisons ? 'binary' : 'tie';
  }

  return {SHUFFLED, createState, step, winner};
});
