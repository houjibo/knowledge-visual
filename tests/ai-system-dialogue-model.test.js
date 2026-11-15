const assert = require('node:assert/strict');
const Model = require('../computer/high/assets/ai-system-dialogue-model.js');

const comparison = Model.compareInteractionModes();
assert.equal(comparison.fixedDemonstration, true);
assert.equal(comparison.form.dueInDays, 5);
assert.equal(comparison.form.renewalsRemaining, 1);
assert.equal(comparison.form.queuedReservations, 1);
assert.equal(comparison.form.eligible, false);
assert.equal(comparison.dialogue.claim, 'renewal-allowed');
assert.equal(comparison.dialogue.responseSource, '本地固定教学脚本');
assert.equal(comparison.dialogue.actionIssued, false);
assert.equal(comparison.form.steps.length, 4);
assert.equal(comparison.form.steps.at(-1), '根据记录决定是否继续');
assert.equal(comparison.note.includes('不表示普遍'), true);

const before = Model.getCase();
const evidence = Model.getEvidence();
assert.equal(evidence.record.id, comparison.caseId);
assert.equal(evidence.rules.renewalBlockedWhenReserved, true);
assert.equal(evidence.record.queuedReservations, 1);
assert.equal(evidence.actionExecuted, false);
assert.equal(Model.getCase().recordStatus, '未续借');

assert.deepEqual(Model.verifyRenewalDecision({decision: 'verify'}), {
  correct: false, reason: 'open-evidence-first', actionExecuted: false
});
assert.deepEqual(Model.verifyRenewalDecision({evidenceOpened: true, decision: 'verify'}), {
  correct: true, reason: 'reservation-blocks-renewal', actionExecuted: false
});
assert.deepEqual(Model.verifyRenewalDecision({evidenceOpened: true, decision: 'renew'}), {
  correct: false, reason: 'record-conflicts-with-answer', actionExecuted: false
});
assert.throws(() => Model.verifyRenewalDecision({evidenceOpened: 'yes', decision: 'verify'}), TypeError);
assert.throws(() => Model.verifyRenewalDecision({evidenceOpened: true, decision: 'delete'}), RangeError);
assert.deepEqual(Model.getCase(), before);

assert.equal(Object.isFrozen(comparison), true);
assert.equal(Object.isFrozen(comparison.form.steps), true);
assert.equal(Object.isFrozen(evidence.rules), true);

console.log('AI system dialogue model: identical records, seeded conflict, evidence gate and no transaction passed');
