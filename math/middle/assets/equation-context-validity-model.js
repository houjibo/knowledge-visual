(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  if (root) root.KVEquationContextValidity = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  // Candidate numbers are stored in halves, so both substitution and the
  // nonnegative-integer constraint can be checked without rounding.
  const cases = Object.freeze([
    Object.freeze({id:'whole', label:'材料采购 · 14 元',
      story:'活动先付固定费用 2 元，每件材料 3 元。现要恰好用完 14 元，能买几件？',
      equation:'3x + 2 = 14', coefficient:3, fixed:2, total:14, candidates:Object.freeze([6,8,10]), solution:8}),
    Object.freeze({id:'fraction', label:'材料采购 · 11 元',
      story:'活动先付固定费用 2 元，每件材料 2 元。现要恰好用完 11 元，能买几件？',
      equation:'2x + 2 = 11', coefficient:2, fixed:2, total:11, candidates:Object.freeze([8,9,10]), solution:9}),
    Object.freeze({id:'negative', label:'材料采购 · 1 元',
      story:'活动先付固定费用 3 元，每件材料 2 元。现要恰好用完 1 元，能买几件？',
      equation:'2x + 3 = 1', coefficient:2, fixed:3, total:1, candidates:Object.freeze([-2,0,2]), solution:-2})
  ]);
  function getCase(id) { return cases.find(item => item.id === id) || null; }
  function number(halves) { return Number.isInteger(halves) ? halves / 2 : null; }
  function display(halves) { const n = number(halves); return n === null ? '' : String(n).replace('-', '−'); }
  function inspect(item, halves) {
    if (!item || !item.candidates.includes(halves)) return null;
    const lhsHalves = item.coefficient * halves + 2 * item.fixed;
    return {lhs: lhsHalves / 2, equation: lhsHalves === 2 * item.total,
      allowed: halves >= 0 && halves % 2 === 0};
  }
  function actualSolution(item) {
    if (!item) return null;
    return item.candidates.find(value => { const r = inspect(item, value); return r.equation && r.allowed; }) ?? null;
  }
  return {cases, getCase, display, inspect, actualSolution};
});
