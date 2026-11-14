/* Finite set relations and operations for the high-school sets page. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.KVSetRelationsOperationsModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const domain = Object.freeze([1, 2, 3, 4, 5, 6]);
  const examples = Object.freeze({
    subset: {a: [1, 2], b: [1, 2, 3, 4]},
    equal: {a: [1, 2, 3], b: [3, 2, 1]},
    superset: {a: [1, 2, 3, 4], b: [2, 4]},
    incomparable: {a: [1, 2, 3], b: [2, 3, 4]},
    disjoint: {a: [1, 2], b: [4, 5]}
  });
  const relationNames = Object.freeze({equal: 'A=B', subset: 'A⊊B', superset: 'B⊊A', incomparable: '互不包含'});
  const operationNames = Object.freeze({intersection: 'A∩B', union: 'A∪B'});

  function membersOf(values, name) {
    if (!Array.isArray(values) || values.some(n => !Number.isInteger(n) || !domain.includes(n)) ||
        new Set(values).size !== values.length) throw new Error(`${name} 必须是不重复的候选整数`);
    return [...values].sort((x, y) => x - y);
  }

  function formatSet(values) {
    return values.length ? `{${values.join(', ')}}` : '∅';
  }

  function regionsFor(aValues, bValues) {
    const a = membersOf(aValues, 'A');
    const b = membersOf(bValues, 'B');
    const aOnly = a.filter(n => !b.includes(n));
    const bOnly = b.filter(n => !a.includes(n));
    const both = a.filter(n => b.includes(n));
    const outside = domain.filter(n => !a.includes(n) && !b.includes(n));
    const relation = !aOnly.length && !bOnly.length ? 'equal'
      : !aOnly.length ? 'subset'
      : !bOnly.length ? 'superset'
      : 'incomparable';
    return {a, b, aOnly, both, bOnly, outside, relation};
  }

  function checkWitness(value, region, name) {
    if (value == null || value === '') return null;
    if (value !== 'none' && (!Number.isInteger(value) || !domain.includes(value))) {
      throw new Error(`${name} 不是候选元素或“无”`);
    }
    return region.length ? region.includes(value) : value === 'none';
  }

  function checkRelation(aValues, bValues, selectedRelation, witnessA, witnessB) {
    const regions = regionsFor(aValues, bValues);
    if (selectedRelation == null || selectedRelation === '' || witnessA == null || witnessA === '' ||
        witnessB == null || witnessB === '') {
      return {status: 'incomplete', feedback: '先选关系，并为 A−B、B−A 两侧各选一个见证元素或“无”。'};
    }
    if (!Object.hasOwn(relationNames, selectedRelation)) throw new Error('未知集合关系');
    const witnessACorrect = checkWitness(witnessA, regions.aOnly, 'A−B 见证');
    const witnessBCorrect = checkWitness(witnessB, regions.bOnly, 'B−A 见证');
    const relationCorrect = selectedRelation === regions.relation;
    const feedback = [];
    if (!relationCorrect) feedback.push(`关系需重判：A−B=${formatSet(regions.aOnly)}，B−A=${formatSet(regions.bOnly)}。`);
    if (!witnessACorrect) feedback.push(regions.aOnly.length
      ? `A−B 中可举 ${regions.aOnly[0]}，它在 A 中而不在 B 中。`
      : 'A−B 为空，应选“无”。');
    if (!witnessBCorrect) feedback.push(regions.bOnly.length
      ? `B−A 中可举 ${regions.bOnly[0]}，它在 B 中而不在 A 中。`
      : 'B−A 为空，应选“无”。');
    if (feedback.length) return {status: 'wrong', relationCorrect, witnessACorrect, witnessBCorrect,
      feedback: feedback.join(' ')};
    let reason;
    if (regions.relation === 'equal') reason = 'A−B 与 B−A 都为空，两集合成员完全相同；A⊆B 且 B⊆A。';
    else if (regions.relation === 'subset') reason = 'A−B 为空，而 B−A 非空；A 的每个元素都在 B 中，B 还有额外元素。';
    else if (regions.relation === 'superset') reason = 'B−A 为空，而 A−B 非空；B 的每个元素都在 A 中，A 还有额外元素。';
    else reason = 'A−B 与 B−A 都非空；两边各有对方没有的元素。';
    return {status: 'correct', relation: regions.relation, feedback: `${relationNames[regions.relation]}。${reason}`};
  }

  function operationFor(aValues, bValues, operation) {
    const regions = regionsFor(aValues, bValues);
    if (!Object.hasOwn(operationNames, operation)) throw new Error('未知集合运算');
    const result = operation === 'intersection' ? regions.both
      : domain.filter(n => regions.a.includes(n) || regions.b.includes(n));
    return {...regions, operation, result};
  }

  function membershipReason(n, state) {
    const inA = state.a.includes(n);
    const inB = state.b.includes(n);
    if (inA && inB) return '同时在 A、B 中';
    if (inA) return '只在 A 中';
    if (inB) return '只在 B 中';
    return '既不在 A 也不在 B 中';
  }

  function checkOperation(aValues, bValues, operation, prediction) {
    const a = membersOf(aValues, 'A');
    const b = membersOf(bValues, 'B');
    const chosen = membersOf(prediction, '结果预测');
    if (operation == null || operation === '') return {status: 'incomplete', feedback: '先选择交集或并集，再核对结果。'};
    const state = operationFor(a, b, operation);
    const missing = state.result.filter(n => !chosen.includes(n));
    const extra = chosen.filter(n => !state.result.includes(n));
    if (missing.length || extra.length) {
      const explanations = [
        ...missing.map(n => `漏选 ${n}：${membershipReason(n, state)}，应进入${operation === 'intersection' ? '交集' : '并集'}。`),
        ...extra.map(n => `多选 ${n}：${membershipReason(n, state)}，不应进入${operation === 'intersection' ? '交集' : '并集'}。`)
      ];
      return {status: 'wrong', missing, extra, feedback: explanations.join(' ')};
    }
    const details = domain.map(n => `${n} ${membershipReason(n, state)}，${state.result.includes(n) ? '选入' : '不选'}`).join('；');
    return {status: 'correct', result: state.result,
      feedback: `${operationNames[operation]}=${formatSet(state.result)}。逐元素：${details}。`};
  }

  return {domain, examples, relationNames, operationNames, formatSet, regionsFor, checkRelation,
    operationFor, checkOperation};
});
