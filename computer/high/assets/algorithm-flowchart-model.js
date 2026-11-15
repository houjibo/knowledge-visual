(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HighAlgorithmFlowchartModel = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const EXPECTED = Object.freeze({
    initialize: 'start-at-zero',
    condition: 'test-index-before-length',
    compare: 'compare-equals-target',
    match: 'return-first-index',
    miss: 'advance-one-and-repeat',
    exhausted: 'report-not-found'
  });
  const TERMINATION_EXPLANATION = 'increment-reaches-bound';
  const CASES = Object.freeze([
    Object.freeze({id: 'first-duplicate', label: '第一次命中与重复值', values: Object.freeze([18, 42, 7, 42, 13]), target: 42, expectedIndex: 1, expectedComparisons: 2}),
    Object.freeze({id: 'last-match', label: '靠后命中', values: Object.freeze([18, 23, 7, 13, 42]), target: 42, expectedIndex: 4, expectedComparisons: 5}),
    Object.freeze({id: 'not-found', label: '目标不存在', values: Object.freeze([18, 42, 7, 13, 10]), target: 99, expectedIndex: null, expectedComparisons: 5})
  ]);
  const CASE_BY_ID = new Map(CASES.map(item => [item.id, item]));
  const MAX_VALUES = 50;

  function validateConstruction(choices) {
    const errors = [];
    if (!choices || typeof choices !== 'object' || Array.isArray(choices)) {
      return {valid: false, errors: ['请选择每个算法步骤。']};
    }
    for (const [step, expected] of Object.entries(EXPECTED)) {
      const selected = choices[step];
      if (selected !== expected) {
        const messages = {
          initialize: selected === 'start-at-one' ? '从索引 1 开始会漏掉列表第一项。' : '先把索引初始化为 0。',
          condition: selected === 'allow-index-equals-length' ? 'i 等于长度时已没有 A[i]，这里会越界。' : '需要在访问 A[i] 前判断 i 是否小于 n。',
          compare: '要把当前位置 A[i] 与目标值作相等比较。',
          match: '找到目标后应立即输出当前位置并结束，才能保证是第一次出现。',
          miss: '未命中时应让索引增加 1，再回到循环边界判断。',
          exhausted: '遍历到末尾仍未命中时，应输出未找到并结束。'
        };
        errors.push(messages[step]);
      }
    }
    return {valid: errors.length === 0, errors};
  }

  function validateTerminationExplanation(answer) {
    return answer === TERMINATION_EXPLANATION;
  }

  function getCase(caseId) {
    return CASE_BY_ID.get(caseId) || null;
  }

  function runSearch(values, target) {
    if (!Array.isArray(values) || values.length > MAX_VALUES || !values.every(Number.isSafeInteger) || !Number.isSafeInteger(target)) {
      throw new RangeError('Use a finite list of at most 50 safe integers and an integer target');
    }
    const trace = [];
    let index = 0;
    let foundIndex = null;
    let comparisons = 0;
    while (true) {
      const inBounds = index < values.length;
      trace.push({node: 'condition', index, length: values.length, passed: inBounds});
      if (!inBounds) {
        trace.push({node: 'not-found', index, length: values.length});
        break;
      }
      const value = values[index];
      const matched = value === target;
      comparisons++;
      trace.push({node: 'compare', index, value, target, matched});
      if (matched) {
        foundIndex = index;
        trace.push({node: 'found', index, value});
        break;
      }
      const previousIndex = index;
      index++;
      trace.push({node: 'increment', previousIndex, index});
    }
    return {
      found: foundIndex !== null,
      foundIndex,
      comparisons,
      iterations: comparisons,
      terminated: true,
      termination: foundIndex === null ? 'not-found' : 'found',
      trace
    };
  }

  function runCase(caseId, choices) {
    const construction = validateConstruction(choices);
    if (!construction.valid) throw new RangeError('Construct a valid algorithm before running a case');
    const scenario = getCase(caseId);
    if (!scenario) throw new RangeError('Unknown algorithm scenario');
    return {
      caseId: scenario.id,
      label: scenario.label,
      values: [...scenario.values],
      target: scenario.target,
      ...runSearch(scenario.values, scenario.target)
    };
  }

  return {EXPECTED, TERMINATION_EXPLANATION, CASES, MAX_VALUES, validateConstruction, validateTerminationExplanation, getCase, runSearch, runCase};
});
