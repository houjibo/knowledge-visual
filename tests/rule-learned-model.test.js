const assert = require('node:assert/strict');
const m = require('../ai/middle/assets/rule-learned-model.js');
const ids = m.trainSamples.map(s => s.id);
assert.equal(new Set(m.trainSamples.map(s => s.score)).size, m.trainSamples.length);
assert.ok(m.testSamples.every(s => !m.trainSamples.some(t => t.score === s.score)));
for (let mask = 0; mask < (1 << ids.length); mask++) {
  const selected = m.trainSamples.filter((_,i) => mask & (1 << i));
  const trained = m.train(selected.map(s => s.id));
  if (new Set(selected.map(s => s.label)).size < 2) { assert.equal(trained,null); continue; }
  const errors = Array.from({length:12}, (_,t) => selected.filter(s => (s.score >= t ? 'B' : 'A') !== s.label).length);
  const minimum = Math.min(...errors);
  assert.deepEqual(trained.candidates.map(c => c.errors),errors);
  assert.equal(trained.threshold,errors.indexOf(minimum));
  assert.deepEqual(trained.winners, errors.map((n,i) => n === minimum ? i : -1).filter(i => i >= 0));
}
const full = m.train(ids);
assert.equal(full.threshold,3); assert.deepEqual(full.winners,[3,4]);
const reduced = m.train(ids.filter(id => id !== 't2'));
assert.equal(reduced.threshold,1);
assert.deepEqual([m.evaluate(6,3).manualCorrect,m.evaluate(6,3).learnedCorrect],[4,4]);
assert.deepEqual([m.evaluate(6,1).manualCorrect,m.evaluate(6,1).learnedCorrect],[4,3]);
assert.equal(m.train(['t0','t0','t4']),null);
assert.equal(m.train(['t0','v1']),null);
assert.equal(m.evaluate(12,3),null);
assert.equal(m.predict(3,3),'B'); assert.equal(m.predict(2,3),'A');
console.log('rule learned model: all subsets, ties and held-out results pass');
