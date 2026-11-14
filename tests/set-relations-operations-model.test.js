const assert = require('node:assert/strict');
const {test} = require('node:test');
const model = require('../math/high/assets/set-relations-operations-model.js');

function members(mask) {
  return model.domain.filter((_, i) => mask & (1 << i));
}

test('all 4096 A/B combinations partition U, classify relations, and calculate both operations', () => {
  let cases = 0;
  for (let aMask = 0; aMask < 64; aMask++) {
    for (let bMask = 0; bMask < 64; bMask++) {
      const a = members(aMask);
      const b = members(bMask);
      const aOnly = a.filter(n => !b.includes(n));
      const both = a.filter(n => b.includes(n));
      const bOnly = b.filter(n => !a.includes(n));
      const outside = model.domain.filter(n => !a.includes(n) && !b.includes(n));
      const relation = !aOnly.length && !bOnly.length ? 'equal'
        : !aOnly.length ? 'subset' : !bOnly.length ? 'superset' : 'incomparable';
      const state = model.regionsFor([...a].reverse(), [...b].reverse());
      assert.deepEqual(state, {a, b, aOnly, both, bOnly, outside, relation});
      assert.equal(model.checkRelation(a, b, relation, aOnly[0] ?? 'none', bOnly[0] ?? 'none').status, 'correct');
      const intersection = model.operationFor(a, b, 'intersection');
      const union = model.operationFor(a, b, 'union');
      assert.deepEqual(intersection.result, both);
      assert.deepEqual(union.result, model.domain.filter(n => a.includes(n) || b.includes(n)));
      assert.equal(model.checkOperation(a, b, 'intersection', both).status, 'correct');
      assert.equal(model.checkOperation(a, b, 'union', union.result).status, 'correct');
      cases++;
    }
  }
  assert.equal(cases, 4096);
});

test('equality, proper inclusion and disjointness require both witness answers', () => {
  assert.equal(model.regionsFor([], []).relation, 'equal');
  assert.equal(model.regionsFor([], [1]).relation, 'subset');
  assert.equal(model.regionsFor([1], []).relation, 'superset');
  assert.equal(model.regionsFor([1], [3]).relation, 'incomparable');
  assert.equal(model.checkRelation([1, 2], [1, 2], 'subset', 'none', 'none').status, 'wrong');
  assert.equal(model.checkRelation([1, 2], [1, 2, 3], 'subset', 'none', 'none').status, 'wrong');
  assert.equal(model.checkRelation([1, 2], [2, 3], 'incomparable', 1, '').status, 'incomplete');
  assert.equal(model.checkRelation([1, 2], [2, 3], 'incomparable', 1, 1).status, 'wrong');
  assert.equal(model.checkRelation([1, 2], [2, 3], 'incomparable', 1, 3).status, 'correct');
});

test('operation feedback distinguishes missing and extra elements with their membership', () => {
  const result = model.checkOperation([1, 2, 3], [2, 3, 4], 'intersection', [1, 2]);
  assert.equal(result.status, 'wrong');
  assert.deepEqual(result.missing, [3]);
  assert.deepEqual(result.extra, [1]);
  assert.match(result.feedback, /漏选 3：同时在 A、B 中/);
  assert.match(result.feedback, /多选 1：只在 A 中/);
  assert.equal(model.checkOperation([1], [3], 'intersection', []).feedback.includes('A∩B=∅'), true);
  assert.equal(model.checkOperation([1], [3], '', []).status, 'incomplete');
  assert.match(model.checkOperation([1], [3], 'union', [1, 3]).feedback, /6 既不在 A 也不在 B 中，不选/);
});

test('invalid members and unknown choices are rejected', () => {
  assert.throws(() => model.regionsFor([1, 1], []), /不重复/);
  assert.throws(() => model.regionsFor([7], []), /候选/);
  assert.throws(() => model.checkOperation([], [], 'union', [0]), /候选/);
  assert.throws(() => model.checkRelation([], [], 'maybe', 'none', 'none'), /未知/);
  assert.throws(() => model.checkRelation([], [], 'equal', 7, 'none'), /候选/);
  assert.throws(() => model.operationFor([], [], 'difference'), /未知/);
});
