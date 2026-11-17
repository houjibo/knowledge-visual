(function () {
  'use strict';
  const model = window.KVLogicQuantifiersModel;
  if (!model) return;
  const presetsNode = document.getElementById('presets');
  const membersNode = document.getElementById('domain-members');
  const predicate = document.getElementById('predicate');
  const statement = document.getElementById('current-statement');
  const progress = document.getElementById('progress-status');
  const feedback = document.getElementById('feedback');
  const result = document.getElementById('result');
  const evidenceInputs = [document.getElementById('universal-counterexample'), document.getElementById('existential-witness')];
  const formInputs = ['negate-all-quantifier', 'negate-all-polarity', 'negate-exists-quantifier', 'negate-exists-polarity'].map(id => document.getElementById(id));
  const answers = [...document.querySelectorAll('input[name="forall-truth"], input[name="exists-truth"]'), ...evidenceInputs, ...formInputs];
  const completed = new Set();
  let domain = new Set(model.universe);
  let activePreset = null;

  function formatSet(values) { return values.length ? `{${values.join('，')}}` : '∅'; }
  function truth(value) { return value ? '真' : '假'; }
  function addParagraph(target, content) { const p = document.createElement('p'); p.textContent = content; target.append(p); }
  function hideOutput() { feedback.hidden = true; feedback.textContent = ''; result.hidden = true; result.replaceChildren(); }
  function renderPreview(prefix) {
    const quantifier = document.getElementById(`${prefix}-quantifier`).value;
    const polarity = document.getElementById(`${prefix}-polarity`).value;
    document.getElementById(`${prefix}-preview`).textContent = quantifier && polarity
      ? `你写的是：${quantifier === 'forall' ? '∀' : '∃'}n∈U ${polarity === 'not' ? '¬' : ''}R(n)` : '请选择量词和谓词。';
  }
  function fillEvidenceOptions() {
    for (const select of evidenceInputs) {
      select.replaceChildren(new Option('请选择', ''), new Option('无', 'none'));
      for (const n of [...domain].sort((a, b) => a - b)) select.add(new Option(String(n), String(n)));
    }
  }
  function resetAnswers() {
    answers.forEach(input => { if (input.type === 'radio') input.checked = false; else input.value = ''; });
    fillEvidenceOptions();
    renderPreview('negate-all');
    renderPreview('negate-exists');
    hideOutput();
  }
  function render() {
    const values = [...domain].sort((a, b) => a - b);
    statement.textContent = `U=${formatSet(values)}；R(n)：${model.predicates[predicate.value].label}。判断“∀n∈U R(n)”与“∃n∈U R(n)”。`;
    membersNode.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(domain.has(Number(button.dataset.number)))));
    presetsNode.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.preset === activePreset)));
    progress.textContent = `固定实例已完成 ${completed.size} / 4。${typeof PageProgress !== 'undefined' && PageProgress.isDone('logic-quantifiers') ? '本机已有本主题完成记录。' : ''}`;
  }
  function changedInput() { activePreset = null; resetAnswers(); render(); }

  for (const [id, preset] of Object.entries(model.presets)) {
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.preset = id; button.textContent = preset.title;
    button.addEventListener('click', () => {
      domain = new Set(preset.domain); predicate.value = preset.predicate; activePreset = id;
      resetAnswers(); render();
    });
    presetsNode.append(button);
  }
  for (const n of model.universe) {
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.number = n; button.textContent = n;
    button.setAttribute('aria-label', `讨论域成员 ${n}`);
    button.addEventListener('click', () => { if (domain.has(n)) domain.delete(n); else domain.add(n); changedInput(); });
    membersNode.append(button);
  }
  for (const [id, entry] of Object.entries(model.predicates)) predicate.add(new Option(entry.label, id));
  predicate.value = 'positive';
  predicate.addEventListener('change', changedInput);
  for (const input of answers) input.addEventListener('change', () => {
    hideOutput();
    renderPreview('negate-all'); renderPreview('negate-exists');
  });

  document.getElementById('check-answer').addEventListener('click', () => {
    const forallGuess = document.querySelector('input[name="forall-truth"]:checked')?.value;
    const existsGuess = document.querySelector('input[name="exists-truth"]:checked')?.value;
    const [universalChoice, existentialChoice] = evidenceInputs.map(input => input.value);
    const [allQuantifier, allPolarity, existsQuantifier, existsPolarity] = formInputs.map(input => input.value);
    feedback.hidden = false;
    result.hidden = true;
    result.replaceChildren();
    if (![forallGuess, existsGuess, universalChoice, existentialChoice, allQuantifier, allPolarity, existsQuantifier, existsPolarity].every(Boolean)) {
      feedback.className = 'feedback error';
      feedback.textContent = '请先填完两个真值、两处证据和两种否定式。';
      return;
    }
    const evaluated = model.evaluate([...domain], predicate.value);
    const errors = [];
    if ((forallGuess === 'yes') !== evaluated.forall) errors.push('全称命题的真值需重判');
    if ((existsGuess === 'yes') !== evaluated.exists) errors.push('存在命题的真值需重判');
    if (evaluated.forall ? universalChoice !== 'none' : !evaluated.nonmatches.includes(Number(universalChoice))) errors.push('全称命题的反例需重选');
    if (evaluated.exists ? !evaluated.matches.includes(Number(existentialChoice)) : existentialChoice !== 'none') errors.push('存在命题的见证需重选');
    if (allQuantifier !== 'exists' || allPolarity !== 'not') errors.push(allQuantifier === 'exists' && allPolarity === 'plain' ? '全称命题的否定还需否定谓词' : '全称命题的否定式需重写');
    if (existsQuantifier !== 'forall' || existsPolarity !== 'not') errors.push(existsQuantifier === 'forall' && existsPolarity === 'plain' ? '存在命题的否定还需否定谓词' : '存在命题的否定式需重写');
    if (errors.length) {
      feedback.className = 'feedback error';
      feedback.textContent = `${errors.join('；')}。可修改后再核对。`;
      return;
    }
    feedback.className = 'feedback';
    feedback.textContent = '真值、证据与两种否定式均正确。';
    result.hidden = false;
    addParagraph(result, `U=${formatSet(evaluated.domain)}；满足 R 的成员 ${formatSet(evaluated.matches)}；不满足 R 的成员 ${formatSet(evaluated.nonmatches)}。`);
    addParagraph(result, `∀n∈U R(n) 为${truth(evaluated.forall)}：${evaluated.forall ? '当前 U 中没有反例。' : `${universalChoice} 是反例。`}`);
    addParagraph(result, `∃n∈U R(n) 为${truth(evaluated.exists)}：${evaluated.exists ? `${existentialChoice} 是见证。` : '当前 U 中没有见证。'}`);
    addParagraph(result, `¬(∀n∈U R(n)) ⇔ ∃n∈U ¬R(n)，两边均为${truth(evaluated.notForall)}。`);
    addParagraph(result, `¬(∃n∈U R(n)) ⇔ ∀n∈U ¬R(n)，两边均为${truth(evaluated.notExists)}。`);
    if (evaluated.domain.length === 0) addParagraph(result, '空域中没有成员，全称命题为真、存在命题为假；这不是对更大讨论域的结论。');
    if (activePreset) {
      completed.add(activePreset);
      if (completed.size === 4 && typeof PageProgress !== 'undefined') {
        const saved = PageProgress.markDone('logic-quantifiers');
        addParagraph(result, saved ? '四个实例已完成，学习进度已保存。' : '四个实例已完成，但进度暂未保存；请使用页面顶部的重试保存按钮。');
      }
      render();
    }
  });
  resetAnswers(); render();
})();
