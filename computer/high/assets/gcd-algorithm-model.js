(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HighGcdAlgorithmModel = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const MAX_INPUT = 999;
  const MAX_STEPS = 1000;
  const MAX_DRAFT_STEPS = 12;
  const EXPECTED = Object.freeze({
    condition: 'while-b-nonzero',
    remainder: 'save-remainder',
    updateA: 'assign-old-b',
    updateB: 'assign-remainder',
    output: 'return-a'
  });

  function validateInput(a, b) {
    if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b) || a < 0 || b < 0 || a > MAX_INPUT || b > MAX_INPUT) {
      return {valid: false, reason: `请输入 0 至 ${MAX_INPUT} 之间的整数。`};
    }
    if (a === 0 && b === 0) return {valid: false, reason: '(0, 0) 不在本练习定义域内。'};
    return {valid: true, reason: ''};
  }

  function validateConstruction(choices) {
    if (!choices || typeof choices !== 'object' || Array.isArray(choices)) {
      return {valid: false, errors: ['请先选择每个算法步骤。']};
    }
    const errors = [];
    if (choices.condition !== EXPECTED.condition) errors.push('循环应在 b 不等于 0 时继续。');
    if (choices.remainder !== EXPECTED.remainder) errors.push('先把 a 除以 b 的余数保存到临时变量 r。');
    if (choices.updateA !== EXPECTED.updateA) errors.push('更新 a 前要保留旧 b；令 a 接收旧 b。');
    if (choices.updateB !== EXPECTED.updateB) errors.push('令 b 接收刚保存的余数 r，不能先覆盖 r。');
    if (choices.output !== EXPECTED.output) errors.push('循环结束时应输出 a。');
    return {valid: errors.length === 0, errors};
  }

  function runEuclid(a, b) {
    const validation = validateInput(a, b);
    if (!validation.valid) throw new RangeError(validation.reason);
    const trace = [];
    let left = a;
    let right = b;
    let operations = 0;
    while (right !== 0) {
      if (operations >= MAX_STEPS) return {gcd: null, terminated: false, reason: '已达到算法步数上限。', operations, trace};
      const remainder = left % right;
      const nextLeft = right;
      const nextRight = remainder;
      trace.push({kind: 'remainder', iteration: operations + 1, a: left, b: right, remainder, nextA: nextLeft, nextB: nextRight});
      left = nextLeft;
      right = nextRight;
      operations++;
    }
    trace.push({kind: 'stop', a: left, b: right});
    return {gcd: left, terminated: true, operations, trace};
  }

  function runSubtraction(a, b) {
    const validation = validateInput(a, b);
    if (!validation.valid) throw new RangeError(validation.reason);
    if (a === 0 || b === 0) throw new RangeError('重复相减对照只用于两个正整数。');
    let left = a;
    let right = b;
    let operations = 0;
    const trace = [];
    while (left !== right) {
      if (operations >= MAX_STEPS) return {gcd: null, terminated: false, operations, trace};
      const oldA = left;
      const oldB = right;
      if (left > right) left -= right;
      else right -= left;
      operations++;
      if (trace.length < 12) trace.push({kind: 'subtract', iteration: operations, oldA, oldB, a: left, b: right});
    }
    return {gcd: left, terminated: true, operations, trace, omitted: Math.max(0, operations - trace.length)};
  }

  function runFixedDraft(a, b) {
    const validation = validateInput(a, b);
    if (!validation.valid) throw new RangeError(validation.reason);
    let left = a;
    let right = b;
    const trace = [];
    const seen = new Set();
    for (let step = 1; step <= MAX_DRAFT_STEPS; step++) {
      const beforeA = left;
      const beforeB = right;
      const state = `${beforeA},${beforeB}`;
      if (beforeA === beforeB) return {terminated: true, result: beforeA, operations: step - 1, trace, repeatedState: false};
      const repeatedState = seen.has(state);
      seen.add(state);
      if (left > right) left -= right;
      else right -= left;
      trace.push({step, beforeA, beforeB, a: left, b: right, repeatedState});
      if (repeatedState || (left === beforeA && right === beforeB)) {
        return {terminated: false, result: null, operations: step, trace, repeatedState: true};
      }
    }
    return {terminated: false, result: null, operations: MAX_DRAFT_STEPS, trace, repeatedState: seen.has(`${left},${right}`)};
  }

  function compareAlgorithms(a, b) {
    const euclid = runEuclid(a, b);
    const subtraction = runSubtraction(a, b);
    return {a, b, gcd: euclid.gcd, euclid, subtraction, sameResult: euclid.gcd === subtraction.gcd};
  }

  return {MAX_INPUT, MAX_STEPS, MAX_DRAFT_STEPS, EXPECTED, validateInput, validateConstruction, runEuclid, runSubtraction, runFixedDraft, compareAlgorithms};
});
