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

  // Keep up to three decimal places as exact thousandths. The largest product
  // is 10^12 millionths, safely below Number.MAX_SAFE_INTEGER.
  function parseDecimal(value) {
    const raw = String(value).trim();
    if (!/^[+-]?\d+(?:\.\d{1,3})?$/.test(raw)) throw new RangeError('请输入至多三位小数的十进制数');
    const negative = raw.startsWith('-');
    const unsigned = raw.replace(/^[+-]/, '');
    const [whole, fraction = ''] = unsigned.split('.');
    const units = Number(whole) * 1000 + Number(fraction.padEnd(3, '0'));
    if (!Number.isSafeInteger(units) || units > 1000000) throw new RangeError('数值绝对值不能超过 1000');
    return negative ? -units : units;
  }

  function decimal(units, scale) {
    if (units === 0) return '0';
    const digits = scale === 1000 ? 3 : 6;
    const absolute = Math.abs(units);
    const whole = Math.floor(absolute / scale);
    const fraction = String(absolute % scale).padStart(digits, '0').replace(/0+$/, '');
    return `${units < 0 ? '−' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
  }

  function compareDifference(value) { return value < 0 ? '<' : value > 0 ? '>' : '='; }

  function evaluateOpen(aText, bText, cText, operation) {
    if (!['add', 'multiply'].includes(operation)) throw new RangeError('未知运算');
    const a = parseDecimal(aText), b = parseDecimal(bText), c = parseDecimal(cText);
    const scale = operation === 'add' ? 1000 : 1000000;
    const left = operation === 'add' ? a + c : a * c;
    const right = operation === 'add' ? b + c : b * c;
    const originalDifference = a - b;
    const difference = left - right;
    const formulaKey = operation === 'add' ? 'unchanged' : 'scaled';
    const formula = operation === 'add' ? '（a+c）−（b+c）=a−b' : 'ac−bc=c(a−b)';
    let reason;
    if (originalDifference === 0) reason = 'a=b 时原差为 0；两边同加或同乘任意实数后仍相等。';
    else if (operation === 'add') reason = '差值不变，所以严格不等号的方向不变。';
    else if (c === 0) reason = 'c=0 时新差为 0，两边都变为 0，严格不等关系变成相等。';
    else if (c < 0) reason = 'c<0 时新差与原差异号，严格不等号反向。';
    else reason = 'c>0 时新差与原差同号，严格不等号方向不变。';
    return {
      before: compareDifference(originalDifference), after: compareDifference(difference),
      left: decimal(left, scale), right: decimal(right, scale),
      originalDifference: decimal(originalDifference, 1000), difference: decimal(difference, scale),
      formulaKey, formula, reason
    };
  }

  function checkOpen(aText, bText, cText, operation, prediction, formulaChoice) {
    let state;
    try { state = evaluateOpen(aText, bText, cText, operation); }
    catch (error) {
      if (!(error instanceof RangeError)) throw error;
      return {status: 'invalid', feedback: `a、b、c 都须是绝对值不超过 1000、至多三位小数的十进制数。${error.message}。`};
    }
    if (!['<', '=', '>'].includes(prediction) || !['unchanged', 'scaled', 'shifted'].includes(formulaChoice)) {
      return {status: 'incomplete', feedback: '请先选择变换后的关系和差值通式。'};
    }
    const correct = prediction === state.after && formulaChoice === state.formulaKey;
    const correction = correct ? '正确。' : `关系应为 ${state.after}；差值通式应为 ${state.formula}。`;
    return {status: correct ? 'correct' : 'wrong',
      feedback: `${correction}原差 a−b=${state.originalDifference}；变换后 ${state.left} ${state.after} ${state.right}，差为 ${state.difference}。${state.formula}，这个恒等式适用于任意实数。${state.reason}`,
      ...state};
  }
  return {starts, multipliers, evaluate, check, parseDecimal, evaluateOpen, checkOpen};
});
