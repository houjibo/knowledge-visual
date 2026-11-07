// Exercise the actual inline switch handlers with small DOM stubs.
// Native keyboard behavior and visual focus still require a real browser.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

function makeTab(value, initial) {
  const state = {active: initial, pressed: String(initial)};
  return {dataset: {mode: value, tab: value}, state,
    classList: {add: () => {state.active = true;}, remove: () => {state.active = false;}},
    setAttribute: (name, value) => {if (name === 'aria-pressed') state.pressed = value;},
    addEventListener: (name, callback) => {if (name === 'click') state.click = callback;}};
}
function check(file, modes, physics) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const tags = [...html.matchAll(/<button type="button" class="tab(?: active)?" data-(?:mode|tab)="([^"]+)" aria-pressed="(true|false)">/g)];
  assert.deepEqual(tags.map(x => x[1]), modes, `${file}: semantic mode buttons`);
  assert.deepEqual(tags.map(x => x[2]), modes.map((_, i) => String(i === 0)), `${file}: initial state`);
  const tabs = modes.map((name, i) => makeTab(name, i === 0));
  const sections = Object.fromEntries(modes.map(name => [name, {hidden: name !== modes[0],
    classList: {toggle: (_, hidden) => { sections[name].hidden = hidden; },
      add: () => { sections[name].hidden = false; }, remove: () => { sections[name].hidden = true; }} }]));
  let source;
  let context;
  if (physics) {
    source = html.slice(html.indexOf("document.querySelectorAll('.tab').forEach(tab => {"), html.indexOf('// ========== 1. 速度概念场景'));
    context = {document: {querySelectorAll: selector => selector === '.tab' ? tabs : Object.values(sections),
      getElementById: id => sections[id.slice(4)]}, cancelPendingAnimation() {}, drawScene() {},
      currentTab: modes[0], conceptState: {running: false}, uniState: {running: false}, graphState: {running: false}};
  } else {
    source = html.slice(html.indexOf("tabs.forEach(t => t.addEventListener('click'"), html.indexOf('/* ============================================================\n * 探究模式'));
    context = {tabs, sections, draw() {}};
  }
  assert.ok(source.length > 0, `${file}: switch handler missing`);
  vm.runInNewContext(source, context);
  tabs[1].state.click();
  assert.deepEqual(tabs.map(t => t.state.pressed), modes.map((_, i) => String(i === 1)), `${file}: selected state`);
  assert.deepEqual(modes.map(name => sections[name].hidden), modes.map((_, i) => i !== 1), `${file}: visible section`);
}
check('physics/middle/motion.html', ['concept', 'uniform', 'graphs', 'quiz'], true);
check('chemistry/high/mole-concept.html', ['learn', 'practice', 'quiz'], false);
check('science/sink-float.html', ['learn', 'practice', 'quiz'], false);
console.log('Pilot mode switching scenarios passed');
