const assert = require('node:assert/strict');
const Model = require('../computer/uni/assets/stack-queue-model.js');

let state = Model.create();
assert.deepEqual(state.stack, []);
assert.deepEqual(state.queue, []);
assert.equal(Model.remove(state, 'A', 'A').error, 'empty');
assert.equal(Model.remove(state, 'A', 'A').state, state);

for (const token of ['A', 'B', 'C']) {
  const added = Model.add(state);
  assert.equal(added.token, token);
  state = added.state;
}
assert.deepEqual(state.stack, ['A', 'B', 'C']);
assert.deepEqual(state.queue, ['A', 'B', 'C']);
assert.equal(Model.remove(state, '', 'A').error, 'prediction');
assert.deepEqual(state.stack, ['A', 'B', 'C']);
let removed = Model.remove(state, 'C', 'A');
assert.deepEqual([removed.stackToken, removed.queueToken, removed.correct], ['C', 'A', true]);
state = removed.state;
assert.deepEqual(state.stack, ['A', 'B']);
assert.deepEqual(state.queue, ['B', 'C']);
assert.equal(state.firstCorrect, true);
assert.equal(state.complete, false);
removed = Model.remove(state, 'B', 'B');
assert.equal(removed.correct, true);
assert.equal(removed.state.complete, false, 'another removal without a new arrival must not qualify');
state = Model.add(state).state;
assert.deepEqual(state.stack, ['A', 'B', 'D']);
assert.deepEqual(state.queue, ['B', 'C', 'D']);
removed = Model.remove(state, 'D', 'B');
assert.equal(removed.correct, true);
assert.equal(removed.state.complete, true);

state = Model.create();
state = Model.add(state).state;
removed = Model.remove(state, 'A', 'A');
assert.equal(removed.state.firstCorrect, false, 'one visible item is not the first comparison');
state = Model.create();
for (let i = 0; i < 3; i++) state = Model.add(state).state;
removed = Model.remove(state, 'A', 'C');
assert.equal(removed.correct, false);
assert.equal(removed.state.firstCorrect, false);
state = removed.state;
state = Model.add(state).state;
removed = Model.remove(state, 'D', 'B');
assert.equal(removed.state.firstCorrect, true);
assert.equal(removed.state.complete, false);

state = Model.create();
for (let i = 0; i < 6; i++) state = Model.add(state).state;
assert.equal(Model.add(state).error, 'exhausted');
assert.equal(Model.add(state).state, state);

// Independently enumerate legal additions/removals and compare every model step
// with simple reference stack/queue operations, including divergent contents.
let paths = 0;
function explore(model, stack, queue, next) {
  assert.deepEqual(model.stack, stack);
  assert.deepEqual(model.queue, queue);
  assert.equal(model.nextIndex, next);
  paths++;
  if (next < 6) {
    const token = 'ABCDEF'[next];
    explore(Model.add(model).state, [...stack, token], [...queue, token], next + 1);
  }
  if (stack.length) {
    const result = Model.remove(model, stack.at(-1), queue[0]);
    assert.equal(result.stackToken, stack.at(-1));
    assert.equal(result.queueToken, queue[0]);
    assert.equal(result.correct, true);
    explore(result.state, stack.slice(0, -1), queue.slice(1), next);
  }
}
explore(Model.create(), [], [], 0);
assert.ok(paths > 100);
console.log(`stack-queue model: ${paths} states checked`);
