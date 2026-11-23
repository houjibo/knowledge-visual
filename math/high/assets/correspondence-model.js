(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  if (root) root.KVCorrespondenceModel = model;
})(typeof window !== 'undefined' ? window : null, function () {
  const domain = Object.freeze([-2, 0, 2]);
  const codomain = Object.freeze([0, 2, 4]);
  const presets = Object.freeze({
    square: Object.freeze({'-2': [4], '0': [0], '2': [4]}),
    missing: Object.freeze({'-2': [4], '0': [], '2': [4]}),
    multiple: Object.freeze({'-2': [2, 4], '0': [0], '2': [4]})
  });

  function normalize(mapping) {
    if (!mapping || typeof mapping !== 'object') throw new TypeError('对应关系必须按 A 中元素给出');
    const normalized = {};
    for (const x of domain) {
      const outputs = mapping[String(x)];
      if (!Array.isArray(outputs) || outputs.some(y => !codomain.includes(y))) {
        throw new RangeError(`x=${x} 的对应值必须来自 B`);
      }
      normalized[String(x)] = [...new Set(outputs)].sort((a, b) => a - b);
    }
    return normalized;
  }

  function analyze(mapping) {
    const selected = normalize(mapping);
    const missing = domain.filter(x => selected[String(x)].length === 0);
    const multiple = domain.filter(x => selected[String(x)].length > 1);
    const isFunction = missing.length === 0 && multiple.length === 0;
    const range = isFunction
      ? codomain.filter(y => domain.some(x => selected[String(x)][0] === y))
      : null;
    return {selected, isFunction, missing, multiple, range};
  }

  function check(mapping, prediction, predictedRange) {
    const result = analyze(mapping);
    if (prediction !== 'yes' && prediction !== 'no') {
      return {...result, status: 'incomplete', feedback: '先预测这组对应是否构成函数。'};
    }
    if (prediction === 'yes' && (!Array.isArray(predictedRange) || predictedRange.length === 0)) {
      return {...result, status: 'incomplete', feedback: '你认为它是函数，请再勾选预测的值域。'};
    }
    const chosenRange = prediction === 'yes' ? [...new Set(predictedRange)] : [];
    if (chosenRange.some(y => !codomain.includes(y))) throw new RangeError('预测值域必须从 B 选择');
    const rangeCorrect = result.isFunction && prediction === 'yes'
      && chosenRange.length === result.range.length && chosenRange.every(y => result.range.includes(y));
    const correct = result.isFunction ? rangeCorrect : prediction === 'no';
    let explanation;
    if (result.isFunction) {
      explanation = `A 中每个元素都恰好对应 B 中一个元素，所以这是函数。不同输入可以同指一个输出。陪域 B={0,2,4}；实际值域为 {${result.range.join(',')}}。`;
    } else {
      const reasons = [];
      for (const x of result.missing) reasons.push(`x=${x} 没有对应值`);
      for (const x of result.multiple) reasons.push(`x=${x} 同时对应 ${result.selected[String(x)].join(' 和 ')}`);
      explanation = `${reasons.join('；')}，因此这不是从 A 到 B 的函数，不能称其有函数值域。`;
    }
    return {...result, status: correct ? 'correct' : 'wrong',
      feedback: `${correct ? '判断正确。' : '再核对你的预测。'}${explanation}`};
  }

  return Object.freeze({domain, codomain, presets, analyze, check});
});
