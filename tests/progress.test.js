// Run with: node tests/progress.test.js
// Exercise the actual inline scripts with a deliberately small DOM/storage stub.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function stageScript(file) {
  const match = read(file).match(/<script>\s*\/\/ 学段完成度统计[\s\S]*?<\/script>/);
  assert.ok(match, `stage script missing in ${file}`);
  return match[0].replace(/^<script>/, '').replace(/<\/script>$/, '');
}
function stageProgress(file, store) {
  const cards = Array.from({length: 3}, () => ({appendChild(chip) { this.text = chip.textContent; }}));
  const document = {querySelectorAll: () => cards, createElement: () => ({style: {}, setAttribute() {}})};
  vm.runInNewContext(stageScript(file), {document, localStorage: {getItem: key => store[key] || null}});
  return cards.map(card => card.text);
}
assert.deepEqual(stageProgress('physics/index.html', {}), Array(3).fill('尚未开始'));
assert.deepEqual(stageProgress('physics/index.html', {
  'kv-physics-middle-progress': '{"motion":1,"sound":1}',
  'kv-physics-high-progress': '{"motion":1}',
  'kv-physics-uni-progress': '{"mechanics":1}'
}), ['✓ 2/20 已完成 · 10%', '✓ 1/16 已完成 · 6%', '✓ 1/19 已完成 · 5%']);
assert.deepEqual(stageProgress('chemistry/index.html', {
  'kv-chemistry-high-progress': '{"a":1,"b":1}',
  'kv-chemistry-uni-progress': '{"a":1}'
}), ['尚未开始', '✓ 2/16 已完成 · 13%', '✓ 1/17 已完成 · 6%']);

function homepage(store) {
  const totals = {math: '198', physics: '55', chemistry: '46', science: '17'};
  const cards = Object.keys(totals).map(subject => {
    const children = {'.sp-label': {}, '.sp-pct': {}, '.sp-fill': {style: {}}};
    return {children, getAttribute: key => key === 'data-subject' ? subject : totals[subject],
      querySelector: key => children[key], setAttribute() {}};
  });
  const match = read('index.html').match(/<script>[\s\S]*?<\/script>/);
  assert.ok(match, 'homepage script missing');
  const code = match[0].replace(/^<script>/, '').replace(/<\/script>$/, '');
  const catalogContext = {window: {}};
  vm.runInNewContext(read('assets/topic-catalog.js'), catalogContext);
  vm.runInNewContext(code, {window: catalogContext.window, document: {querySelectorAll: () => cards},
    localStorage: {getItem: key => store[key] || null}, requestAnimationFrame: fn => fn()});
  return cards.map(card => card.children['.sp-label'].textContent);
}
assert.deepEqual(homepage({}), Array(4).fill('尚未开始'));
assert.deepEqual(homepage({'kv-physics-middle-progress': '{"motion":1}',
  'kv-physics-high-progress': '{"optics":1}'}),
['尚未开始', '已学 2/55', '尚未开始', '尚未开始']);

const math = read('math/index.html');
const start = math.indexOf('    function renderStageProgress()');
const end = math.lastIndexOf('  </script>');
assert.ok(start >= 0 && end > start, 'math progress function missing');
const chips = [];
const links = ['topics/one/index.html', 'topics/one/index.html', 'topics/two/index.html']
  .map(href => ({getAttribute: () => href}));
const document = {querySelectorAll: () => links, getElementById: () => ({appendChild: chip => chips.push(chip)}),
  createElement: () => ({style: {}, setAttribute() {}})};
vm.runInNewContext(math.slice(start, end) + '\nrenderStageProgress();', {document,
  localStorage: {getItem: () => '{"one":1,"random-variables":1}'}});
assert.equal(chips[0].textContent, '小学 ✓ 1/2 · 50%');
assert.equal(chips[2].textContent, '高中 ✓ 1/19 · 5%');
console.log('Progress regression scenarios passed');

// PageProgress is a global lexical binding, not a property on window.
for (const slug of ['measurements', 'mixed-operations', 'large-numbers', 'hours-minutes-seconds']) {
  const source = read(`math/topics/${slug}/index.html`);
  const guard = source.match(/typeof PageProgress !== 'undefined'\s*&&\s*!PageProgress\.isDone\('[^']+'\)/);
  assert.ok(guard, `${slug}: completion guard missing`);
  assert.ok(guard[0].includes(`'${slug}'`), `${slug}: guard checks a different topic`);
  assert.equal(vm.runInNewContext(guard[0], {}), false, `${slug}: missing API`);
  assert.equal(vm.runInNewContext(`const PageProgress = {isDone: () => false}; ${guard[0]}`, {window: {}}), true, `${slug}: incomplete`);
  assert.equal(vm.runInNewContext(`const PageProgress = {isDone: () => true}; ${guard[0]}`, {window: {}}), false, `${slug}: already completed`);
}
console.log('Primary completion guards passed');
