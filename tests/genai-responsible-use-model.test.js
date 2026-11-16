const assert = require('node:assert/strict');
const Model = require('../computer/high/assets/genai-responsible-use-model.js');

const task = Model.getTask();
assert.equal(task.id, 'fictional-water-saving-study');
assert.match(task.title, /节水/);
assert.match(task.boundary, /不连接真实生成式 AI|不发送网络请求/);

const candidates = Model.getInputCandidates();
assert.equal(candidates.length, 6);
const shareable = candidates.filter(item => item.shareable);
const sensitive = candidates.filter(item => !item.shareable);
assert.deepEqual(shareable.map(item => item.id), ['c1', 'c2', 'c3']);
assert.deepEqual(sensitive.map(item => item.id), ['c4', 'c5', 'c6']);
for (const item of candidates) assert.equal(typeof item.basis, 'string');

const correctSelection = {c1: true, c2: true, c3: true, c4: false, c5: false, c6: false};
assert.deepEqual(Model.checkInputClassification(correctSelection), {
  correct: true, mismatches: [], reason: 'all-classified-correctly'
});
const wrongSelection = {...correctSelection, c4: true};
const wrongResult = Model.checkInputClassification(wrongSelection);
assert.equal(wrongResult.correct, false);
assert.equal(wrongResult.reason, 'classification-mismatch');
assert.deepEqual(wrongResult.mismatches, [{id: 'c4', expected: false, actual: true}]);
assert.throws(() => Model.checkInputClassification({...correctSelection, c1: 'yes'}), TypeError);
assert.throws(() => Model.checkInputClassification({...correctSelection, x9: true}), RangeError);
assert.throws(() => Model.checkInputClassification({c1: true}), RangeError);

const sources = Model.getSources();
assert.equal(sources.length, 2);
const sourceText = sources.map(source => `${source.title} ${source.text}`).join(' ');
assert.doesNotMatch(sourceText, /白皮书/);
for (const source of sources) {
  assert.ok(Array.isArray(source.facts) && source.facts.length > 0);
}

const outputs = Model.getGeneratedOutputs();
assert.equal(outputs.length, 2);
const outA = outputs.find(item => item.id === 'out-a');
const outB = outputs.find(item => item.id === 'out-b');
assert.equal(outA.fabricatedReference, false);
assert.equal(outA.correctVerdict, 'cite');
assert.equal(outB.fabricatedReference, true);
assert.equal(outB.correctVerdict, 'reject');
assert.match(outB.text, /《全国校园节水白皮书（2025）》/);
assert.doesNotMatch(sourceText, /全国校园节水白皮书/);

assert.deepEqual(
  Model.verifyOutputs({verdicts: {'out-a': 'cite', 'out-b': 'reject'}}),
  {correct: false, reason: 'open-evidence-first', conflicts: []}
);
const verified = Model.verifyOutputs({
  evidenceOpened: true,
  verdicts: {'out-a': 'cite', 'out-b': 'reject'}
});
assert.equal(verified.correct, true);
assert.equal(verified.reason, 'sources-support-a-and-b-fabricates');
assert.deepEqual(verified.conflicts, []);

const trustAll = Model.verifyOutputs({
  evidenceOpened: true,
  verdicts: {'out-a': 'cite', 'out-b': 'cite'}
});
assert.equal(trustAll.correct, false);
assert.equal(trustAll.reason, 'verdict-conflict');
assert.deepEqual(trustAll.conflicts, [
  {id: 'out-b', expected: 'reject', actual: 'cite', reason: 'fabricated-reference-not-in-sources'}
]);
const rejectA = Model.verifyOutputs({
  evidenceOpened: true,
  verdicts: {'out-a': 'reject', 'out-b': 'reject'}
});
assert.equal(rejectA.correct, false);
assert.deepEqual(rejectA.conflicts.map(item => item.id), ['out-a']);
assert.throws(
  () => Model.verifyOutputs({evidenceOpened: 'yes', verdicts: {'out-a': 'cite', 'out-b': 'reject'}}),
  TypeError
);
assert.throws(
  () => Model.verifyOutputs({evidenceOpened: true, verdicts: {'out-a': 'cite', 'out-b': 'delete'}}),
  RangeError
);
assert.throws(
  () => Model.verifyOutputs({evidenceOpened: true, verdicts: {'out-a': 'cite'}}),
  RangeError
);

assert.deepEqual(Model.checkSnapshotDecision('verified-only'), {
  correct: true, reason: 'verified-cited-only'
});
assert.equal(Model.checkSnapshotDecision('include-b').correct, false);
assert.equal(Model.checkSnapshotDecision('include-b').reason, 'fabricated-output-must-be-excluded');
assert.equal(Model.checkSnapshotDecision('uncited-b').correct, false);
assert.equal(Model.checkSnapshotDecision('uncited-b').reason, 'citation-required-and-fabricated-excluded');
assert.throws(() => Model.checkSnapshotDecision('publish-everything'), RangeError);

const snapshot = Model.getCollaborationSnapshot();
assert.equal(snapshot.published, false);
assert.equal(snapshot.networkRequests, 0);
assert.equal(snapshot.entries.length, 1);
assert.equal(snapshot.entries[0].from, 'out-a');
assert.deepEqual(snapshot.entries[0].citations, ['s1', 's2']);
assert.doesNotMatch(JSON.stringify(snapshot), /白皮书|out-b/);

assert.equal(Object.isFrozen(candidates), true);
assert.equal(Object.isFrozen(candidates[0]), true);
assert.equal(Object.isFrozen(sources), true);
assert.equal(Object.isFrozen(outputs), true);
assert.equal(Object.isFrozen(verified.conflicts), true);
assert.equal(Object.isFrozen(snapshot.entries), true);
assert.equal(Object.isFrozen(snapshot.entries[0]), true);

console.log('GenAI responsible use model: input norms, source verification, fabricated-reference gate and local snapshot passed');
