(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  if (root) root.KVInequalityContext = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const scenarios = Object.freeze([
    Object.freeze({id:'budget-exact', label:'买笔记本 · 恰好用完预算',
      story:'活动需先支付固定费用 3 元，再以每本 4 元购买笔记本；无论买几本，费用都要支付，预算不超过 23 元。设 x 为购买的本数，最多能买多少本？',
      coefficient:4, fixed:3, relation:'le', limit:23, kind:'max', unit:'本'}),
    Object.freeze({id:'budget-fraction', label:'买笔记本 · 预算不能买半本',
      story:'活动需先支付固定费用 3 元，再以每本 4 元购买笔记本；无论买几本，费用都要支付，预算不超过 22 元。设 x 为购买的本数，最多能买多少本？',
      coefficient:4, fixed:3, relation:'le', limit:22, kind:'max', unit:'本'}),
    Object.freeze({id:'target-fraction', label:'收集物资 · 达到最低目标',
      story:'已有 5 个物资，每箱增加 4 个，至少需要 24 个。设 x 为增加的箱数，最少需要多少箱？',
      coefficient:4, fixed:5, relation:'ge', limit:24, kind:'min', unit:'箱'})
  ]);
  function getScenario(id) { return scenarios.find(s => s.id === id) || null; }
  function integer(value) {
    if (typeof value !== 'string' || !/^(0|[1-9]\d*)$/.test(value)) return null;
    const n = Number(value);
    return Number.isSafeInteger(n) ? n : null;
  }
  function checkExpression(s, coefficient, fixed, relation, limit) {
    if (!s) return false;
    return integer(coefficient) === s.coefficient && integer(fixed) === s.fixed &&
      relation === s.relation && integer(limit) === s.limit;
  }
  function trial(s, value) {
    const n = integer(value);
    if (!s || n === null || n > 10) return null;
    const total = s.coefficient * n + s.fixed;
    return {n, total, meets:s.relation === 'le' ? total <= s.limit : total >= s.limit};
  }
  function boundary(s) {
    if (!s) return null;
    const numerator = s.limit - s.fixed;
    return s.kind === 'max' ? Math.floor(numerator / s.coefficient) : Math.ceil(numerator / s.coefficient);
  }
  return {scenarios, getScenario, integer, checkExpression, trial, boundary};
});
