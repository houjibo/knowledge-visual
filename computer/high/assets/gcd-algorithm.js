(function () {
  'use strict';
  const Model = window.HighGcdAlgorithmModel;
  const byId = id => document.getElementById(id);
  const fields = {condition: 'block-condition', remainder: 'block-remainder', updateA: 'block-update-a', updateB: 'block-update-b', output: 'block-output'};
  const labels = {
    condition: {'while-b-nonzero': '当 b ≠ 0 时循环', 'while-b-zero': '当 b = 0 时循环', 'while-a-diff-b': '当 a ≠ b 时循环'},
    remainder: {'save-remainder': 'r ← a mod b', 'save-sum': 'r ← a + b', 'skip-remainder': '不保存余数'},
    updateA: {'assign-old-b': 'a ← b（旧 b）', 'assign-old-a': 'a ← a（不变）', 'assign-remainder': 'a ← r'},
    updateB: {'assign-remainder': 'b ← r', 'assign-old-a': 'b ← a（旧 a）', 'assign-zero': 'b ← 0'},
    output: {'return-a': '输出 a', 'return-b': '输出 b', 'return-remainder': '输出 r'}
  };
  const done = {construction: false, positive: false, boundary: false, efficiency: false, risk: false};
  let activeRun = null;
  let predictionReady = false;
  let draftWasRun = false;

  function feedback(element, message, kind = '') {
    element.textContent = message;
    element.classList.remove('success', 'error', 'warning');
    if (kind) element.classList.add(kind);
  }

  function choices() {
    return Object.fromEntries(Object.entries(fields).map(([key, id]) => [key, byId(id).value]));
  }

  function readNumbers() { return [byId('number-a').valueAsNumber, byId('number-b').valueAsNumber]; }

  function renderRepresentations() {
    const selected = choices();
    for (const [key] of Object.entries(fields)) {
      const node = document.querySelector(`[data-flow="${key}"]`);
      node.textContent = labels[key][selected[key]] || '等待选择';
      node.closest('[data-node]').dataset.state = done.construction ? 'correct' : selected[key] ? 'active' : '';
    }
    byId('pseudocode').textContent = [
      '输入非负整数 a、b；(a,b) ≠ (0,0)',
      `${labels.condition[selected.condition] || '选择循环条件'}：`,
      `  ${labels.remainder[selected.remainder] || '选择余数计算'}`,
      `  ${labels.updateA[selected.updateA] || '选择 a 的更新'}`,
      `  ${labels.updateB[selected.updateB] || '选择 b 的更新'}`,
      `循环结束后：${labels.output[selected.output] || '选择输出步骤'}`
    ].join('\n');
    byId('flowchart').setAttribute('aria-label', `辗转相除法流程图：${Object.entries(fields).map(([key]) => labels[key][selected[key]] || '未选择').join('；')}`);
  }

  function renderDone() {
    const names = {construction: '构造余数循环', positive: '预测并验证正整数案例', boundary: '验证一个输入为零的边界', efficiency: '比较同输入的算法操作次数', risk: '用反例发现固定草案的终止风险'};
    for (const [key, name] of Object.entries(names)) {
      const item = document.querySelector(`[data-step="${key}"]`);
      item.textContent = `${done[key] ? '✓ 已完成' : '○ 待完成'} · ${name}`;
      item.dataset.done = String(done[key]);
    }
  }

  function saveCompletion() {
    if (!Object.values(done).every(Boolean)) return;
    const progress = window.SubjectProgress.read('computer', 'high');
    if (progress === null) {
      feedback(byId('progress-status'), '学习任务已完成，但本机进度无法读取或保存；修复浏览器存储后可重试。', 'warning');
      byId('retry-save').hidden = false;
      return;
    }
    if (window.SubjectProgress.markComplete('computer', 'high', 'gcd-algorithm')) {
      feedback(byId('progress-status'), '本机已保存：最大公约数算法工作台已完成。', 'success');
      byId('retry-save').hidden = true;
    } else {
      feedback(byId('progress-status'), '学习任务已完成，但本机进度未能保存；修复存储后可重试。', 'warning');
      byId('retry-save').hidden = false;
    }
  }

  function renderProgress() {
    const value = window.SubjectProgress.read('computer', 'high');
    if (value === null) feedback(byId('progress-status'), '本机学习进度暂不可用；实验仍可继续。', 'warning');
    else if (value['gcd-algorithm']) feedback(byId('progress-status'), '本机已记录完成；仍可继续操作和复习。', 'success');
  }

  function renderControls() {
    byId('check-prediction').disabled = !done.construction;
    byId('step-run').disabled = !predictionReady;
    byId('run-all').disabled = !predictionReady;
    byId('compare').disabled = !done.construction;
    byId('run-draft').disabled = false;
  }

  function resetRun() {
    predictionReady = false;
    activeRun = null;
    byId('trace').replaceChildren();
    byId('state-bars').replaceChildren();
    byId('run-summary').textContent = '预测正确后可运行算法。';
    feedback(byId('prediction-status'), '先构造算法，再输入预测值。');
    renderControls();
  }

  function checkConstruction() {
    const result = Model.validateConstruction(choices());
    done.construction = result.valid;
    resetRun();
    if (result.valid) feedback(byId('construction-status'), '步骤正确：先保存余数，再按旧 b 更新 a，最后令 b 接收余数。', 'success');
    else feedback(byId('construction-status'), result.errors.join(' '), 'error');
    renderRepresentations();
    renderDone();
  }

  function validateCurrentNumbers() {
    const [a, b] = readNumbers();
    const check = Model.validateInput(a, b);
    if (!check.valid) feedback(byId('prediction-status'), check.reason, 'error');
    return check.valid ? {a, b} : null;
  }

  function checkPrediction() {
    if (!done.construction) return;
    const current = validateCurrentNumbers();
    if (!current) return;
    const expected = Model.runEuclid(current.a, current.b).gcd;
    const prediction = byId('prediction').valueAsNumber;
    predictionReady = Number.isSafeInteger(prediction) && prediction === expected;
    activeRun = predictionReady ? {result: Model.runEuclid(current.a, current.b), visible: 0, a: current.a, b: current.b} : null;
    byId('trace').replaceChildren();
    byId('state-bars').replaceChildren();
    if (!predictionReady) feedback(byId('prediction-status'), `再检查预测；可以从最大公约数的含义和第一轮余数入手。`, 'error');
    else feedback(byId('prediction-status'), '预测正确。逐步运行，观察余数怎样缩小并把原问题交给下一轮。', 'success');
    byId('run-summary').textContent = '选择“下一轮”或“运行到结束”。';
    renderControls();
  }

  function renderState(a, b, remainder = null) {
    const max = Math.max(1, a, b, remainder || 0);
    const values = [{name: 'a', value: a, color: 'a'}, {name: 'b', value: b, color: 'b'}];
    if (remainder !== null) values.push({name: '余数 r', value: remainder, color: 'r'});
    byId('state-bars').replaceChildren(...values.map(item => {
      const row = document.createElement('div');
      row.className = 'state-row';
      const label = document.createElement('strong');
      label.textContent = `${item.name} = ${item.value}`;
      const track = document.createElement('div');
      track.className = 'state-track';
      const bar = document.createElement('span');
      bar.className = `state-fill ${item.color}`;
      bar.style.width = `${Math.max(item.value === 0 ? 0 : 4, item.value / max * 100)}%`;
      track.append(bar);
      row.append(label, track);
      return row;
    }));
  }

  function renderRun(showAll) {
    if (!activeRun) return;
    const {result} = activeRun;
    if (showAll) activeRun.visible = result.trace.length;
    else activeRun.visible = Math.min(result.trace.length, activeRun.visible + 1);
    const visible = result.trace.slice(0, activeRun.visible);
    const nodes = visible.map(step => {
      const li = document.createElement('li');
      if (step.kind === 'remainder') {
        li.textContent = `第 ${step.iteration} 轮：${step.a} mod ${step.b} = ${step.remainder}；下一轮使用 a=${step.nextA}, b=${step.nextB}。`;
        renderState(step.nextA, step.nextB, step.remainder);
      } else {
        li.textContent = `停止：b = 0，输出 a = ${step.a}。`;
        renderState(step.a, step.b);
      }
      return li;
    });
    byId('trace').replaceChildren(...nodes);
    const finished = activeRun.visible >= result.trace.length;
    if (finished) {
      if (activeRun.a > 0 && activeRun.b > 0) done.positive = true;
      else done.boundary = true;
      byId('run-summary').textContent = `运行完成：最大公约数为 ${result.gcd}；余数运算 ${result.operations} 轮后终止。`;
      feedback(byId('prediction-status'), '状态轨迹与预测一致。可继续比较算法。', 'success');
      saveCompletion();
    } else {
      byId('run-summary').textContent = `已显示 ${activeRun.visible}/${result.trace.length} 个状态步骤。`;
    }
    renderDone();
    renderControls();
  }

  function renderComparison() {
    const current = validateCurrentNumbers();
    if (!current) return;
    if (current.a === 0 || current.b === 0) {
      feedback(byId('compare-status'), '效率对照要求两个正整数；零值边界只用于验证定义域和终止。', 'warning');
      return;
    }
    const result = Model.compareAlgorithms(current.a, current.b);
    if (!result.sameResult) {
      feedback(byId('compare-status'), '模型结果不一致，暂不展示比较。', 'error');
      return;
    }
    const max = Math.max(1, result.euclid.operations, result.subtraction.operations);
    byId('euclid-count').textContent = `${result.euclid.operations} 轮余数运算`;
    byId('subtract-count').textContent = `${result.subtraction.operations} 次相减`;
    byId('euclid-bar').style.width = `${Math.max(result.euclid.operations === 0 ? 0 : 2, result.euclid.operations / max * 100)}%`;
    byId('subtract-bar').style.width = `${Math.max(result.subtraction.operations === 0 ? 0 : 2, result.subtraction.operations / max * 100)}%`;
    byId('comparison-summary').textContent = `${current.a} 与 ${current.b} 的最大公约数都为 ${result.gcd}。`;
    feedback(byId('compare-status'), '两个算法得到相同结果。图中比较的是循环主体操作次数，不是机器运行时间。', 'success');
    done.efficiency = true;
    renderDone();
    saveCompletion();
  }

  function renderDraft() {
    const [a, b] = byId('draft-case').value.split(',').map(Number);
    const judgement = byId('draft-judgement').value;
    let result;
    try { result = Model.runFixedDraft(a, b); }
    catch (error) { feedback(byId('draft-status'), error.message, 'error'); return; }
    const trace = result.trace.map(step => `第 ${step.step} 步：(${step.beforeA}, ${step.beforeB}) → (${step.a}, ${step.b})${step.repeatedState ? '，重复状态' : ''}`).join('；');
    byId('draft-trace').textContent = trace || `草案立即输出 ${result.result}。`;
    draftWasRun = true;
    const risk = !result.terminated;
    if (judgement === (risk ? 'non-terminating' : 'terminating')) {
      done.risk = true;
      feedback(byId('draft-status'), `判断正确。模拟在 ${result.operations} 步安全停止${result.repeatedState ? '，检测到状态没有前进' : ''}。这是固定错误样例，不是实时 AI 输出。`, 'success');
      saveCompletion();
    } else {
      feedback(byId('draft-status'), `判断不符。模拟器已在 ${result.operations} 步安全停止；检查是否出现重复状态。`, 'error');
    }
    renderDone();
  }

  for (const id of Object.values(fields)) byId(id).addEventListener('change', () => {
    done.construction = false;
    resetRun();
    feedback(byId('construction-status'), '步骤已变化；重新检查算法结构。');
    renderRepresentations();
    renderDone();
  });
  byId('check-construction').addEventListener('click', checkConstruction);
  byId('check-prediction').addEventListener('click', checkPrediction);
  byId('step-run').addEventListener('click', () => renderRun(false));
  byId('run-all').addEventListener('click', () => renderRun(true));
  byId('compare').addEventListener('click', renderComparison);
  byId('run-draft').addEventListener('click', renderDraft);
  byId('retry-save').addEventListener('click', saveCompletion);
  byId('number-a').addEventListener('input', resetRun);
  byId('number-b').addEventListener('input', resetRun);
  document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => {
    const [a, b] = button.dataset.preset.split(',');
    byId('number-a').value = a;
    byId('number-b').value = b;
    byId('prediction').value = '';
    resetRun();
  }));
  byId('draft-case').addEventListener('change', () => { done.risk = false; draftWasRun = false; byId('draft-trace').textContent = '选择输入后检查固定样例。'; feedback(byId('draft-status'), '先作判断，再运行样例。'); renderDone(); });
  byId('draft-judgement').addEventListener('change', () => { done.risk = false; renderDone(); });

  renderRepresentations();
  renderDone();
  renderControls();
  renderProgress();
})();
