(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SequentialSearchModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const PRESETS = Object.freeze({
    standard: Object.freeze([4, 2, 7, 1, 5]),
    reversed: Object.freeze([5, 1, 7, 2, 4]),
    shifted: Object.freeze([2, 7, 4, 5, 1])
  });

  function createState(values = PRESETS.standard, target = 7) {
    if (!Array.isArray(values) || values.length !== 5 ||
        values.some(value => !Number.isSafeInteger(value) || value < 1 || value > 9) ||
        new Set(values).size !== 5 || !Number.isSafeInteger(target) || target < 1 || target > 9)
      throw new RangeError('Choose five distinct cards and a target from 1–9.');
    return {values: values.slice(), target, comparisons: 0, nextIndex: 0,
      history: [], done: false, foundIndex: null};
  }

  function step(state) {
    if (!state || !Array.isArray(state.values) || !Array.isArray(state.history) ||
        !Number.isSafeInteger(state.comparisons) || state.comparisons < 0 ||
        state.comparisons > state.values.length || state.nextIndex !== state.comparisons)
      throw new TypeError('Invalid sequential-search state.');
    if (state.done) return state;
    const index = state.nextIndex, value = state.values[index], match = value === state.target;
    const comparisons = state.comparisons + 1, done = match || comparisons === state.values.length;
    return {values: state.values.slice(), target: state.target, comparisons,
      nextIndex: done ? comparisons : index + 1,
      history: state.history.concat({index, value, match}), done,
      foundIndex: match ? index : null};
  }

  return {PRESETS, createState, step};
});
