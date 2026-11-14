/* Finite set-language tasks for the high-school sets page. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.KVSetLanguageModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const universe = Object.freeze([1, 2, 3, 4, 5, 6]);
  const rounds = Object.freeze([
    {
      id: 'natural-even', kind: 'natural', targetName: 'A',
      source: '自然语言：A 是全集 U 中不大于 4 的偶数组成的集合。',
      targetPrompt: '哪种符号条件表示 A？',
      members: [2, 4],
      options: [
        {id: 'even-at-most-four', text: 'A = {x∈U | x 是偶数且 x≤4}', correct: true},
        {id: 'even-at-least-four', text: 'A = {x∈U | x 是偶数且 x≥4}', reason: '“不大于 4”包括小于或等于 4，而不是大于或等于 4。'},
        {id: 'odd-at-most-four', text: 'A = {x∈U | x 是奇数且 x≤4}', reason: '题目限定偶数，奇数不属于 A。'}
      ],
      explanation: '2 和 4 同时满足“偶数”与“不大于 4”；预览圆内、列举结果和符号条件一致。'
    },
    {
      id: 'symbol-multiples', kind: 'symbol', targetName: 'B',
      source: '符号语言：B = {x∈U | x 是 3 的倍数}。',
      targetPrompt: '哪句话用自然语言准确描述 B？',
      members: [3, 6],
      options: [
        {id: 'multiples-three', text: 'B 是 U 中能被 3 整除的数构成的集合。', correct: true},
        {id: 'at-most-three', text: 'B 是 U 中不大于 3 的数构成的集合。', reason: '“3 的倍数”是整除条件，不是大小条件。'},
        {id: 'odd', text: 'B 是 U 中所有奇数组成的集合。', reason: '3 是奇数，但 6 也是 3 的倍数。'}
      ],
      explanation: 'U 中能被 3 整除的是 3 和 6；符号条件、自然描述和预览图对应。'
    },
    {
      id: 'venn-intersection', kind: 'venn', targetName: 'A∩B',
      source: '图形语言：观察 Venn 图，求 A 与 B 的交集。',
      targetPrompt: '哪种符号结果与交叠区域对应？',
      venn: {a: [1, 2, 4], b: [2, 4, 6]},
      options: [
        {id: 'intersection', text: 'A∩B = {2, 4}', correct: true},
        {id: 'union', text: 'A∩B = {1, 2, 4, 6}', reason: '1 和 6 分别只在一个圆中；这组数是并集，不是交集。'},
        {id: 'outer-only', text: 'A∩B = {1, 6}', reason: '1 和 6 在不重叠的两侧，交集只取两个圆共同的元素。'}
      ],
      explanation: '2 和 4 同时位于 A、B 两个圆内；1 只在 A 中，6 只在 B 中。'
    }
  ]);

  function roundFor(id) {
    const found = rounds.find(round => round.id === id);
    if (!found) throw new Error('未知集合转换题');
    return found;
  }

  function regionsFor(id) {
    const round = roundFor(id);
    if (!round.venn) throw new Error('当前题没有双集合 Venn 图');
    const a = round.venn.a;
    const b = round.venn.b;
    return {
      aOnly: universe.filter(n => a.includes(n) && !b.includes(n)),
      both: universe.filter(n => a.includes(n) && b.includes(n)),
      bOnly: universe.filter(n => !a.includes(n) && b.includes(n)),
      outside: universe.filter(n => !a.includes(n) && !b.includes(n))
    };
  }

  function expectedFor(id) {
    const round = roundFor(id);
    return round.venn ? regionsFor(id).both : [...round.members];
  }

  function checkAnswer(id, chosenMembers, optionId) {
    const round = roundFor(id);
    if (!Array.isArray(chosenMembers) || chosenMembers.some(n => !Number.isInteger(n) || !universe.includes(n)) ||
        new Set(chosenMembers).size !== chosenMembers.length) throw new Error('集合元素必须是全集中的不重复整数');
    const option = round.options.find(item => item.id === optionId);
    if (!option) return {status: 'incomplete', feedback: '先选择一种目标表达，再核对。'};
    const expected = expectedFor(id);
    const missing = expected.filter(n => !chosenMembers.includes(n));
    const extra = chosenMembers.filter(n => !expected.includes(n)).sort((a, b) => a - b);
    const feedback = [];
    if (missing.length) feedback.push(`漏选 ${missing.join('、')}。`);
    if (extra.length) feedback.push(`多选 ${extra.join('、')}。`);
    if (!option.correct) feedback.push(`表达还需调整：${option.reason}`);
    if (!feedback.length) return {status: 'correct', missing, extra, optionCorrect: true, feedback: round.explanation};
    return {status: 'wrong', missing, extra, optionCorrect: !!option.correct, feedback: feedback.join(' ')};
  }

  return {universe, rounds, roundFor, regionsFor, expectedFor, checkAnswer};
});
