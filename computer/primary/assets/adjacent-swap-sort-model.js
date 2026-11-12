(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AdjacentSwapSortModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const PRESETS = Object.freeze({
    mixed: Object.freeze([4, 2, 5, 1, 3]),
    sorted: Object.freeze([1, 2, 3, 4, 5]),
    reversed: Object.freeze([5, 4, 3, 2, 1])
  });

  function createState(values = PRESETS.mixed) {
    if (!Array.isArray(values) || values.length !== 5 ||
        values.some(value => !Number.isSafeInteger(value) || value < 1 || value > 9) ||
        new Set(values).size !== 5)
      throw new RangeError('Choose five distinct integer cards from 1–9.');
    return {initial: values.slice(), values: values.slice(), pass: 1, pairIndex: 0,
      settledCount: 0, comparisons: 0, swaps: 0, passSwaps: 0,
      history: [], completedPasses: [], last: null, done: false};
  }

  function step(state) {
    if (!state || !Array.isArray(state.values) || state.values.length !== 5 ||
        !Array.isArray(state.history) || !Array.isArray(state.completedPasses) ||
        !Number.isSafeInteger(state.comparisons) || state.comparisons !== state.history.length ||
        !Number.isSafeInteger(state.settledCount) || state.settledCount < 0 || state.settledCount > 4)
      throw new TypeError('Invalid adjacent-swap sort state.');
    if (state.done) return state;
    if (!Number.isSafeInteger(state.pairIndex) || state.pairIndex < 0 ||
        state.pairIndex >= 4 - state.settledCount) throw new TypeError('Invalid comparison position.');

    const values = state.values.slice(), index = state.pairIndex;
    const left = values[index], right = values[index + 1], swapped = left > right;
    if (swapped) { values[index] = right; values[index + 1] = left; }
    const passSwaps = state.passSwaps + Number(swapped);
    const passEnded = index === 3 - state.settledCount;
    let settledCount = state.settledCount, pass = state.pass;
    let pairIndex = index + 1, nextPassSwaps = passSwaps, done = false;
    const completedPasses = state.completedPasses.slice();
    if (passEnded) {
      settledCount++;
      completedPasses.push({pass, comparisons: 5 - pass, swaps: passSwaps,
        fixedValue: values[5 - settledCount]});
      done = passSwaps === 0 || settledCount === 4;
      if (done) pairIndex = null;
      else { pass++; pairIndex = 0; nextPassSwaps = 0; }
    }
    const snapshot = {pass: state.pass, pairIndex: index, left, right, swapped,
      after: values.slice(), passEnded, earlyStop: passEnded && passSwaps === 0};
    return {initial: state.initial.slice(), values, pass, pairIndex, settledCount,
      comparisons: state.comparisons + 1, swaps: state.swaps + Number(swapped),
      passSwaps: nextPassSwaps, history: state.history.concat(snapshot),
      completedPasses, last: snapshot, done};
  }

  return {PRESETS, createState, step};
});
