(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ThresholdErrorsModel = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const SAMPLES = Object.freeze(Array.from({length: 12}, (_, index) => Object.freeze({
    id: index + 1,
    score: index + 1,
    defect: [3, 5, 7, 9, 11, 12].includes(index + 1)
  })));
  const DEFAULT_THRESHOLD = 9;
  const COMPARISON_THRESHOLD = 4;

  function evaluate(threshold) {
    if (!Number.isInteger(threshold) || threshold < 1 || threshold > 13) {
      throw new RangeError('Threshold must be an integer from 1 to 13');
    }
    const counts = {tp: 0, fp: 0, fn: 0, tn: 0};
    const items = SAMPLES.map(sample => {
      const review = sample.score >= threshold;
      const outcome = review ? (sample.defect ? 'tp' : 'fp') : (sample.defect ? 'fn' : 'tn');
      counts[outcome] += 1;
      return {...sample, review, outcome};
    });
    const predictedPositive = counts.tp + counts.fp;
    const actualPositive = counts.tp + counts.fn;
    return {
      threshold,
      items,
      ...counts,
      predictedPositive,
      actualPositive,
      precision: predictedPositive ? counts.tp / predictedPositive : null,
      recall: actualPositive ? counts.tp / actualPositive : null
    };
  }

  return {SAMPLES, DEFAULT_THRESHOLD, COMPARISON_THRESHOLD, evaluate};
});
