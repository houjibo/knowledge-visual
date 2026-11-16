(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const model = window.KVInequalityContext;
  if (!model) {
    $('context-story').textContent = '情境练习加载失败，请刷新页面。';
    return;
  }
  const select = $('context-scenario');
  const expressionForm = $('context-expression');
  const boundaryForm = $('context-boundary');
  const slider = $('context-trial');
  const answer = $('context-answer');
  let expressionCorrect = false;
  function current() { return model.getScenario(select.value); }
  function resetFollowup() {
    expressionCorrect = false;
    slider.disabled = true;
    slider.value = '0';
    $('context-trial-value').textContent = '0';
    $('context-trial-feedback').textContent = '列式正确后可试代。';
    answer.value = '';
    answer.disabled = true;
    $('context-reason').value = '';
    $('context-reason').disabled = true;
    $('context-answer-submit').disabled = true;
    $('context-answer-feedback').textContent = '列式正确后填写非负整数。';
  }
  function renderScenario() {
    const s = current();
    expressionForm.reset();
    boundaryForm.reset();
    resetFollowup();
    $('context-story').textContent = s.story;
    $('context-answer-label').textContent = `${s.kind === 'max' ? '最多' : '最少'}多少${s.unit}？`;
    $('context-expression-feedback').textContent = '先根据情境填写各项。';
  }
  function showTrial() {
    if (!expressionCorrect) return;
    const s = current();
    const t = model.trial(s, slider.value);
    $('context-trial-value').textContent = String(t.n);
    $('context-trial-feedback').textContent = `试代 x = ${t.n}：${s.coefficient} × ${t.n} + ${s.fixed} = ${t.total}，${t.meets ? '满足' : '不满足'}${s.relation === 'le' ? '不超过' : '至少'} ${s.limit} 的条件。`;
  }
  model.scenarios.forEach(s => {
    const option = document.createElement('option');
    option.value = s.id;
    option.textContent = s.label;
    select.append(option);
  });
  select.disabled = false;
  $('context-expression-submit').disabled = false;
  select.addEventListener('change', renderScenario);
  expressionForm.addEventListener('input', () => {
    resetFollowup();
    $('context-expression-feedback').textContent = '列式已改变，请重新检查。';
  });
  expressionForm.addEventListener('submit', event => {
    event.preventDefault();
    const s = current();
    if (!model.checkExpression(s, $('context-coefficient').value.trim(), $('context-fixed').value.trim(), $('context-relation').value, $('context-limit').value.trim())) {
      resetFollowup();
      $('context-expression-feedback').textContent = '还不对：检查每份增加量、起始量、限制值，以及“不超过”或“至少”是否含等号。请修改后重试。';
      return;
    }
    expressionCorrect = true;
    $('context-expression-feedback').textContent = `正确：${s.coefficient}x + ${s.fixed} ${s.relation === 'le' ? '≤' : '≥'} ${s.limit}。接着试代并找整数边界。`;
    slider.disabled = false;
    answer.disabled = false;
    $('context-reason').disabled = false;
    $('context-answer-submit').disabled = false;
    showTrial();
  });
  slider.addEventListener('input', showTrial);
  boundaryForm.addEventListener('input', () => { $('context-answer-feedback').textContent = '填写数量并选择依据后检查。'; });
  boundaryForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!expressionCorrect) return;
    const s = current();
    const n = model.integer(answer.value.trim());
    const target = model.boundary(s);
    if (n === null) {
      $('context-answer-feedback').textContent = '请输入非负整数，不要填写单位或小数。';
      return;
    }
    if (n !== target) {
      $('context-answer-feedback').textContent = '还不对。比较边界附近两个相邻整数，并检查哪个满足实际条件。';
      return;
    }
    if ($('context-reason').value !== (s.kind === 'max' ? 'floor' : 'ceil')) {
      $('context-answer-feedback').textContent = '数量正确，再想想：是不能超过上限，还是必须达到最低目标？数量能是小数吗？';
      return;
    }
    const continuous = (s.limit - s.fixed) / s.coefficient;
    const neighbor = s.kind === 'max' ? n + 1 : n - 1;
    const nearTotal = s.coefficient * neighbor + s.fixed;
    const total = s.coefficient * n + s.fixed;
    const adjacent = neighbor >= 0 ? `${neighbor}${s.unit}时为 ${nearTotal}，不满足；` : '';
    $('context-answer-feedback').textContent = `正确，${s.kind === 'max' ? '最多' : '最少'} ${n} ${s.unit}。连续解为 x ${s.relation === 'le' ? '≤' : '≥'} ${continuous}，但 x 必须是非负整数；${n}${s.unit}时为 ${total}，满足；${adjacent}${s.kind === 'max' ? '向下' : '向上'}取到符合条件的整数。`;
  });
  renderScenario();
})();
