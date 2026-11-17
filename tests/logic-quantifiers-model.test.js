const assert = require('node:assert/strict');
const model = require('../math/high/assets/logic-quantifiers-model.js');

for (const [id, expected] of Object.entries({
  all: [true, true], mixed: [false, true], none: [false, false], empty: [true, false]
})) {
  const preset = model.presets[id];
  const result = model.evaluate(preset.domain, preset.predicate);
  assert.deepEqual([result.forall, result.exists], expected, id);
  assert.equal(result.notForall, result.existsNot, id);
  assert.equal(result.notExists, result.forallNot, id);
}
assert.equal(model.evaluate(model.presets.mixed.domain, 'positive').universalCounterexample, 0);
assert.equal(model.evaluate(model.presets.mixed.domain, 'positive').existentialWitness, 1);
assert.equal(model.evaluate([], 'positive').universalCounterexample, null);
assert.equal(model.evaluate([], 'positive').existentialWitness, null);
assert.throws(() => model.evaluate([1, 1], 'even'), RangeError);
assert.throws(() => model.evaluate([7], 'even'), RangeError);
assert.throws(() => model.evaluate([1], 'unknown'), TypeError);

// Independent Boolean oracle across every subset of the candidate universe.
for (let mask = 0; mask < (1 << model.universe.length); mask++) {
  const domain = model.universe.filter((_, i) => mask & (1 << i));
  for (const [id, predicate] of Object.entries(model.predicates)) {
    const result = model.evaluate(domain, id);
    const flags = domain.map(predicate.test);
    assert.equal(result.forall, flags.every(Boolean), `${mask} ${id} ∀`);
    assert.equal(result.exists, flags.some(Boolean), `${mask} ${id} ∃`);
    assert.equal(result.notForall, result.existsNot, `${mask} ${id} ¬∀`);
    assert.equal(result.notExists, result.forallNot, `${mask} ${id} ¬∃`);
    if (result.universalCounterexample !== null) assert.equal(predicate.test(result.universalCounterexample), false);
    if (result.existentialWitness !== null) assert.equal(predicate.test(result.existentialWitness), true);
  }
}
console.log('logic quantifiers: 73,728 domain/predicate cases and negation identities passed');
