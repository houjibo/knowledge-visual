/* Enumerate subsets of a three-object universe, with feedback for learner choices. */
(function (root, factory) {
  'use strict';
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.KVSetSubsetsModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const objects = Object.freeze(['苹果', '梨', '桃']);
  const candidates = Object.freeze(Array.from({length: 8}, (_, mask) => mask));

  function validMask(mask) {
    if (!Number.isInteger(mask) || mask < 0 || mask > 7) throw new RangeError('集合必须属于三种水果的全集');
    return mask;
  }

  function members(mask) {
    validMask(mask);
    return objects.filter((_, index) => mask & (1 << index));
  }

  function format(mask) {
    const values = members(mask);
    return values.length ? `{${values.join('，')}}` : '∅';
  }

  function subsetsOf(mask) {
    validMask(mask);
    return candidates.filter(candidate => (candidate & mask) === candidate);
  }

  function check(mask, predictedCount, selected) {
    const expected = subsetsOf(mask);
    if (!Array.isArray(selected) || selected.some(candidate => !Number.isInteger(candidate) || !candidates.includes(candidate)) ||
        new Set(selected).size !== selected.length) throw new TypeError('所选子集编码无效');
    if (predictedCount === '') return {status: 'incomplete', feedback: '请先预测子集个数。'};
    if (!Number.isInteger(predictedCount) || predictedCount < 1 || predictedCount > 8) {
      throw new RangeError('预测个数须为 1 至 8');
    }
    const missing = expected.filter(candidate => !selected.includes(candidate));
    const extra = selected.filter(candidate => !expected.includes(candidate));
    const notes = [];
    if (predictedCount !== expected.length) notes.push(`个数应为 ${expected.length}：A 的每个元素都有“选入或不选入”两种选择。`);
    if (missing.length) notes.push(`漏选 ${missing.map(format).join('、')}；它们的每个元素都属于 A。`);
    if (extra.length) notes.push(...extra.map(candidate => {
      const outside = members(candidate & ~mask);
      return `误选 ${format(candidate)}：${outside.join('、')} 不属于 A。`;
    }));
    if (notes.length) return {status: 'wrong', missing, extra, feedback: notes.join(' ')};
    return {status: 'correct', expected,
      feedback: `正确：A=${format(mask)} 有 ${expected.length} 个子集。∅ 和 A 自身总是子集；只要子集不等于 A，它就是真子集。A=∅ 时两者是同一个子集。`};
  }

  return {objects, candidates, members, format, subsetsOf, check};
});
