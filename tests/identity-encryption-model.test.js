const assert = require('node:assert/strict');
const m = require('../computer/middle/assets/identity-encryption-model.js');
assert.equal(m.questions.length, 3);
assert.equal(m.channels.length, 3);
for (const q of m.questions) {
  assert.equal(q.choices.filter(c => c.id === q.answer).length, 1);
  for (const choice of q.choices) assert.equal(m.assessQuestion(q.id, choice.id).correct, choice.id === q.answer);
  assert.equal(m.assessQuestion(q.id, 'unknown'), null);
}
for (const c of m.channels) {
  for (const recipient of ['yes','no']) for (const observer of ['yes','no']) {
    const result = m.assessChannel(c.id, recipient, observer);
    assert.equal(result.correct, (recipient === 'yes') === c.recipient && (observer === 'yes') === c.observer);
  }
}
assert.equal(m.assessChannel('private-key','yes','no').correct,true);
assert.equal(m.assessChannel('leaked-key','yes','yes').correct,true);
assert.equal(m.assessChannel('plaintext','yes','yes').correct,true);
assert.equal(m.assessChannel('unknown','yes','yes'),null);
assert.equal(m.assessChannel('plaintext','','yes'),null);
console.log('identity encryption model: decisions and assumptions pass');
