/* Finite integer evidence for necessary and sufficient conditions. */
(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.KVLogicConditionsModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const universe = Object.freeze(Array.from({length: 13}, (_, index) => index - 6));
  const predicates = Object.freeze({
    mult6: {label: 'n 是 6 的倍数', test: n => n % 6 === 0},
    mult3: {label: 'n 是 3 的倍数', test: n => n % 3 === 0},
    mult2and3: {label: 'n 同时是 2 和 3 的倍数', test: n => n % 2 === 0 && n % 3 === 0},
    even: {label: 'n 是偶数', test: n => n % 2 === 0},
    mult2: {label: 'n 可写成 2k（k 为整数）', test: n => n % 2 === 0},
    positive: {label: 'n > 0', test: n => n > 0},
    nonnegative: {label: 'n ≥ 0', test: n => n >= 0},
    square1: {label: 'n² = 1', test: n => n * n === 1},
    one: {label: 'n = 1', test: n => n === 1}
  });
  const presets = Object.freeze({
    property: {
      title: '性质定理：6 的倍数必为 3 的倍数', p: 'mult6', q: 'mult3',
      proof: '对任意整数 n，若 n=6k，则 n=3(2k)，所以“3 的倍数”是“6 的倍数”的必要条件。逆向不成立，例如 3 是 3 的倍数却不是 6 的倍数。'
    },
    criterion: {
      title: '判定定理：同时被 2、3 整除即可被 6 整除', p: 'mult2and3', q: 'mult6',
      proof: '对任意整数 n，若 n=2k 且 3 整除 n，因 2 与 3 互素，3 整除 k，故 n=6m；反过来 6m 同时被 2 和 3 整除。这一判定条件在整数中也必要。'
    },
    definition: {
      title: '定义：偶数与“可写成 2k”', p: 'even', q: 'mult2',
      proof: '偶数按定义就是可写为 2k（k 为整数）的数；两句话相互推出，因此定义给出充要条件。'
    }
  });

  function evaluate(domain, pId, qId) {
    if (!Array.isArray(domain) || !predicates[pId] || !predicates[qId]) throw new TypeError('无效的讨论域或条件');
    if (domain.some(n => !Number.isInteger(n) || !universe.includes(n)) || new Set(domain).size !== domain.length) {
      throw new RangeError('讨论域须由 −6 至 6 的互异整数组成');
    }
    const values = [...domain].sort((a, b) => a - b);
    const pMembers = values.filter(predicates[pId].test);
    const qMembers = values.filter(predicates[qId].test);
    const forwardExamples = values.filter(n => predicates[pId].test(n) && !predicates[qId].test(n));
    const reverseExamples = values.filter(n => predicates[qId].test(n) && !predicates[pId].test(n));
    function witness(candidates) {
      return candidates.find(n => n > 0) ?? candidates.find(n => n === 0) ?? candidates[0] ?? null;
    }
    const forward = forwardExamples.length === 0;
    const reverse = reverseExamples.length === 0;
    return {
      domain: values, pMembers, qMembers,
      forward, reverse, biconditional: forward && reverse,
      forwardCounterexample: witness(forwardExamples),
      reverseCounterexample: witness(reverseExamples),
      pSufficientForQ: forward, pNecessaryForQ: reverse
    };
  }
  return {universe, predicates, presets, evaluate};
});
