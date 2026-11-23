/* Finite comparison task for equality and inequality transformations. */
(function (root, factory) {
  'use strict';
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.KVInequalityFoundationsModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const starts = Object.freeze({equal: Object.freeze({a: 2, b: 2}), greater: Object.freeze({a: 3, b: 1})});
  const multipliers = Object.freeze([-2, 0, 2]);

  function sign(a, b) { return a < b ? '<' : a > b ? '>' : '='; }

  function evaluate(start, operation, c) {
    if (!Object.hasOwn(starts, start) || !['add', 'multiply'].includes(operation) || !multipliers.includes(c)) {
      throw new RangeError('未知的起点、运算或操作数');
    }
    const {a, b} = starts[start];
    const left = operation === 'add' ? a + c : a * c;
    const right = operation === 'add' ? b + c : b * c;
    let reason;
    if (start === 'equal') reason = '两边原本相等；同加或同乘一个数后仍相等。';
    else if (operation === 'add') reason = '两边同加一个数，差值不变，大小方向不变。';
    else if (c < 0) reason = '两边同乘负数，大小方向反转。';
    else if (c === 0) reason = '两边同乘零，都变成零，严格不等关系变成相等。';
    else reason = '两边同乘正数，大小方向不变。';
    return {a, b, c, operation, left, right, before: sign(a, b), after: sign(left, right), reason};
  }

  function check(start, operation, c, prediction) {
    const state = evaluate(start, operation, c);
    if (prediction === '') return {status: 'incomplete', feedback: '请先预测变换后的关系。', ...state};
    if (!['<', '=', '>'].includes(prediction)) throw new RangeError('未知的关系符号');
    const expression = operation === 'add' ? `(${state.a})+(${c}) ${state.after} (${state.b})+(${c})`
      : `(${state.a})×(${c}) ${state.after} (${state.b})×(${c})`;
    const detail = `${expression}，即 ${state.left} ${state.after} ${state.right}。${state.reason}`;
    return {status: prediction === state.after ? 'correct' : 'wrong',
      feedback: `${prediction === state.after ? '正确。' : `应为 ${state.after}。`}${detail}`, ...state};
  }
  return {starts, multipliers, evaluate, check};
});
