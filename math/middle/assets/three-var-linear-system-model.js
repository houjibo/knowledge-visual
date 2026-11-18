/* Optional three-variable linear system: two-step elimination to one variable. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.KVThreeVarLinearSystemModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function deepFreeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.freeze(value);
      for (const child of Object.values(value)) deepFreeze(child);
    }
    return value;
  }

  const task = deepFreeze({
    id: 'optional-three-var-linear-system',
    title: '三元一次方程组（选学）',
    boundary: '选学内容，不作为考试要求；本页为本地固定脚本，不连接外部服务、不发送网络请求。'
  });

  // Fixed integer-coefficient cases, each with a unique integer reference solution.
  const cases = deepFreeze([
    {
      id: 'case-1',
      equations: [
        {id: 'e1', a: 1, b: 1, c: 1, rhs: 6},
        {id: 'e2', a: 2, b: -1, c: 1, rhs: 3},
        {id: 'e3', a: 1, b: 2, c: -1, rhs: 2}
      ],
      solution: {x: 1, y: 2, z: 3},
      steps: [
        '① x + y + z = 6，② 2x − y + z = 3，③ x + 2y − z = 2',
        '① + ②：3x + 2z = 9（消去 y）；② ×2 + ③：5x + z = 8',
        '由 5x + z = 8 与 3x + 2z = 9 再消元，解得 x = 1，z = 3',
        '回代 ①：1 + y + 3 = 6 → y = 2',
        '检验：② 2×1 − 2 + 3 = 3 ✓，③ 1 + 4 − 3 = 2 ✓',
        '解：x = 1，y = 2，z = 3'
      ]
    },
    {
      id: 'case-2',
      equations: [
        {id: 'e1', a: 1, b: 1, c: 1, rhs: 2},
        {id: 'e2', a: 3, b: 2, c: 1, rhs: 5},
        {id: 'e3', a: 1, b: -1, c: 2, rhs: 5}
      ],
      solution: {x: 2, y: -1, z: 1},
      steps: [
        '① x + y + z = 2，② 3x + 2y + z = 5，③ x − y + 2z = 5',
        '② − ①：2x + y = 3（消去 z）；① ×2 − ③：x + 3y = −1',
        '联立 2x + y = 3 与 x + 3y = −1，解得 x = 2，y = −1',
        '回代 ①：2 + (−1) + z = 2 → z = 1',
        '检验：② 6 − 2 + 1 = 5 ✓，③ 2 + 1 + 2 = 5 ✓',
        '解：x = 2，y = −1，z = 1'
      ]
    },
    {
      id: 'case-3',
      equations: [
        {id: 'e1', a: 2, b: 1, c: 1, rhs: 9},
        {id: 'e2', a: 1, b: 1, c: -1, rhs: 2},
        {id: 'e3', a: 1, b: -2, c: 3, rhs: 7}
      ],
      solution: {x: 3, y: 1, z: 2},
      steps: [
        '① 2x + y + z = 9，② x + y − z = 2，③ x − 2y + 3z = 7',
        '① + ②：3x + 2y = 11（消去 z）；② ×3 + ③：4x + y = 13',
        '联立 3x + 2y = 11 与 4x + y = 13，解得 x = 3，y = 1',
        '回代 ②：3 + 1 − z = 2 → z = 2',
        '检验：① 6 + 1 + 2 = 9 ✓，③ 3 − 2 + 6 = 7 ✓',
        '解：x = 3，y = 1，z = 2'
      ]
    }
  ]);

  const CASE_IDS = cases.map(c => c.id);

  function isSafeInteger(value) {
    return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value);
  }

  function checkSolution(caseId, answer) {
    if (!CASE_IDS.includes(caseId)) {
      throw new RangeError(`unknown case: ${caseId}`);
    }
    if (!answer || typeof answer !== 'object') {
      return deepFreeze({status: 'invalid', feedback: '请填写 x、y、z 三个整数。'});
    }
    const {x, y, z} = answer;
    if (![x, y, z].every(isSafeInteger)) {
      return deepFreeze({status: 'invalid', feedback: '三个未知数都必须是有效整数，不能留空或输入非数字内容。'});
    }
    const target = cases.find(c => c.id === caseId).solution;
    if (x === target.x && y === target.y && z === target.z) {
      return deepFreeze({status: 'correct', feedback: '三个未知数都正确，消元化归成立。'});
    }
    const wrong = [];
    if (x !== target.x) wrong.push('x');
    if (y !== target.y) wrong.push('y');
    if (z !== target.z) wrong.push('z');
    return deepFreeze({
      status: 'wrong',
      feedback: `至少一项不正确：${wrong.join('、')}。请按消元步骤重新检查。`
    });
  }

  function getCase(caseId) {
    const found = cases.find(c => c.id === caseId);
    return found ? deepFreeze(JSON.parse(JSON.stringify(found))) : null;
  }

  return deepFreeze({task, cases, checkSolution, getCase});
});
