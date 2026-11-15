(function () {
  'use strict';
  const Model = window.HighAlgorithmFlowchartModel;
  const byId = id => document.getElementById(id);
  const progressKey = 'computer/high/algorithm-flowchart';
  const fields = {
    initialize: 'block-initialize', condition: 'block-condition', compare: 'block-compare',
    match: 'block-match', miss: 'block-miss', exhausted: 'block-exhausted'
  };
  const labels = {
    initialize: {'start-at-zero': 'i ← 0', 'start-at-one': 'i ← 1', 'start-at-target': 'i ← target'},
    condition: {'test-index-before-length': 'i < n ?', 'allow-index-equals-length': 'i ≤ n ?', 'test-index-equals-length': 'i = n ?'},
    compare: {'compare-equals-target': 'A[i] = target ?', 'compare-less-than-target': 'A[i] < target ?', 'compare-index-to-target': 'i = target ?'},
    match: {'return-first-index': '输出 i 并结束', 'output-value-continue': '输出 A[i] 后继续', 'advance-on-match': 'i ← i + 1'},
    miss: {'advance-one-and-repeat': 'i ← i + 1，回到边界判断', 'decrease-index': 'i ← i − 1', 'stop-on-first-miss': '报告未找到并结束'},
    exhausted: {'report-not-found': '输出“未找到”并结束', 'report-length': '输出列表长度并结束', 'restart-at-zero': '重新从 0 开始'}
  };
  const cases = {
    'first-duplicate': {prediction: 'predict-first-duplicate', answer: 'index-1'},
    'last-match': {prediction: 'predict-last-match', answer: 'index-4'},
    'not-found': {prediction: 'predict-not-found', answer: 'not-found'}
  };
  const done = {construction: false, 'first-duplicate': false, 'last-match': false, 'not-found': false, termination: false};
  const predictionCorrect = {'first-duplicate': false, 'last-match': false, 'not-found': false};
  const runStates = {};

  function showFeedback(element, message, kind = '') {
    element.textContent = message;
    element.classList.remove('success', 'error', 'warning');
    if (kind) element.classList.add(kind);
  }

  function readChoices() {
    return Object.fromEntries(Object.entries(fields).map(([step, id]) => [step, byId(id).value]));
  }

  function renderRepresentations() {
    const choices = readChoices();
    for (const [step, id] of Object.entries(fields)) {
      const selected = choices[step];
      const text = labels[step][selected] || '等待选择';
      document.querySelector(`[data-flow-label="${step}"]`).textContent = text;
      const nodeName = step === 'match' ? 'found' : step === 'miss' ? 'increment' : step;
      const node = document.querySelector(`[data-node="${nodeName}"]`);
      node.dataset.state = done.construction ? 'correct' : selected ? 'active' : '';
    }
    const initialized = labels.initialize[choices.initialize] || '选择初始化';
    const condition = labels.condition[choices.condition] || '选择循环边界';
    const compare = labels.compare[choices.compare] || '选择比较步骤';
    const match = labels.match[choices.match] || '选择命中处理';
    const miss = labels.miss[choices.miss] || '选择未命中处理';
    const exhausted = labels.exhausted[choices.exhausted] || '选择结束处理';
    byId('pseudocode').textContent = [
      `i ← ${choices.initialize === 'start-at-zero' ? '0' : choices.initialize === 'start-at-one' ? '1' : choices.initialize === 'start-at-target' ? 'target' : '？'}`,
      `当 ${condition} 时：`,
      `  如果 ${compare}：`,
      `    ${match}`,
      '  否则：',
      `    ${miss}`,
      '循环结束后：',
      `  ${exhausted}`
    ].join('\n');
    byId('flowchart').setAttribute('aria-label', `首次匹配查找流程图。${initialized}；${condition}；${compare}；相等时${match}；不相等时${miss}；遍历结束时${exhausted}。`);
  }

  function clearRuns() {
    for (const id of Object.keys(cases)) {
      byId(cases[id].prediction).value = '';
      predictionCorrect[id] = false;
      done[id] = false;
      delete runStates[id];
      const card = document.querySelector(`[data-case="${id}"]`);
      card.querySelector('[data-array]').replaceChildren();
      card.querySelector('[data-trace]').replaceChildren();
      showFeedback(card.querySelector('[data-case-status]'), '先构造算法并预测结果。');
    }
    done.termination = false;
    byId('termination-explanation').value = '';
    showFeedback(byId('termination-status'), '先完成三个运行例子。');
  }

  function resetForConstructionChange() {
    done.construction = false;
    clearRuns();
    showFeedback(byId('construction-status'), '算法步骤已变化；请重新检查结构。');
    renderRepresentations();
    renderLearningSteps();
    renderControls();
  }

  function renderLearningSteps() {
    const names = {
      construction: '构造安全的首次匹配算法',
      'first-duplicate': '预测并运行重复目标案例',
      'last-match': '预测并运行靠后目标案例',
      'not-found': '预测并运行未命中案例',
      termination: '解释有限终止条件'
    };
    for (const [id, name] of Object.entries(names)) {
      const item = document.querySelector(`[data-step="${id}"]`);
      item.textContent = `${done[id] ? '✓ 已完成' : '○ 待完成'} · ${name}`;
      item.dataset.done = done[id] ? 'true' : 'false';
    }
  }

  function renderControls() {
    for (const id of Object.keys(cases)) {
      const card = document.querySelector(`[data-case="${id}"]`);
      card.querySelector('select').disabled = !done.construction || done[id];
      card.querySelector('button[data-action="check-prediction"]').disabled = !done.construction || done[id];
      card.querySelectorAll('button[data-action]').forEach(button => {
        if (button.dataset.action !== 'check-prediction') button.disabled = !done.construction || !predictionCorrect[id] || done[id];
      });
    }
    byId('check-termination').disabled = !Object.keys(cases).every(id => done[id]);
  }

  function checkConstruction() {
    const result = Model.validateConstruction(readChoices());
    done.construction = result.valid;
    if (result.valid) {
      showFeedback(byId('construction-status'), '结构正确。流程图和伪代码现在表示同一个有限算法；先预测每个例子的输出。', 'success');
    } else {
      showFeedback(byId('construction-status'), result.errors.join(' '), 'error');
    }
    renderRepresentations();
    renderLearningSteps();
    renderControls();
  }

  function checkPrediction(caseId) {
    const card = document.querySelector(`[data-case="${caseId}"]`);
    if (!done.construction) return;
    const selected = byId(cases[caseId].prediction).value;
    predictionCorrect[caseId] = selected === cases[caseId].answer;
    if (predictionCorrect[caseId]) {
      showFeedback(card.querySelector('[data-case-status]'), '预测正确。运行算法并查看它怎样到达这个结果。', 'success');
    } else {
      const scenario = Model.getCase(caseId);
      const expected = scenario.expectedIndex === null ? '未找到' : `索引 ${scenario.expectedIndex}`;
      showFeedback(card.querySelector('[data-case-status]'), `再核对列表中目标第一次出现的位置；结果应为${expected}。你可以更改预测。`, 'error');
    }
    renderControls();
  }

  function describeStep(step) {
    if (step.node === 'condition') return step.passed
      ? `判断 ${step.index} < ${step.length}，条件成立，进入循环。`
      : `判断 ${step.index} < ${step.length}，条件不成立，停止循环。`;
    if (step.node === 'compare') return `比较 A[${step.index}] = ${step.value} 与目标 ${step.target}：${step.matched ? '相等' : '不相等'}。`;
    if (step.node === 'found') return `输出索引 ${step.index}；已找到第一次匹配，结束。`;
    if (step.node === 'increment') return `未命中，i 从 ${step.previousIndex} 增加到 ${step.index}，回到循环边界。`;
    if (step.node === 'not-found') return '列表项已经检查完，输出“未找到”并结束。';
    return '算法步骤。';
  }

  function renderRun(caseId) {
    const state = runStates[caseId];
    if (!state) return;
    const card = document.querySelector(`[data-case="${caseId}"]`);
    const visibleTrace = state.result.trace.slice(0, state.visibleSteps);
    const trace = card.querySelector('[data-trace]');
    trace.replaceChildren();
    visibleTrace.forEach((step, index) => {
      const item = document.createElement('li');
      item.textContent = describeStep(step);
      if (index === visibleTrace.length - 1) item.dataset.current = 'true';
      trace.append(item);
    });
    const array = card.querySelector('[data-array]');
    array.replaceChildren();
    const lastCompare = visibleTrace.filter(step => step.node === 'compare').at(-1);
    const isFinished = state.visibleSteps >= state.result.trace.length;
    for (const [index, value] of state.result.values.entries()) {
      const cell = document.createElement('li');
      cell.className = 'array-cell';
      cell.dataset.current = String(!isFinished && lastCompare?.index === index);
      const number = document.createElement('span');
      number.textContent = String(value);
      const position = document.createElement('small');
      position.textContent = `索引 ${index}`;
      cell.append(number, position);
      array.append(cell);
    }
    if (isFinished) {
      done[caseId] = true;
      const output = state.result.found ? `索引 ${state.result.foundIndex}` : '未找到';
      showFeedback(card.querySelector('[data-case-status]'), `运行完成：${output}；比较 ${state.result.comparisons} 项后有限终止。`, 'success');
    } else {
      showFeedback(card.querySelector('[data-case-status]'), `轨迹 ${state.visibleSteps}/${state.result.trace.length}；当前仍在运行。`);
    }
    renderLearningSteps();
    renderControls();
  }

  function startOrAdvance(caseId, finish = false) {
    if (!predictionCorrect[caseId]) return;
    if (!runStates[caseId]) {
      runStates[caseId] = {result: Model.runCase(caseId, readChoices()), visibleSteps: 0};
    }
    const state = runStates[caseId];
    state.visibleSteps = finish ? state.result.trace.length : Math.min(state.visibleSteps + 1, state.result.trace.length);
    renderRun(caseId);
  }

  function checkTermination() {
    if (!Object.keys(cases).every(id => done[id])) return;
    done.termination = Model.validateTerminationExplanation(byId('termination-explanation').value);
    if (done.termination) {
      showFeedback(byId('termination-status'), '解释正确：每次未命中都推进 i；有限列表最终会让 i < n 为假。', 'success');
      renderLearningSteps();
      saveCompletion();
    } else {
      showFeedback(byId('termination-status'), '请说明未命中时索引如何推进，以及它怎样最终越过有效索引范围。', 'error');
    }
  }

  function saveCompletion() {
    if (!Object.values(done).every(Boolean)) return;
    const progress = window.SubjectProgress.read('computer', 'high');
    if (progress === null) {
      showFeedback(byId('progress-status'), '学习任务已完成，但本机进度无法读取或保存；修复浏览器存储后可重试。', 'warning');
      byId('retry-save').hidden = false;
      return;
    }
    if (window.SubjectProgress.markComplete('computer', 'high', 'algorithm-flowchart')) {
      showFeedback(byId('progress-status'), '本机已保存：算法描述与流程图实验室已完成。', 'success');
      byId('retry-save').hidden = true;
    } else {
      showFeedback(byId('progress-status'), '学习任务已完成，但本机进度未能保存；修复存储后可重试。', 'warning');
      byId('retry-save').hidden = false;
    }
  }

  function updateProgressStatus() {
    const progress = window.SubjectProgress.read('computer', 'high');
    if (progress === null) showFeedback(byId('progress-status'), '本机学习进度暂不可用；实验仍可正常进行。', 'warning');
    else if (progress['algorithm-flowchart']) showFeedback(byId('progress-status'), '本机已记录完成；你仍可继续构造和比较算法。', 'success');
  }

  for (const id of Object.values(fields)) byId(id).addEventListener('change', resetForConstructionChange);
  byId('check-construction').addEventListener('click', checkConstruction);
  for (const id of Object.keys(cases)) {
    byId(cases[id].prediction).addEventListener('change', () => {
      predictionCorrect[id] = false;
      delete runStates[id];
      done[id] = false;
      const card = document.querySelector(`[data-case="${id}"]`);
      card.querySelector('[data-array]').replaceChildren();
      card.querySelector('[data-trace]').replaceChildren();
      showFeedback(card.querySelector('[data-case-status]'), done.construction ? '已更新预测；点击“核对预测”后运行算法。' : '先构造算法并预测结果。');
      renderLearningSteps();
      renderControls();
    });
  }
  document.querySelectorAll('button[data-action="check-prediction"]').forEach(button => button.addEventListener('click', () => checkPrediction(button.dataset.target)));
  document.querySelectorAll('button[data-action="step"]').forEach(button => button.addEventListener('click', () => startOrAdvance(button.dataset.target)));
  document.querySelectorAll('button[data-action="run"]').forEach(button => button.addEventListener('click', () => startOrAdvance(button.dataset.target, true)));
  byId('check-termination').addEventListener('click', checkTermination);
  byId('retry-save').addEventListener('click', saveCompletion);

  renderRepresentations();
  renderLearningSteps();
  renderControls();
  updateProgressStatus();
})();
