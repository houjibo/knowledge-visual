(function () {
  'use strict';
  const model = window.KVSetSubsetsModel;
  const lab = document.getElementById('set-subsets-lab');
  if (!model || !lab) return;
  const aGroup = document.getElementById('set-subsets-a');
  const candidateGroup = document.getElementById('set-subsets-candidates');
  const current = document.getElementById('set-subsets-current');
  const count = document.getElementById('set-subsets-count');
  const feedback = document.getElementById('set-subsets-feedback');
  let a = 3;
  let selected = new Set();

  function clearFeedback() {
    feedback.hidden = true;
    feedback.textContent = '';
  }
  function render() {
    current.textContent = `当前 A = ${model.format(a)}。请找出 A 的全部子集；候选卡来自 U，可能含有 A 以外的元素。`;
    aGroup.querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', String(Boolean(a & (1 << Number(button.dataset.index)))));
    });
    candidateGroup.querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', String(selected.has(Number(button.dataset.mask))));
    });
  }

  model.objects.forEach((name, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'op-btn';
    button.textContent = name;
    button.dataset.index = String(index);
    button.setAttribute('aria-label', `A 中包含 ${name}`);
    button.addEventListener('click', () => {
      a ^= 1 << index;
      selected = new Set();
      count.value = '';
      clearFeedback();
      render();
    });
    aGroup.append(button);
  });
  model.candidates.forEach(mask => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'op-btn';
    button.textContent = model.format(mask);
    button.dataset.mask = String(mask);
    button.setAttribute('aria-label', `候选子集 ${model.format(mask)}`);
    button.addEventListener('click', () => {
      if (selected.has(mask)) selected.delete(mask);
      else selected.add(mask);
      clearFeedback();
      render();
    });
    candidateGroup.append(button);
  });
  count.addEventListener('change', clearFeedback);
  document.getElementById('set-subsets-check').addEventListener('click', () => {
    const result = model.check(a, count.value === '' ? '' : Number(count.value), [...selected]);
    feedback.hidden = false;
    feedback.className = `result-box${result.status === 'correct' ? '' : ' error'}`;
    feedback.textContent = result.feedback;
  });
  render();
})();
