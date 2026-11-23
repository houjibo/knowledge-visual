(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  if (root) root.KVPiecewiseFunctionModel = model;
})(typeof window !== 'undefined' ? window : null, function () {
  const scenarios = Object.freeze([
    {
      id: 'shipping', title: '寄件重量分档收费', variable: 'w', inputUnit: '千克', outputUnit: '元',
      context: '寄一件重量不超过 5 千克的包裹：0<w≤2 千克收 5 元；2<w≤5 千克收 8 元。重量按连续量建模。',
      domain: '0<w≤5', range: '{5, 8}', boundary: 2,
      options: [
        {id: 'correct', label: '0<w≤2 时 5；2<w≤5 时 8'},
        {id: 'boundary-next', label: '0<w<2 时 5；2≤w≤5 时 8'},
        {id: 'multiply', label: '0<w≤2 时 5w；2<w≤5 时 8w'}
      ],
      tableInputs: [1.9, 2, 2.1],
      segments: [
        {from: 0, to: 2, yFrom: 5, yTo: 5, startClosed: false, endClosed: true},
        {from: 2, to: 5, yFrom: 8, yTo: 8, startClosed: false, endClosed: true}
      ]
    },
    {
      id: 'tank', title: '两段速度给水箱注水', variable: 't', inputUnit: '分钟', outputUnit: '升',
      context: '空水箱先以每分钟 2 升注水，持续到 t=2 分钟；随后以每分钟 1 升继续，直到 t=5 分钟。',
      domain: '0≤t≤5', range: '[0, 7]', boundary: 2,
      options: [
        {id: 'correct', label: '0≤t≤2 时 2t；2<t≤5 时 t+2'},
        {id: 'restart', label: '0≤t≤2 时 2t；2<t≤5 时 t'},
        {id: 'unchanged', label: '0≤t≤2 时 2t；2<t≤5 时 2t'}
      ],
      tableInputs: [1.9, 2, 2.1],
      segments: [
        {from: 0, to: 2, yFrom: 0, yTo: 4, startClosed: true, endClosed: true},
        {from: 2, to: 5, yFrom: 4, yTo: 7, startClosed: false, endClosed: true}
      ]
    }
  ]);

  function getScenario(id) { return scenarios.find(scenario => scenario.id === id); }
  function cents(raw) {
    const value = String(raw ?? '').trim();
    if (!/^-?\d+(?:\.\d{1,2})?$/.test(value)) return null;
    const negative = value.startsWith('-');
    const [whole, decimal = ''] = (negative ? value.slice(1) : value).split('.');
    const result = Number(whole) * 100 + Number(decimal.padEnd(2, '0'));
    return Number.isSafeInteger(result) ? (negative ? -result : result) : null;
  }
  function evaluate(id, rawInput) {
    const scenario = getScenario(id);
    if (!scenario) throw new RangeError('未知分段情境');
    const inputCents = cents(rawInput);
    if (inputCents === null || inputCents < (id === 'shipping' ? 1 : 0) || inputCents > 500) {
      return {status: 'invalid', feedback: `请输入${scenario.domain} 范围内、最多两位小数的${scenario.inputUnit}数值。`};
    }
    const branch = inputCents <= 200 ? 'first' : 'second';
    const valueCents = id === 'shipping' ? (branch === 'first' ? 500 : 800)
      : (branch === 'first' ? 2 * inputCents : inputCents + 200);
    return {status: 'valid', scenario, input: inputCents / 100, branch,
      value: valueCents / 100, valueCents};
  }
  function check(id, rawInput, formulaChoice, branchChoice, rawValue) {
    const result = evaluate(id, rawInput);
    if (result.status !== 'valid') return result;
    const predictedCents = cents(rawValue);
    if (!formulaChoice || !branchChoice || predictedCents === null) {
      return {...result, status: 'incomplete', feedback: '先选分段规则、分界点所属段，并填写你预测的函数值。'};
    }
    const correct = formulaChoice === 'correct' && branchChoice === 'first'
      && predictedCents === result.valueCents;
    const {scenario, input, branch, value} = result;
    const rule = scenario.options[0].label;
    const explanation = id === 'shipping'
      ? `w=2 仍收前档 5 元，超过 2 才收 8 元；0 千克不在定义域。`
      : `t=2 已注入 4 升；之后每分钟再加 1 升，所以第二段为 4+(t−2)=t+2，图像在 t=2 连续。`;
    const feedback = `${correct ? '正确。' : '请重新检查规则、分界点和函数值。'}`
      + `规则：${rule}。${scenario.variable}=${input} 属于${branch === 'first' ? '前段' : '后段'}，`
      + `函数值为 ${value} ${scenario.outputUnit}。${explanation}`;
    return {...result, status: correct ? 'correct' : 'wrong', feedback};
  }
  function table(id) {
    const scenario = getScenario(id);
    if (!scenario) throw new RangeError('未知分段情境');
    return scenario.tableInputs.map(input => ({input, value: evaluate(id, String(input)).value}));
  }
  return {scenarios, getScenario, evaluate, check, table};
});
