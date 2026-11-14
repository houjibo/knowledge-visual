/* Finite universe and complement model for the high-school sets page. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.KVSetComplementModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const domain = Object.freeze([1, 2, 3, 4, 5, 6]);
  const presets = Object.freeze({
    small: {universe: [1, 2, 3, 4], setA: [2, 4]},
    large: {universe: [1, 2, 3, 4, 5, 6], setA: [2, 4]},
    all: {universe: [1, 2, 3, 4], setA: [1, 2, 3, 4]},
    empty: {universe: [1, 2, 3, 4], setA: []}
  });

  function membersOf(values, name) {
    if (!Array.isArray(values) || values.some(n => !Number.isInteger(n) || !domain.includes(n)) ||
        new Set(values).size !== values.length) {
      throw new Error(`${name} 必须是不重复的候选整数`);
    }
    return [...values].sort((a, b) => a - b);
  }

  function stateFor(universe, setA) {
    const u = membersOf(universe, 'U');
    const a = membersOf(setA, 'A');
    if (!u.length) throw new Error('本练习的全集 U 至少要有一个对象');
    if (a.some(n => !u.includes(n))) throw new Error('A 必须是 U 的子集');
    const complement = u.filter(n => !a.includes(n));
    return {universe: u, setA: a, complement, isEmpty: complement.length === 0};
  }

  function formatSet(values) {
    return values.length ? `{${values.join(', ')}}` : '∅';
  }

  function checkPrediction(universe, setA, prediction, emptyChoice) {
    const state = stateFor(universe, setA);
    const chosen = membersOf(prediction, '补集预测');
    if (chosen.some(n => !state.universe.includes(n))) throw new Error('补集预测只能选 U 中的对象');
    if (emptyChoice == null) return {status: 'incomplete', feedback: '先判断预测的补集是否为空集，再核对。'};
    if (emptyChoice !== 'empty' && emptyChoice !== 'nonempty') throw new Error('未知的空集判断');
    const missing = state.complement.filter(n => !chosen.includes(n));
    const extra = chosen.filter(n => !state.complement.includes(n));
    const emptyCorrect = (emptyChoice === 'empty') === state.isEmpty;
    const parts = [];
    if (missing.length) parts.push(`漏选补集元素 ${missing.join('、')}。`);
    if (extra.length) parts.push(`多选了 A 中的元素 ${extra.join('、')}。`);
    if (!emptyCorrect) parts.push(state.isEmpty ? 'U 中的对象都在 A 中，所以补集是空集。' : 'U 中仍有不属于 A 的对象，所以补集不是空集。');
    if (parts.length) return {status: 'wrong', missing, extra, emptyCorrect, feedback: parts.join(' ')};
    let reason;
    if (state.isEmpty) reason = 'A=U，U 中没有不属于 A 的对象，所以补集是空集。';
    else if (!state.setA.length) reason = 'A=∅，空的是 A；U 中每个对象都不属于 A，所以补集等于 U。';
    else reason = '补集只包含 U 中不属于 A 的对象；U 以外的对象不参与本次运算。';
    return {status: 'correct', missing, extra, emptyCorrect, complement: state.complement,
      feedback: `∁ᵤA = ${formatSet(state.complement)}。${reason}`};
  }

  return {domain, presets, stateFor, formatSet, checkPrediction};
});
