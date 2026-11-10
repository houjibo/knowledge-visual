const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function createProgress(storage) {
  const events = [];
  const window = {dispatchEvent: event => events.push(event.type)};
  const sandbox = {window, localStorage: storage, Event: class Event { constructor(type) { this.type = type; } }};
  vm.runInNewContext(fs.readFileSync('assets/js/subject-progress.js', 'utf8'), sandbox);
  return {api: window.SubjectProgress, events};
}

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
  };
}

let storage = memoryStorage();
let {api, events} = createProgress(storage);
assert.deepEqual({...api.read('computer', 'primary')}, {});
assert.equal(api.markComplete('computer', 'primary', 'robot-algorithms'), true);
assert.deepEqual(JSON.parse(storage.values.get('kv-computer-primary-progress')), {'robot-algorithms': true});
assert.deepEqual(events, ['kv-progress-changed']);
assert.equal(api.markComplete('computer', 'high', 'classifier-lab'), false);
assert.equal(api.markComplete('ai', 'primary', 'robot-algorithms'), false);
assert.equal(api.markComplete('computer', 'primary', '../robot'), false);

storage = memoryStorage({
  'kv-computer-ai-primary-progress': JSON.stringify({'robot-algorithms': true, 'legacy-note': true}),
  'kv-computer-primary-progress': JSON.stringify({'robot-algorithms': false, 'new-topic': true}),
});
api = createProgress(storage).api;
assert.deepEqual({...api.read('computer', 'primary')}, {
  'robot-algorithms': false, 'legacy-note': true, 'new-topic': true,
});
assert.deepEqual(JSON.parse(storage.values.get('kv-computer-primary-progress')), {
  'robot-algorithms': false, 'legacy-note': true, 'new-topic': true,
});
assert.equal(JSON.parse(storage.values.get('kv-computer-ai-primary-progress'))['robot-algorithms'], true);

storage = memoryStorage({'kv-computer-ai-high-progress': JSON.stringify({'classifier-lab': true})});
api = createProgress(storage).api;
assert.deepEqual({...api.read('ai', 'high')}, {'classifier-lab': true});
assert.deepEqual(JSON.parse(storage.values.get('kv-ai-high-progress')), {'classifier-lab': true});
assert.equal(storage.values.has('kv-computer-ai-high-progress'), true);

storage = memoryStorage({
  'kv-computer-ai-middle-progress': '{broken',
  'kv-computer-middle-progress': JSON.stringify({'binary-pixels': true}),
});
api = createProgress(storage).api;
assert.deepEqual({...api.read('computer', 'middle')}, {'binary-pixels': true});
assert.equal(storage.values.get('kv-computer-ai-middle-progress'), '{broken');

storage = memoryStorage({'kv-computer-middle-progress': '[]'});
api = createProgress(storage).api;
assert.equal(api.read('computer', 'middle'), null);
assert.equal(api.markComplete('computer', 'middle', 'binary-pixels'), false);

const denied = createProgress({
  getItem() { return null; },
  setItem() { throw new Error('denied'); },
}).api;
assert.equal(denied.markComplete('ai', 'uni', 'neuron-forward-pass'), false);

storage = memoryStorage();
api = createProgress(storage).api;
assert.equal(api.markComplete('ai', 'high', 'train-test-generalization'), true);
assert.deepEqual(JSON.parse(storage.values.get('kv-ai-high-progress')), {'train-test-generalization': true});

storage = memoryStorage({'kv-computer-ai-primary-progress': JSON.stringify({'robot-algorithms': true})});
const migrationDenied = createProgress({
  getItem: key => storage.getItem(key),
  setItem() { throw new Error('denied'); },
}).api;
assert.deepEqual({...migrationDenied.read('computer', 'primary')}, {'robot-algorithms': true});
assert.equal(storage.values.has('kv-computer-primary-progress'), false);

console.log('Split subject progress and legacy migration checks passed');
