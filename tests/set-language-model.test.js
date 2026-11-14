const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('../math/high/assets/set-language-model.js');

test('fixed conditions and Venn membership give the intended mathematical sets', () => {
  assert.deepEqual(model.universe, [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(model.expectedFor('natural-even'), [2, 4]);
  assert.deepEqual(model.expectedFor('symbol-multiples'), [3, 6]);
  assert.deepEqual(model.regionsFor('venn-intersection'), {
    aOnly: [1], both: [2, 4], bOnly: [6], outside: [3, 5]
  });
  assert.deepEqual(model.expectedFor('venn-intersection'), [2, 4]);
});

test('all finite member choices require both the right set and the right expression', () => {
  const expected = {
    'natural-even': {members: [2, 4], option: 'even-at-most-four'},
    'symbol-multiples': {members: [3, 6], option: 'multiples-three'},
    'venn-intersection': {members: [2, 4], option: 'intersection'}
  };
  for (const [id, answer] of Object.entries(expected)) {
    const round = model.roundFor(id);
    for (let mask = 0; mask < 64; mask++) {
      const selected = [1, 2, 3, 4, 5, 6].filter(n => mask & (1 << (n - 1)));
      for (const option of round.options) {
        const shouldPass = selected.length === answer.members.length &&
          selected.every(n => answer.members.includes(n)) && option.id === answer.option;
        assert.equal(model.checkAnswer(id, selected, option.id).status === 'correct', shouldPass, `${id}, ${mask}, ${option.id}`);
      }
    }
  }
});

test('feedback identifies missing, extra and wrong expression independently', () => {
  let result = model.checkAnswer('natural-even', [2, 5], 'odd-at-most-four');
  assert.deepEqual(result.missing, [4]);
  assert.deepEqual(result.extra, [5]);
  assert.equal(result.optionCorrect, false);
  assert.match(result.feedback, /漏选 4/);
  assert.match(result.feedback, /多选 5/);
  assert.match(result.feedback, /奇数/);
  result = model.checkAnswer('symbol-multiples', [3, 6], 'at-most-three');
  assert.equal(result.status, 'wrong');
  assert.equal(result.optionCorrect, false);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.extra, []);
  assert.equal(model.checkAnswer('venn-intersection', [2, 4], null).status, 'incomplete');
});

test('invalid members and unknown rounds cannot be accepted', () => {
  assert.throws(() => model.roundFor('not-a-round'), /未知/);
  assert.throws(() => model.regionsFor('natural-even'), /没有双集合/);
  for (const value of [[2, 2], [0], [7], [2.5], ['2'], null]) {
    assert.throws(() => model.checkAnswer('natural-even', value, 'even-at-most-four'), /全集/);
  }
});
