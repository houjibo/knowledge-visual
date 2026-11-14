/* Construct a finite universe and predict its subset's complement. */
(function () {
  'use strict';
  const model = window.KVSetComplementModel;
  const lab = document.getElementById('complement-lab');
  if (!model || !lab) return;

  const ns = 'http://www.w3.org/2000/svg';
  const presets = document.getElementById('complement-presets');
  const universeButtons = document.getElementById('complement-universe');
  const setAButtons = document.getElementById('complement-a');
  const predictionButtons = document.getElementById('complement-prediction');
  const current = document.getElementById('complement-current');
  const diagram = document.getElementById('complement-diagram');
  const choice = document.getElementById('complement-empty-choice');
  const feedback = document.getElementById('complement-feedback');
  const limit = document.getElementById('complement-limit');
  let universe = new Set(model.presets.small.universe);
  let setA = new Set(model.presets.small.setA);
  let prediction = new Set();
  let activePreset = 'small';
  let solved = false;

  function svgNode(tag, attributes = {}, value) {
    const node = document.createElementNS(ns, tag);
    for (const [name, content] of Object.entries(attributes)) node.setAttribute(name, String(content));
    if (value !== undefined) node.textContent = String(value);
    return node;
  }

  function drawDiagram(state) {
    const label = `讨论全集 U 为 ${model.formatSet(state.universe)}，圆内 A 为 ${model.formatSet(state.setA)}。` +
      (solved ? `补集为 ${model.formatSet(state.complement)}。` : '请判断圆外但仍在 U 中的对象。');
    const svg = svgNode('svg', {viewBox: '0 0 360 200', role: 'img', 'aria-label': label});
    svg.append(svgNode('rect', {x: 10, y: 10, width: 340, height: 180, rx: 9, class: 'complement-universe-shape'}));
    svg.append(svgNode('text', {x: 27, y: 32, class: 'complement-svg-label'}, 'U'));
    svg.append(svgNode('ellipse', {cx: 138, cy: 105, rx: 88, ry: 65, class: 'complement-a-shape'}));
    svg.append(svgNode('text', {x: 138, y: 58, 'text-anchor': 'middle', class: 'complement-svg-label'}, 'A'));
    const inner = [[110, 82], [155, 82], [110, 108], [155, 108], [110, 134], [155, 134]];
    const outer = [[255, 76], [300, 76], [255, 107], [300, 107], [255, 138], [300, 138]];
    state.setA.forEach((n, i) => {
      const [x, y] = inner[i];
      svg.append(svgNode('text', {x, y, 'text-anchor': 'middle', class: 'complement-svg-number'}, n));
    });
    state.complement.forEach((n, i) => {
      const [x, y] = outer[i];
      svg.append(svgNode('text', {x, y, 'text-anchor': 'middle',
        class: `complement-svg-number${solved ? ' revealed' : ''}`}, n));
    });
    diagram.replaceChildren(svg);
  }

  function clearResult() {
    solved = false;
    feedback.hidden = true;
    feedback.textContent = '';
    limit.textContent = '';
  }

  function renderButtons(container, values, name, allowOutside) {
    for (const button of container.children) {
      const n = Number(button.dataset.member);
      const selected = values.has(n);
      button.className = `set-element ${selected ? 'in-A' : 'in-none'}`;
      button.setAttribute('aria-pressed', String(selected));
      button.disabled = !allowOutside && !universe.has(n);
      button.setAttribute('aria-label', `${name}元素 ${n}${button.disabled ? '（不在 U 中）' : ''}`);
    }
  }

  function render() {
    const state = model.stateFor([...universe], [...setA]);
    for (const button of presets.children) {
      const selected = button.dataset.preset === activePreset;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    }
    renderButtons(universeButtons, universe, '全集 U ', true);
    renderButtons(setAButtons, setA, '工作台 A ', false);
    renderButtons(predictionButtons, prediction, '预测补集 ', false);
    current.textContent = `当前 U = ${model.formatSet(state.universe)}，A = ${model.formatSet(state.setA)}；候选域外的数字不参与讨论。`;
    drawDiagram(state);
  }

  function toggle(collection, n) {
    if (collection.has(n)) collection.delete(n);
    else collection.add(n);
    if (collection !== prediction) activePreset = null;
    clearResult();
    render();
  }

  function buildGroup(container, onToggle) {
    for (const n of model.domain) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.member = String(n);
      button.textContent = n;
      button.addEventListener('click', () => onToggle(n));
      container.append(button);
    }
  }

  buildGroup(universeButtons, n => {
    if (universe.size === 1 && universe.has(n)) {
      limit.textContent = '本练习至少保留一个讨论对象；可先加入其他对象，再移除这个对象。';
      return;
    }
    if (universe.has(n)) universe.delete(n);
    else universe.add(n);
    setA = new Set([...setA].filter(value => universe.has(value)));
    prediction = new Set([...prediction].filter(value => universe.has(value)));
    activePreset = null;
    clearResult();
    render();
  });
  buildGroup(setAButtons, n => toggle(setA, n));
  buildGroup(predictionButtons, n => toggle(prediction, n));

  presets.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
      const preset = model.presets[button.dataset.preset];
      if (!preset) return;
      universe = new Set(preset.universe);
      setA = new Set(preset.setA);
      prediction = new Set();
      activePreset = button.dataset.preset;
      choice.querySelectorAll('input').forEach(input => { input.checked = false; });
      clearResult();
      render();
    });
  });
  choice.addEventListener('change', () => {
    clearResult();
    render();
  });
  document.getElementById('complement-check').addEventListener('click', () => {
    const selected = choice.querySelector('input:checked');
    const result = model.checkPrediction([...universe], [...setA], [...prediction], selected?.value);
    feedback.hidden = false;
    feedback.className = `result-box complement-feedback${result.status === 'correct' ? '' : ' error'}`;
    feedback.textContent = result.feedback;
    if (result.status === 'correct') {
      solved = true;
      if (activePreset === 'small') feedback.textContent += ' 保持 A={2,4}，再试“扩大 U”，比较新增的对象。';
      if (activePreset === 'large') feedback.textContent += ' 与原 U={1,2,3,4} 相比，新增的 5、6 进入补集。';
      render();
    }
  });
  render();
})();
