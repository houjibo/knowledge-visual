(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.StackQueueModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const TOKENS = Object.freeze(['A', 'B', 'C', 'D', 'E', 'F']);

  function create() {
    return {stack: [], queue: [], nextIndex: 0, firstCorrect: false,
      addedAfterFirst: false, complete: false};
  }

  function add(state) {
    if (state.nextIndex >= TOKENS.length) return {state, error: 'exhausted'};
    const token = TOKENS[state.nextIndex];
    return {state: {
      stack: [...state.stack, token], queue: [...state.queue, token],
      nextIndex: state.nextIndex + 1, firstCorrect: state.firstCorrect,
      addedAfterFirst: state.addedAfterFirst || state.firstCorrect,
      complete: state.complete
    }, token};
  }

  function remove(state, stackPrediction, queuePrediction) {
    if (!state.stack.length || !state.queue.length) return {state, error: 'empty'};
    if (!TOKENS.includes(stackPrediction) || !TOKENS.includes(queuePrediction))
      return {state, error: 'prediction'};
    const stackToken = state.stack[state.stack.length - 1];
    const queueToken = state.queue[0];
    const correct = stackPrediction === stackToken && queuePrediction === queueToken;
    const firstCorrect = state.firstCorrect || (correct && state.stack.length >= 3);
    return {state: {
      stack: state.stack.slice(0, -1), queue: state.queue.slice(1),
      nextIndex: state.nextIndex, firstCorrect,
      addedAfterFirst: state.addedAfterFirst,
      complete: state.complete || (state.firstCorrect && state.addedAfterFirst && correct)
    }, stackToken, queueToken, correct};
  }

  return {TOKENS, create, add, remove};
});
