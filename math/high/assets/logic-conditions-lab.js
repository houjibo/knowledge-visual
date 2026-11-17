(function () {
  'use strict';
  const model = window.KVLogicConditionsModel;
  if (!model) return;
  const presets = document.getElementById('presets');
  const domainMembers = document.getElementById('domain-members');
  const pSelect = document.getElementById('condition-p');
  const qSelect = document.getElementById('condition-q');
  const statement = document.getElementById('current-statement');
  const feedback = document.getElementById('feedback');
  const result = document.getElementById('result');
  const progressStatus = document.getElementById('progress-status');
  const completed = new Set();
  let domain = new Set(model.universe);
  let activePreset = null;

  function clearPrediction() {
    document.querySelectorAll('input[name="forward"], input[name="reverse"]').forEach(input => { input.checked = false; });
    feedback.hidden = true;
    feedback.textContent = '';
    result.hidden = true;
    result.replaceChildren();
  }
  function render() {
    statement.textContent = `U = ${formatSet([...domain].sort((a, b) => a - b))}；P：${model.predicates[pSelect.value].label}；Q：${model.predicates[qSelect.value].label}。`;
    domainMembers.querySelectorAll('button').forEach(button => {
      const selected = domain.has(Number(button.dataset.number));
      button.setAttribute('aria-pressed', String(selected));
    });
    presets.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.preset === activePreset)));
    progressStatus.textContent = `固定实例已完成 ${completed.size} / 3。`;
  }
  function formatSet(values) { return values.length ? `{${values.join('，')}}` : '∅'; }
  function updateInput() { activePreset = null; clearPrediction(); render(); }
  function addParagraph(parent, content) {
    const p = document.createElement('p');
    p.textContent = content;
    parent.append(p);
  }
  function directionText(name, valid, witness, antecedentCount) {
    if (!valid) return `${name} 不成立：${witness} 满足前件却不满足后件，是反例。`;
    if (antecedentCount === 0) return `${name} 在当前 U 中成立：没有满足前件的成员，因此不存在反例（空前件）。`;
    return `${name} 在当前 U 中成立：逐个检查满足前件的成员，未找到反例。`;
  }
  for (const [id, entry] of Object.entries(model.presets)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.preset = id;
    button.textContent = entry.title;
    button.addEventListener('click', () => {
      domain = new Set(model.universe);
      pSelect.value = entry.p;
      qSelect.value = entry.q;
      activePreset = id;
      clearPrediction();
      render();
    });
    presets.append(button);
  }
  for (const number of model.universe) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.number = number;
    button.textContent = number;
    button.setAttribute('aria-label', `讨论域成员 ${number}`);
    button.addEventListener('click', () => {
      if (domain.has(number)) domain.delete(number);
      else domain.add(number);
      updateInput();
    });
    domainMembers.append(button);
  }
  for (const [id, item] of Object.entries(model.predicates)) {
    for (const select of [pSelect, qSelect]) {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = item.label;
      select.append(option);
    }
  }
  pSelect.addEventListener('change', updateInput);
  qSelect.addEventListener('change', updateInput);
  document.querySelectorAll('input[name="forward"], input[name="reverse"]').forEach(input => {
    input.addEventListener('change', () => {
      feedback.hidden = true;
      result.hidden = true;
      result.replaceChildren();
    });
  });
  pSelect.value = 'mult6';
  qSelect.value = 'mult3';
  document.getElementById('check-answer').addEventListener('click', () => {
    const forwardGuess = document.querySelector('input[name="forward"]:checked')?.value;
    const reverseGuess = document.querySelector('input[name="reverse"]:checked')?.value;
    feedback.hidden = false;
    result.hidden = true;
    result.replaceChildren();
    if (!forwardGuess || !reverseGuess) {
      feedback.className = 'feedback error';
      feedback.textContent = '请先判断 P⇒Q 和 Q⇒P 两个方向。';
      return;
    }
    const answer = model.evaluate([...domain], pSelect.value, qSelect.value);
    const wrong = [];
    if ((forwardGuess === 'yes') !== answer.forward) wrong.push('P⇒Q 的方向需重判');
    if ((reverseGuess === 'yes') !== answer.reverse) wrong.push('Q⇒P 的方向需重判');
    if (wrong.length) {
      feedback.className = 'feedback error';
      feedback.textContent = `${wrong.join('；')}。可修改预测后再核对。`;
      return;
    }
    feedback.className = 'feedback';
    feedback.textContent = '两个方向判断正确。下面用当前讨论域中的成员核验。';
    result.hidden = false;
    addParagraph(result, `U=${formatSet(answer.domain)}；满足 P 的成员 ${formatSet(answer.pMembers)}；满足 Q 的成员 ${formatSet(answer.qMembers)}。`);
    addParagraph(result, directionText('P⇒Q', answer.forward, answer.forwardCounterexample, answer.pMembers.length));
    addParagraph(result, directionText('Q⇒P', answer.reverse, answer.reverseCounterexample, answer.qMembers.length));
    const relation = answer.biconditional ? 'P 是 Q 的充要条件' : [answer.pSufficientForQ ? 'P 是 Q 的充分条件' : 'P 不是 Q 的充分条件', answer.pNecessaryForQ ? 'P 是 Q 的必要条件' : 'P 不是 Q 的必要条件'].join('；');
    addParagraph(result, `在当前 U 中：${relation}。`);
    if (activePreset) {
      addParagraph(result, `一般整数论证：${model.presets[activePreset].proof}`);
      completed.add(activePreset);
      render();
      if (completed.size === 3 && typeof PageProgress !== 'undefined') {
        const saved = PageProgress.markDone('logic-conditions');
        addParagraph(result, saved ? '三个实例已完成，学习进度已保存。' : '三个实例已完成，但学习进度尚未保存；请使用页面顶部的重试保存按钮。');
      }
    }
  });
  render();
})();
