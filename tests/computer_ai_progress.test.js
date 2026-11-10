const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function createProgress(storage) {
  const events = [];
  const window = {dispatchEvent: event => events.push(event.type)};
  const sandbox = {window, localStorage: storage, Event: class Event { constructor(type) { this.type = type; } }};
  vm.runInNewContext(fs.readFileSync('computer-ai/assets/progress.js', 'utf8'), sandbox);
  return {api: window.ComputerAIProgress, events};
}

let values = new Map();
const storage = {
  getItem(key) { return values.has(key) ? values.get(key) : null; },
  setItem(key, value) { values.set(key, String(value)); },
};

let {api, events} = createProgress(storage);
assert.deepEqual({...api.read('primary')}, {});
assert.equal(api.markComplete('primary', 'robot-algorithms'), true);
assert.equal(JSON.parse(values.get('kv-computer-ai-primary-progress'))['robot-algorithms'], true);
assert.deepEqual(events, ['kv-progress-changed']);
assert.equal(api.markComplete('unknown', 'robot-algorithms'), false);
assert.equal(api.markComplete('primary', '../robot'), false);

values.set('kv-computer-ai-middle-progress', '{broken');
assert.equal(api.read('middle'), null);
assert.equal(api.markComplete('middle', 'binary-pixels'), false);
assert.equal(values.get('kv-computer-ai-middle-progress'), '{broken');

const denied = createProgress({getItem() { return null; }, setItem() { throw new Error('denied'); }}).api;
assert.equal(denied.markComplete('uni', 'neuron-forward-pass'), false);

const arrayStorage = createProgress({getItem() { return '[]'; }, setItem() { throw new Error('should not write'); }}).api;
assert.equal(arrayStorage.read('high'), null);
assert.equal(arrayStorage.markComplete('high', 'classifier-lab'), false);

console.log('Computer AI progress storage checks passed');
