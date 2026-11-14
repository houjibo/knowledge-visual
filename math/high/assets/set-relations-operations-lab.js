/* Shared set construction, relationship evidence, and operation prediction. */
(function () {
  'use strict';
  const model = window.KVSetRelationsOperationsModel;
  const lab = document.getElementById('relations-lab');
  if (!model || !lab) return;

  const ns = 'http://www.w3.org/2000/svg';
  const presets = document.getElementById('relations-presets');
  const aButtons = document.getElementById('relations-a');
  const bButtons = document.getElementById('relations-b');
  const predictionButtons = document.getElementById('relations-prediction');
  const diagram = document.getElementById('relations-diagram');
  const current = document.getElementById('relations-current');
  const regionsText = document.getElementById('relations-regions');
  const relationChoice = document.getElementById('relations-choice');
  const operationChoice = document.getElementById('relations-operation-choice');
  const witnessA = document.getElementById('relations-witness-a');
  const witnessB = document.getElementById('relations-witness-b');
  const relationFeedback = document.getElementById('relations-feedback');
  const operationFeedback = document.getElementById('relations-operation-feedback');
  let a = new Set(model.examples.subset.a);
  let b = new Set(model.examples.subset.b);
  let prediction = new Set();
  let activePreset = 'subset';

  function svgNode(tag, attributes = {}, value) {
    const node = document.createElementNS(ns, tag);
    for (const [name, content] of Object.entries(attributes)) node.setAttribute(name, String(content));
    if (value !== undefined) node.textContent = String(value);
    return node;
  }

  function renderDiagram(regions) {
    const svg = svgNode('svg', {viewBox: '0 0 400 220', role: 'img',
      'aria-label': `U 中，A 独有 ${model.formatSet(regions.aOnly)}；A 与 B 共有 ${model.formatSet(regions.both)}；B 独有 ${model.formatSet(regions.bOnly)}；两者之外 ${model.formatSet(regions.outside)}。`});
    svg.append(svgNode('rect', {x: 10, y: 10, width: 380, height: 200, rx: 10, class: 'relations-universe'}));
    svg.append(svgNode('circle', {cx: 125, cy: 110, r: 90, class: 'relations-circle-a'}));
    svg.append(svgNode('circle', {cx: 225, cy: 110, r: 90, class: 'relations-circle-b'}));
    svg.append(svgNode('text', {x: 24, y: 30, class: 'relations-svg-label'}, 'U'));
    svg.append(svgNode('text', {x: 66, y: 55, class: 'relations-svg-label'}, 'A'));
    svg.append(svgNode('text', {x: 288, y: 55, class: 'relations-svg-label'}, 'B'));
    const points = {
      aOnly: [[75, 70], [105, 70], [75, 110], [105, 110], [75, 150], [105, 150]],
      both: [[155, 70], [195, 70], [155, 110], [195, 110], [155, 150], [195, 150]],
      bOnly: [[245, 70], [275, 70], [245, 110], [275, 110], [245, 150], [275, 150]],
      outside: [[50, 32], [175, 30], [350, 32], [50, 188], [175, 190], [350, 188]]
    };
    for (const region of Object.keys(points)) {
      regions[region].forEach((n, i) => {
        const [x, y] = points[region][i];
        svg.append(svgNode('text', {x, y, 'text-anchor': 'middle', class: 'relations-svg-number',
          'data-member': n, 'data-region': region}, n));
      });
    }
    diagram.replaceChildren(svg);
  }

  function renderButtons(container, selected, label, selectedClass) {
    for (const button of container.children) {
      const n = Number(button.dataset.member);
      const pressed = selected.has(n);
      button.className = `set-element ${pressed ? selectedClass : 'in-none'}`;
      button.setAttribute('aria-pressed', String(pressed));
      button.setAttribute('aria-label', `${label}元素 ${n}`);
    }
  }

  function render() {
    const regions = model.regionsFor([...a], [...b]);
    for (const button of presets.children) {
      const pressed = button.dataset.preset === activePreset;
      button.classList.toggle('active', pressed);
      button.setAttribute('aria-pressed', String(pressed));
    }
    renderButtons(aButtons, a, '挑战 A ', 'in-A');
    renderButtons(bButtons, b, '挑战 B ', 'in-B');
    renderButtons(predictionButtons, prediction, '预测运算结果 ', 'in-A');
    current.textContent = `当前 A = ${model.formatSet(regions.a)}，B = ${model.formatSet(regions.b)}；允许空集，候选数字只属于本次有限练习。`;
    regionsText.textContent = `A 独有 ${model.formatSet(regions.aOnly)}；A、B 共有 ${model.formatSet(regions.both)}；B 独有 ${model.formatSet(regions.bOnly)}；两者之外 ${model.formatSet(regions.outside)}。`;
    renderDiagram(regions);
  }

  function clearFeedback(element) {
    element.hidden = true;
    element.textContent = '';
  }

  function toggleMembers(which, n) {
    const selected = which === 'a' ? a : which === 'b' ? b : prediction;
    if (selected.has(n)) selected.delete(n);
    else selected.add(n);
    if (which === 'prediction') clearFeedback(operationFeedback);
    else {
      activePreset = null;
      clearFeedback(relationFeedback);
      clearFeedback(operationFeedback);
    }
    render();
  }

  function buildGroup(container, which) {
    for (const n of model.domain) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.member = String(n);
      button.textContent = String(n);
      button.addEventListener('click', () => toggleMembers(which, n));
      container.append(button);
    }
  }

  function showResult(element, result) {
    element.hidden = false;
    element.className = `result-box relations-feedback${result.status === 'correct' ? '' : ' error'}`;
    element.textContent = result.feedback;
  }

  function selectedValue(fieldset) {
    return fieldset.querySelector('input:checked')?.value || '';
  }

  function witnessValue(select) {
    return select.value === '' || select.value === 'none' ? select.value : Number(select.value);
  }

  for (const select of [witnessA, witnessB]) {
    for (const n of model.domain) {
      const option = document.createElement('option');
      option.value = String(n);
      option.textContent = String(n);
      select.append(option);
    }
    select.addEventListener('change', () => clearFeedback(relationFeedback));
  }
  buildGroup(aButtons, 'a');
  buildGroup(bButtons, 'b');
  buildGroup(predictionButtons, 'prediction');
  presets.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
      const example = model.examples[button.dataset.preset];
      if (!example) return;
      a = new Set(example.a);
      b = new Set(example.b);
      prediction = new Set();
      activePreset = button.dataset.preset;
      relationChoice.querySelectorAll('input').forEach(input => { input.checked = false; });
      operationChoice.querySelectorAll('input').forEach(input => { input.checked = false; });
      witnessA.value = '';
      witnessB.value = '';
      clearFeedback(relationFeedback);
      clearFeedback(operationFeedback);
      render();
    });
  });
  relationChoice.addEventListener('change', () => clearFeedback(relationFeedback));
  operationChoice.addEventListener('change', () => clearFeedback(operationFeedback));
  document.getElementById('relations-check').addEventListener('click', () => {
    const result = model.checkRelation([...a], [...b], selectedValue(relationChoice),
      witnessValue(witnessA), witnessValue(witnessB));
    showResult(relationFeedback, result);
  });
  document.getElementById('relations-operation-check').addEventListener('click', () => {
    const result = model.checkOperation([...a], [...b], selectedValue(operationChoice), [...prediction]);
    showResult(operationFeedback, result);
  });
  render();
})();
