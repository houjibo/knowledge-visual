(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  if (root) root.KVInequalityOptimizationModel = model;
})(typeof window !== 'undefined' ? window : null, function () {
  const scenarios = [
    {
      id: 'sum-open', title: '固定和：围成长方形',
      context: '长方形两边 a、b 都非负，a+b=4 米。面积 ab 最大是多少？',
      condition: 'a≥0，b≥0，a+b=4', objective: '面积 ab 的最大值', optimum: 4,
      bound: '基本不等式给出 ab≤(a+b)²/4=4。',
      proof: '4−ab=(a−2)²≥0；a=b=2 符合条件，所以最大值 4 可以取到。',
      pairs: [{id:'0-4', a:0, b:4}, {id:'1-3', a:1, b:3}, {id:'2-2', a:2, b:2}]
    },
    {
      id: 'sum-restricted', title: '固定和：短边受限',
      context: '长方形两边 a、b 都非负，a+b=4 米，还要求 0≤a≤1 米。面积 ab 最大是多少？',
      condition: '0≤a≤1，b=4−a', objective: '面积 ab 的最大值', optimum: 3,
      bound: '基本不等式仍给出 ab≤4，但等号要求 a=b=2，不符合 a≤1。',
      proof: '在 0≤a≤1 时，3−ab=(1−a)(3−a)≥0；a=1、b=3 可取到最大值 3。',
      pairs: [{id:'0-4', a:0, b:4}, {id:'0.5-3.5', a:0.5, b:3.5}, {id:'1-3', a:1, b:3}]
    },
    {
      id: 'product-open', title: '固定积：节省围栏',
      context: '长方形面积 ab=4 平方米，两边 a、b 为正。半周长 a+b 最小是多少？',
      condition: 'a>0，b>0，ab=4', objective: '半周长 a+b 的最小值', optimum: 4,
      bound: '基本不等式给出 a+b≥2√(ab)=4。',
      proof: '令 b=4/a，则 a+b−4=(a−2)²/a≥0；a=b=2 符合条件，所以最小值 4 可以取到。',
      pairs: [{id:'1-4', a:1, b:4}, {id:'2-2', a:2, b:2}, {id:'4-1', a:4, b:1}]
    },
    {
      id: 'product-restricted', title: '固定积：一边受限',
      context: '长方形面积 ab=4 平方米，要求 0<a≤1 米。半周长 a+b 最小是多少？',
      condition: '0<a≤1，b=4/a', objective: '半周长 a+b 的最小值', optimum: 5,
      bound: '基本不等式仍给出 a+b≥4，但等号要求 a=b=2，不符合 a≤1。',
      proof: '在 0<a≤1 时，a+b−5=(1−a)(4−a)/a≥0；a=1、b=4 可取到最小值 5。',
      pairs: [{id:'0.5-8', a:0.5, b:8}, {id:'0.8-5', a:0.8, b:5}, {id:'1-4', a:1, b:4}]
    },
    {
      id: 'sum-zero', title: '零边界：固定和为零',
      context: 'a、b 均非负且 a+b=0。积 ab 的最大值是多少？',
      condition: 'a≥0，b≥0，a+b=0', objective: '积 ab 的最大值', optimum: 0,
      bound: '基本不等式给出 ab≤(a+b)²/4=0。',
      proof: '非负两数之和为 0，只可能 a=b=0；积为 0，等号在零边界成立。',
      pairs: [{id:'0-0', a:0, b:0}]
    },
    {
      id: 'product-zero', title: '零边界：固定积为零',
      context: 'a、b 均非负且 ab=0。和 a+b 的最小值是多少？',
      condition: 'a≥0，b≥0，ab=0', objective: '和 a+b 的最小值', optimum: 0,
      bound: '基本不等式给出 a+b≥2√(ab)=0。',
      proof: 'a、b 非负，所以 a+b≥0；取 a=b=0 时达到最小值 0。若取 (0,t)，t 可以任意大，因此和没有最大值。',
      pairs: [{id:'0-0', a:0, b:0}, {id:'0-2', a:0, b:2}, {id:'2-0', a:2, b:0}]
    }
  ];
  function get(id) { return scenarios.find(item => item.id === id); }
  function check(id, pairId, answer) {
    const scenario = get(id);
    if (!scenario) throw new RangeError('unknown scenario');
    const pair = scenario.pairs.find(item => item.id === pairId);
    if (!pair || String(answer).trim() === '') return {status:'incomplete', feedback:'先选一组符合条件的数，再填写可取到的最值。'};
    const value = Number(answer);
    if (!Number.isFinite(value)) return {status:'incomplete', feedback:'最值请填写有限数字。'};
    const pairValue = scenario.objective.includes('ab') ? pair.a * pair.b : pair.a + pair.b;
    if (Math.abs(pairValue - scenario.optimum) > 1e-9 || Math.abs(value - scenario.optimum) > 1e-9) {
      return {status:'incorrect', feedback:`你选的 (${pair.a}, ${pair.b}) 得到 ${pairValue}；填写的是 ${value}。本题可取到的${scenario.objective}是 ${scenario.optimum}。${scenario.bound} ${scenario.proof}`};
    }
    return {status:'correct', feedback:`正确：(${pair.a}, ${pair.b}) 取到 ${scenario.optimum}。${scenario.bound} ${scenario.proof}`};
  }
  return {scenarios, get, check};
});
