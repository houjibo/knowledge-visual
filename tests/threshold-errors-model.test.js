const assert = require('node:assert/strict');
const {test} = require('node:test');
const model = require('../ai/high/assets/threshold-errors-model.js');

const DEFECT_SCORES = new Set([3, 5, 7, 9, 11, 12]);

function independentlyCount(threshold) {
  const counts = {tp: 0, fp: 0, fn: 0, tn: 0};
  for (let score = 1; score <= 12; score += 1) {
    const defect = DEFECT_SCORES.has(score);
    const review = score >= threshold;
    counts[review ? (defect ? 'tp' : 'fp') : (defect ? 'fn' : 'tn')] += 1;
  }
  return counts;
}

test('two comparison thresholds expose the expected false-alarm and missed-defect tradeoff', () => {
  const high = model.evaluate(9);
  const low = model.evaluate(4);
  assert.deepEqual([high.tp, high.fp, high.fn, high.tn], [3, 1, 3, 5]);
  assert.deepEqual([low.tp, low.fp, low.fn, low.tn], [5, 4, 1, 2]);
  assert.equal(high.precision, 3 / 4);
  assert.equal(high.recall, 3 / 6);
  assert.equal(low.precision, 5 / 9);
  assert.equal(low.recall, 5 / 6);
  assert.equal(model.evaluate(13).precision, null);
  assert.equal(model.evaluate(13).recall, 0);
});

test('all 13 thresholds match independent per-item classification', () => {
  for (let threshold = 1; threshold <= 13; threshold += 1) {
    const result = model.evaluate(threshold);
    const expected = independentlyCount(threshold);
    for (const kind of ['tp', 'fp', 'fn', 'tn']) assert.equal(result[kind], expected[kind]);
    assert.equal(result.items.length, 12);
    assert.equal(Object.values(expected).reduce((sum, count) => sum + count, 0), 12);
    assert.equal(result.predictedPositive, expected.tp + expected.fp);
    assert.equal(result.actualPositive, 6);
    assert.equal(result.precision, result.predictedPositive ? expected.tp / result.predictedPositive : null);
    assert.equal(result.recall, expected.tp / 6);
    for (const item of result.items) {
      assert.equal(item.review, item.score >= threshold);
      assert.equal(item.defect, DEFECT_SCORES.has(item.score));
    }
  }
});

test('unsupported thresholds fail and the fixed source data cannot be changed', () => {
  for (const threshold of [0, 14, 4.5, NaN, '4', null, Infinity]) {
    assert.throws(() => model.evaluate(threshold), RangeError);
  }
  assert.equal(Object.isFrozen(model.SAMPLES), true);
  assert.equal(Object.isFrozen(model.SAMPLES[0]), true);
});
