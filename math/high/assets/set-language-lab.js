/* Three finite set-language conversions with a live Venn preview. */
(function () {
  'use strict';
  const model = window.KVSetLanguageModel;
  const lab = document.getElementById('language-lab');
  if (!model || !lab) return;

  const ns = 'http://www.w3.org/2000/svg';
  const step = document.getElementById('language-step');
  const source = document.getElementById('language-source');
  const sourceDiagram = document.getElementById('language-source-diagram');
  const targetPrompt = document.getElementById('language-target-prompt');
  const members = document.getElementById('language-members');
  const options = document.getElementById('language-options');
  const previewLabel = document.getElementById('language-preview-label');
  const preview = document.getElementById('language-preview');
  const feedback = document.getElementById('language-feedback');
  const submit = document.getElementById('language-submit');
  const next = document.getElementById('language-next');
  const restart = document.getElementById('language-restart');
  let roundIndex = 0;
  let chosen = new Set();
  let solved = false;

  function svgNode(tag, attributes = {}, value) {
    const node = document.createElementNS(ns, tag);
    for (const [name, content] of Object.entries(attributes)) node.setAttribute(name, String(content));
    if (value !== undefined) node.textContent = String(value);
    return node;
  }

  function baseDiagram(label) {
    const svg = svgNode('svg', {viewBox: '0 0 320 180', role: 'img', 'aria-label': label});
    svg.append(svgNode('rect', {x: 10, y: 10, width: 300, height: 160, rx: 8, class: 'language-universe'}));
    svg.append(svgNode('text', {x: 25, y: 30, class: 'language-svg-label'}, 'U'));
    return svg;
  }

  function addNumbers(svg, values, positions) {
    values.forEach((number, index) => {
      const [x, y] = positions[index];
      svg.append(svgNode('text', {x, y, class: 'language-svg-number', 'text-anchor': 'middle'}, number));
    });
  }

  function drawChosenDiagram(round) {
    const inside = model.universe.filter(n => chosen.has(n));
    const outside = model.universe.filter(n => !chosen.has(n));
    const label = `当前选择：${round.targetName} 内 ${inside.length ? inside.join('、') : '无'}；外 ${outside.join('、')}`;
    const svg = baseDiagram(label);
    svg.append(svgNode('circle', {cx: 120, cy: 95, r: 64, class: 'language-circle-a'}));
    svg.append(svgNode('text', {x: 120, y: 48, class: 'language-svg-label', 'text-anchor': 'middle'}, round.targetName));
    const insidePositions = [[105, 72], [135, 72], [105, 99], [135, 99], [105, 126], [135, 126]];
    const outsidePositions = [[230, 72], [264, 72], [230, 99], [264, 99], [230, 126], [264, 126]];
    addNumbers(svg, inside, insidePositions);
    addNumbers(svg, outside, outsidePositions);
    preview.replaceChildren(svg);
  }

  function drawSourceVenn(round) {
    const regions = model.regionsFor(round.id);
    const svg = baseDiagram(`集合 A 独有 ${regions.aOnly.join('、')}；A 与 B 共同有 ${regions.both.join('、')}；集合 B 独有 ${regions.bOnly.join('、')}；两者之外有 ${regions.outside.join('、')}`);
    svg.append(svgNode('circle', {cx: 120, cy: 90, r: 70, class: 'language-circle-a'}));
    svg.append(svgNode('circle', {cx: 200, cy: 90, r: 70, class: 'language-circle-b'}));
    svg.append(svgNode('text', {x: 95, y: 45, class: 'language-svg-label', 'text-anchor': 'middle'}, 'A'));
    svg.append(svgNode('text', {x: 225, y: 45, class: 'language-svg-label', 'text-anchor': 'middle'}, 'B'));
    addNumbers(svg, regions.aOnly, [[82, 96]]);
    addNumbers(svg, regions.both, [[160, 77], [160, 108]]);
    addNumbers(svg, regions.bOnly, [[238, 96]]);
    addNumbers(svg, regions.outside, [[34, 148], [286, 148]]);
    sourceDiagram.replaceChildren(svg);
  }

  function clearFeedback() {
    feedback.hidden = true;
    feedback.textContent = '';
  }

  function renderRound() {
    const round = model.rounds[roundIndex];
    chosen = new Set();
    solved = false;
    step.textContent = `第 ${roundIndex + 1} / ${model.rounds.length} 轮`;
    source.textContent = round.source;
    targetPrompt.textContent = round.targetPrompt;
    previewLabel.textContent = `你构造的 ${round.targetName}：选择元素后观察图示`;
    sourceDiagram.hidden = round.kind !== 'venn';
    if (round.kind === 'venn') drawSourceVenn(round);
    else sourceDiagram.replaceChildren();
    members.replaceChildren();
    for (const number of model.universe) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'set-element in-none';
      button.textContent = number;
      button.setAttribute('aria-label', `选择结果元素 ${number}`);
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        if (solved) return;
        if (chosen.has(number)) chosen.delete(number);
        else chosen.add(number);
        button.className = `set-element ${chosen.has(number) ? 'in-A' : 'in-none'}`;
        button.setAttribute('aria-pressed', String(chosen.has(number)));
        drawChosenDiagram(round);
        clearFeedback();
      });
      members.append(button);
    }
    options.replaceChildren();
    for (const option of round.options) {
      const label = document.createElement('label');
      label.className = 'language-option';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'language-expression';
      radio.value = option.id;
      radio.addEventListener('change', clearFeedback);
      const text = document.createElement('span');
      text.textContent = option.text;
      label.append(radio, text);
      options.append(label);
    }
    drawChosenDiagram(round);
    clearFeedback();
    submit.disabled = false;
    next.hidden = true;
    restart.hidden = true;
  }

  submit.addEventListener('click', () => {
    if (solved) return;
    const round = model.rounds[roundIndex];
    const selectedOption = options.querySelector('input:checked');
    const result = model.checkAnswer(round.id, [...chosen], selectedOption?.value);
    feedback.hidden = false;
    feedback.className = `result-box${result.status === 'correct' ? '' : ' error'}`;
    feedback.textContent = result.feedback;
    if (result.status !== 'correct') return;
    solved = true;
    members.querySelectorAll('button').forEach(button => { button.disabled = true; });
    options.querySelectorAll('input').forEach(input => { input.disabled = true; });
    submit.disabled = true;
    if (roundIndex === model.rounds.length - 1) {
      feedback.textContent += ' 三轮转换已完成；可重新开始。';
      restart.hidden = false;
    } else next.hidden = false;
  });

  next.addEventListener('click', () => {
    if (!solved || roundIndex >= model.rounds.length - 1) return;
    roundIndex += 1;
    renderRound();
    step.focus();
  });
  restart.addEventListener('click', () => {
    roundIndex = 0;
    renderRound();
    step.focus();
  });
  renderRound();
})();
