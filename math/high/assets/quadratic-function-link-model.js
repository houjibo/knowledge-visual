(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  if (root) root.KVQuadraticFunctionLinkModel = model;
})(typeof window !== 'undefined' ? window : null, function () {
  const regionLabels = Object.freeze({
    outside: '两根外侧', inside: '两根之间', except: '除切点外全体实数',
    all: '全体实数', none: '空集'
  });
  const scenarios = [
    {id:'two-up', title:'两交点 · 向上', a:1, b:-2, c:-3},
    {id:'two-down', title:'两交点 · 向下', a:-1, b:2, c:3},
    {id:'tangent-up', title:'一个切点 · 向上', a:1, b:-2, c:1},
    {id:'tangent-down', title:'一个切点 · 向下', a:-1, b:2, c:-1},
    {id:'none-up', title:'无交点 · 向上', a:1, b:0, c:1},
    {id:'none-down', title:'无交点 · 向下', a:-1, b:0, c:-1},
    {id:'garden', title:'菜地面积 · 从情境列式', a:-1, b:5, c:-4,
      context:'长方形菜地两边分别为 x 米和 (5−x) 米，0<x<5。要求面积大于 4 平方米。先选表示条件的不等式，再判断实零点和解集。',
      model:'area-greater'}
  ];

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) [a, b] = [b, a % b];
    return a || 1;
  }
  function fraction(numerator, denominator) {
    if (denominator < 0) { numerator = -numerator; denominator = -denominator; }
    const divisor = gcd(numerator, denominator);
    numerator /= divisor; denominator /= divisor;
    return denominator === 1 ? String(numerator) : `${numerator}/${denominator}`;
  }
  function polynomial(a, b, c) {
    const ax = a === 1 ? 'x²' : a === -1 ? '−x²' : `${a}x²`;
    const bx = b === 0 ? '' : ` ${b < 0 ? '−' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x`;
    const constant = c === 0 ? '' : ` ${c < 0 ? '−' : '+'} ${Math.abs(c)}`;
    return ax + bx + constant;
  }
  function analyze(a, b, c) {
    if (![a,b,c].every(value => Number.isFinite(value) && Math.abs(value) <= 100 && Number.isInteger(value * 2)) || a === 0) {
      throw new RangeError('a、b、c 须为绝对值不超过 100 的半整数，且 a≠0');
    }
    const A = a * 2, B = b * 2, C = c * 2;
    const D = B * B - 4 * A * C;
    const discriminant = D / 4;
    const rootCount = D > 0 ? 2 : D === 0 ? 1 : 0;
    let roots = [], labels = [], region, solution, type;
    if (D > 0) {
      const root1 = (-b - Math.sqrt(discriminant)) / (2 * a);
      const root2 = (-b + Math.sqrt(discriminant)) / (2 * a);
      roots = [Math.min(root1, root2), Math.max(root1, root2)];
      const center = A > 0 ? -B : B;
      const denominator = 2 * Math.abs(A);
      const squareRoot = Math.sqrt(D);
      labels = Number.isInteger(squareRoot)
        ? [fraction(center - squareRoot, denominator), fraction(center + squareRoot, denominator)]
        : [`(${center}−√${D})/${denominator}`, `(${center}+√${D})/${denominator}`];
      region = a > 0 ? 'outside' : 'inside';
      solution = a > 0 ? `(-∞, ${labels[0]}) ∪ (${labels[1]}, +∞)` : `(${labels[0]}, ${labels[1]})`;
      type = 'two';
    } else if (D === 0) {
      roots = [-b / (2 * a)];
      labels = [fraction(-B, 2 * A)];
      region = a > 0 ? 'except' : 'none';
      solution = a > 0 ? `{x∈ℝ | x≠${labels[0]}}` : '∅';
      type = 'equal';
    } else {
      region = a > 0 ? 'all' : 'none';
      solution = a > 0 ? 'ℝ' : '∅';
      type = 'empty';
    }
    return {a,b,c, polynomial:polynomial(a,b,c), discriminant, rootCount, roots, labels,
      region, regionLabel:regionLabels[region], solution, type};
  }
  function getScenario(id) { return scenarios.find(scenario => scenario.id === id); }
  function checkScenario(id, modelChoice, rootCountChoice, regionChoice) {
    const scenario = getScenario(id);
    if (!scenario) throw new RangeError('未知任务');
    const state = analyze(scenario.a, scenario.b, scenario.c);
    if (!['0','1','2'].includes(rootCountChoice) || !Object.hasOwn(regionLabels, regionChoice)
        || (scenario.model && !['area-greater','area-less','perimeter-greater'].includes(modelChoice))) {
      return {status:'incomplete', feedback:'先选情境中的不等式（若有）、实零点个数和正值区间形态。', ...state};
    }
    const correct = Number(rootCountChoice) === state.rootCount && regionChoice === state.region
      && (!scenario.model || modelChoice === scenario.model);
    const roots = state.rootCount === 0 ? '无实零点' : `实零点为 ${state.labels.join('、')}`;
    const context = scenario.model
      ? '面积条件应列为 x(5−x)>4，化为 −x²+5x−4>0；实际边长还要求 0<x<5，所得 1<x<4 已在范围内。'
      : '';
    const feedback = `${correct ? '正确。' : `应为 ${state.rootCount} 个实零点，正值区间形态为“${state.regionLabel}”。`}`
      + `令 f(x)=${state.polynomial}，则 f(x)=0 的判别式 Δ=${state.discriminant}，${roots}。`
      + `方程的根就是函数与 x 轴的交点；f(x)>0 对应图象在 x 轴上方，解集为 ${state.solution}。${context}`;
    return {status:correct ? 'correct' : 'wrong', feedback, ...state};
  }
  return {analyze, polynomial, scenarios, getScenario, checkScenario, regionLabels};
});
