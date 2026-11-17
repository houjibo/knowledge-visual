const assert = require('node:assert/strict');
const model = require('../math/high/assets/logic-conditions-model.js');

const full = model.universe;
const property = model.evaluate(full, 'mult6', 'mult3');
assert.equal(property.forward, true);
assert.equal(property.reverse, false);
assert.equal(property.reverseCounterexample, 3);
assert.equal(property.pSufficientForQ, true);
assert.equal(property.pNecessaryForQ, false);

for (const [p, q] of [['mult2and3', 'mult6'], ['even', 'mult2']]) {
  const answer = model.evaluate(full, p, q);
  assert.equal(answer.biconditional, true);
  assert.equal(answer.forwardCounterexample, null);
  assert.equal(answer.reverseCounterexample, null);
}

const reversed = model.evaluate(full, 'mult3', 'mult6');
assert.equal(reversed.forward, false);
assert.equal(reversed.forwardCounterexample, 3);
assert.equal(reversed.reverse, true);

const emptyAntecedent = model.evaluate([3], 'mult6', 'mult3');
assert.equal(emptyAntecedent.forward, true);
assert.equal(emptyAntecedent.pMembers.length, 0);
assert.equal(emptyAntecedent.reverseCounterexample, 3);

const emptyDomain = model.evaluate([], 'positive', 'nonnegative');
assert.equal(emptyDomain.biconditional, true);
assert.deepEqual(emptyDomain.domain, []);

const same = model.evaluate([0, 1, -1], 'square1', 'square1');
assert.equal(same.biconditional, true);
assert.deepEqual(same.pMembers, [-1, 1]);

assert.throws(() => model.evaluate([1, 1], 'even', 'mult2'), RangeError);
assert.throws(() => model.evaluate([7], 'even', 'mult2'), RangeError);
assert.throws(() => model.evaluate(full, 'unknown', 'mult2'), TypeError);

// Independently enumerate the truth table for every finite domain over a small candidate set.
const sample = [-3, -2, -1, 0, 1, 2, 3];
for (let mask = 0; mask < (1 << sample.length); mask++) {
  const domain = sample.filter((_, i) => mask & (1 << i));
  for (const p of Object.keys(model.predicates)) {
    for (const q of Object.keys(model.predicates)) {
      const actual = model.evaluate(domain, p, q);
      const forward = domain.every(n => !model.predicates[p].test(n) || model.predicates[q].test(n));
      const reverse = domain.every(n => !model.predicates[q].test(n) || model.predicates[p].test(n));
      assert.equal(actual.forward, forward, `${mask} ${p} ⇒ ${q}`);
      assert.equal(actual.reverse, reverse, `${mask} ${q} ⇒ ${p}`);
      if (!forward) assert.equal(model.predicates[p].test(actual.forwardCounterexample) && !model.predicates[q].test(actual.forwardCounterexample), true);
      if (!reverse) assert.equal(model.predicates[q].test(actual.reverseCounterexample) && !model.predicates[p].test(actual.reverseCounterexample), true);
    }
  }
}
console.log('logic conditions: 10,368 domain/predicate cases and boundaries passed');
