(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  if (root) root.KVRuleLearnedModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const trainSamples = Object.freeze([
    Object.freeze({id:'t0', score:0, label:'A'}), Object.freeze({id:'t2', score:2, label:'A'}),
    Object.freeze({id:'t4', score:4, label:'B'}), Object.freeze({id:'t6', score:6, label:'B'}),
    Object.freeze({id:'t8', score:8, label:'B'}), Object.freeze({id:'t10', score:10, label:'B'})
  ]);
  const testSamples = Object.freeze([
    Object.freeze({id:'v1', score:1, label:'A'}), Object.freeze({id:'v3', score:3, label:'A'}),
    Object.freeze({id:'v5', score:5, label:'B'}), Object.freeze({id:'v7', score:7, label:'B'}),
    Object.freeze({id:'v9', score:9, label:'B'})
  ]);
  function predict(score, threshold) {
    if (!Number.isInteger(score) || score < 0 || score > 10 || !Number.isInteger(threshold) || threshold < 0 || threshold > 11) return null;
    return score >= threshold ? 'B' : 'A';
  }
  function train(ids) {
    if (!Array.isArray(ids) || new Set(ids).size !== ids.length) return null;
    const selected = ids.map(id => trainSamples.find(sample => sample.id === id));
    if (!selected.length || selected.some(sample => !sample) || new Set(selected.map(sample => sample.label)).size !== 2) return null;
    const candidates = Array.from({length:12}, (_,threshold) => ({threshold,
      errors:selected.reduce((count, sample) => count + Number(predict(sample.score,threshold) !== sample.label), 0)}));
    const minimum = Math.min(...candidates.map(item => item.errors));
    const winners = candidates.filter(item => item.errors === minimum).map(item => item.threshold);
    return {threshold:winners[0], minimum, winners, count:selected.length, candidates};
  }
  function evaluate(manual, learned) {
    if (predict(0, manual) === null || predict(0, learned) === null) return null;
    const rows = testSamples.map(sample => {
      const manualPrediction = predict(sample.score, manual);
      const learnedPrediction = predict(sample.score, learned);
      return {id:sample.id, score:sample.score, label:sample.label, manualPrediction, learnedPrediction,
        manualCorrect:manualPrediction === sample.label, learnedCorrect:learnedPrediction === sample.label};
    });
    return {rows, manualCorrect:rows.filter(row => row.manualCorrect).length,
      learnedCorrect:rows.filter(row => row.learnedCorrect).length, total:rows.length};
  }
  return {trainSamples, testSamples, predict, train, evaluate};
});
