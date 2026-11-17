/* Finite-domain truth and evidence for ∀, ∃ and their negations. */
(function (root, factory) {
  const conditions = typeof module === 'object' && module.exports
    ? require('./logic-conditions-model.js') : root.KVLogicConditionsModel;
  const model = factory(conditions);
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.KVLogicQuantifiersModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (conditions) {
  'use strict';
  if (!conditions) throw new Error('条件目录未加载');
  const presets = Object.freeze({
    all: {title: '全真：偶数集合', domain: [-6, -4, -2, 0, 2, 4, 6], predicate: 'even'},
    mixed: {title: '混合：−2 至 2 中的正数', domain: [-2, -1, 0, 1, 2], predicate: 'positive'},
    none: {title: '全假：奇数集合中的偶数', domain: [1, 3, 5], predicate: 'even'},
    empty: {title: '空域：没有候选整数', domain: [], predicate: 'positive'}
  });

  function pick(values) {
    return values.find(n => n > 0) ?? values.find(n => n === 0) ?? values[0] ?? null;
  }
  function evaluate(domain, predicateId) {
    if (!Array.isArray(domain) || !conditions.predicates[predicateId]) throw new TypeError('无效的讨论域或条件');
    if (domain.some(n => !Number.isInteger(n) || !conditions.universe.includes(n)) || new Set(domain).size !== domain.length) {
      throw new RangeError('讨论域须由 −6 至 6 的互异整数组成');
    }
    const values = [...domain].sort((a, b) => a - b);
    const matches = values.filter(conditions.predicates[predicateId].test);
    const nonmatches = values.filter(n => !conditions.predicates[predicateId].test(n));
    const forall = nonmatches.length === 0;
    const exists = matches.length > 0;
    return {
      domain: values, matches, nonmatches,
      forall, exists,
      notForall: !forall, notExists: !exists,
      existsNot: nonmatches.length > 0,
      forallNot: matches.length === 0,
      universalCounterexample: pick(nonmatches),
      existentialWitness: pick(matches)
    };
  }
  return {universe: conditions.universe, predicates: conditions.predicates, presets, evaluate};
});
