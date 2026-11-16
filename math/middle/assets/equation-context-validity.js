(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const model = window.KVEquationContextValidity;
  if (!model) { $('validity-story').textContent = '练习加载失败，请刷新页面。'; return; }
  const selector = $('validity-case');
  const cards = $('validity-candidates');
  const choice = $('validity-choice');
  const submit = $('validity-submit');
  let checked = new Set();
  function current() { return model.getCase(selector.value); }
  function resetFinal() {
    choice.disabled = checked.size !== current().candidates.length;
    submit.disabled = choice.disabled;
    choice.value = '';
    $('validity-final-feedback').textContent = choice.disabled ? '请先检查所有候选数。' : '请选择实际方案。';
  }
  function renderCase() {
    const item = current();
    checked = new Set();
    $('validity-story').textContent = item.story;
    $('validity-equation').textContent = `已列出方程：${item.equation}。判断候选数，再确定是否有实际方案。`;
    cards.replaceChildren();
    choice.replaceChildren();
    choice.add(new Option('请选择', ''));
    item.candidates.forEach((value, index) => {
      const label = model.display(value);
      const card = document.createElement('section');
      card.className = 'validity-card';
      card.innerHTML = `<h4>候选数 x = ${label}</h4>
        <div class="validity-row">
          <label for="validity-eq-${index}">代入后满足方程吗？<select id="validity-eq-${index}"><option value="">请选择</option><option value="yes">是</option><option value="no">否</option></select></label>
          <label for="validity-domain-${index}">符合非负整数件数吗？<select id="validity-domain-${index}"><option value="">请选择</option><option value="yes">是</option><option value="no">否</option></select></label>
          <button type="button" class="bal-btn primary" id="validity-check-${index}">检查这两个判断</button>
        </div><p id="validity-feedback-${index}" class="validity-feedback" role="status" aria-live="polite">请选择两项。</p>
        <div id="validity-bars-${index}" class="validity-bars" hidden>
          <label for="validity-left-${index}">方程左边金额 <meter id="validity-left-${index}" min="0" value="0"></meter></label>
          <label for="validity-right-${index}">目标金额 <meter id="validity-right-${index}" min="0" value="0"></meter></label>
        </div>`;
      cards.append(card);
      choice.add(new Option(`${label} 件`, String(value)));
      const eq = $(`validity-eq-${index}`);
      const domain = $(`validity-domain-${index}`);
      const feedback = $(`validity-feedback-${index}`);
      for (const field of [eq, domain]) field.addEventListener('change', () => {
        checked.delete(index);
        $(`validity-bars-${index}`).hidden = true;
        feedback.textContent = '判断已改变，请重新检查。';
        resetFinal();
      });
      $(`validity-check-${index}`).addEventListener('click', () => {
        if (!eq.value || !domain.value) { feedback.textContent = '请分别选择两项判断。'; return; }
        const result = model.inspect(item, value);
        if ((eq.value === 'yes') !== result.equation || (domain.value === 'yes') !== result.allowed) {
          checked.delete(index);
          $(`validity-bars-${index}`).hidden = true;
          feedback.textContent = '至少一项不对：先代入算等式，再单独检查是否为非负整数。';
          resetFinal();
          return;
        }
        checked.add(index);
        const max = Math.max(result.lhs, item.total, 1);
        const left = $(`validity-left-${index}`);
        const right = $(`validity-right-${index}`);
        left.max = right.max = max;
        left.value = result.lhs;
        right.value = item.total;
        left.setAttribute('aria-label', `方程左边金额 ${result.lhs} 元`);
        right.setAttribute('aria-label', `目标金额 ${item.total} 元`);
        $(`validity-bars-${index}`).hidden = false;
        feedback.textContent = `正确：${item.coefficient} × (${label}) + ${item.fixed} = ${model.display(result.lhs * 2)}，${result.equation ? '等于' : '不等于'} ${item.total}；${label} ${result.allowed ? '是' : '不是'}非负整数。`;
        resetFinal();
      });
    });
    choice.add(new Option('无实际方案', 'none'));
    resetFinal();
  }
  model.cases.forEach(item => selector.add(new Option(item.label, item.id)));
  selector.disabled = false;
  selector.addEventListener('change', renderCase);
  choice.addEventListener('change', () => { $('validity-final-feedback').textContent = '选择后检查实际方案。'; });
  $('validity-final').addEventListener('submit', event => {
    event.preventDefault();
    if (checked.size !== current().candidates.length) return;
    const item = current();
    if (!choice.value) { $('validity-final-feedback').textContent = '请选择候选件数或无实际方案。'; return; }
    const actual = model.actualSolution(item);
    const expected = actual === null ? 'none' : String(actual);
    if (choice.value !== expected) {
      $('validity-final-feedback').textContent = '再检查：实际方案必须同时满足方程和非负整数件数条件。';
      return;
    }
    $('validity-final-feedback').textContent = actual === null
      ? `正确：没有实际方案；这个一元一次方程的唯一代数解是 ${model.display(item.solution)}，但它不符合非负整数件数条件，因此不是方程无解。`
      : `正确：${model.display(actual)} 件同时满足方程与件数条件，是实际方案。`;
  });
  renderCase();
})();
