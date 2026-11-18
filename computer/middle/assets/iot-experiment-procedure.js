(function () {
  'use strict';

  const Model = window.IotExperimentProcedureModel;
  const subject = 'computer';
  const stage = 'middle';
  const slug = 'iot-experiment-procedure';
  const get = id => document.getElementById(id);
  const done = {safety: false, procedure: false, dataflow: false};
  let pendingSave = false;
  let historicalCompletion = false;
  let saveNotice = '';

  function feedback(id, message, kind = '') {
    const node = get(id);
    node.textContent = message;
    node.classList.remove('success', 'error', 'warning');
    if (kind) node.classList.add(kind);
  }

  function selectedValue(name) {
    const item = document.querySelector(`select[name="${name}"], input[name="${name}"]:checked`);
    return item ? item.value : '';
  }

  function renderTask() {
    get('prep-note').textContent = '⚠ 先修说明：' + Model.getTask().prepNote;
  }

  function renderSafety() {
    const list = get('safety-list');
    for (const rule of Model.getSafetyRules()) {
      const card = document.createElement('div');
      card.className = 'case-card';
      const strong = document.createElement('strong');
      strong.textContent = rule.label;
      card.appendChild(strong);
      const wrap = document.createElement('div');
      wrap.className = 'case-options';
      for (const [value, text] of [['safe', '符合规程'], ['unsafe', '不符合规程']]) {
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `safety-${rule.id}`;
        radio.value = value;
        label.appendChild(radio);
        label.append(` ${text}`);
        wrap.appendChild(label);
      }
      card.appendChild(wrap);
      list.appendChild(card);
    }
  }

  function renderOrder() {
    const list = get('order-list');
    const steps = Model.getProcedureSteps();
    steps.forEach((step, index) => {
      const row = document.createElement('div');
      row.className = 'order-row';
      const label = document.createElement('label');
      label.htmlFor = `order-${step.id}`;
      label.textContent = step.label;
      const select = document.createElement('select');
      select.name = `order-${step.id}`;
      select.id = `order-${step.id}`;
      const blank = document.createElement('option');
      blank.value = '';
      blank.textContent = '选择次序…';
      select.appendChild(blank);
      for (let n = 1; n <= steps.length; n++) {
        const option = document.createElement('option');
        option.value = String(n);
        option.textContent = `第 ${n} 步`;
        select.appendChild(option);
      }
      row.appendChild(label);
      row.appendChild(select);
      list.appendChild(row);
    });
  }

  function renderDataFlow() {
    const list = get('dataflow-list');
    const stageKeys = Model.getDataStages().map(s => s.stageKey);
    for (const item of Model.getDataStages()) {
      const card = document.createElement('div');
      card.className = 'case-card';
      const strong = document.createElement('strong');
      strong.textContent = item.label;
      card.appendChild(strong);
      const wrap = document.createElement('div');
      wrap.className = 'case-options';
      for (const key of stageKeys) {
        const stageItem = Model.getDataStages().find(s => s.stageKey === key);
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `flow-${item.id}`;
        radio.value = key;
        label.appendChild(radio);
        label.append(` ${stageItem.stageLabel}`);
        wrap.appendChild(label);
      }
      card.appendChild(wrap);
      list.appendChild(card);
    }
  }

  function readProgress() {
    try { return window.SubjectProgress.read(subject, stage); }
    catch (_) { return null; }
  }

  function renderProgress() {
    const labels = {
      safety: '判断实验安全规程',
      procedure: '排列正确实验步骤',
      dataflow: '梳理数据汇集使用流程'
    };
    for (const [key, label] of Object.entries(labels)) {
      const item = document.querySelector(`[data-step="${key}"]`);
      item.textContent = `${done[key] ? '✓ 已完成' : '○ 待完成'} · ${label}`;
      item.dataset.done = String(done[key]);
    }
    if (!Object.values(done).every(Boolean)) {
      pendingSave = false;
      saveNotice = '';
    }
    if (pendingSave) {
      feedback('save-status', '三项判断已完成，但本机进度未能保存。修复浏览器存储后可以重试；损坏的旧记录不会自动覆盖。', 'warning');
      get('retry-save').hidden = false;
      return;
    }
    if (saveNotice) {
      feedback('save-status', saveNotice, 'success');
      get('retry-save').hidden = true;
      return;
    }
    if (historicalCompletion || readProgress()?.[slug] === true) {
      historicalCompletion = true;
      feedback('save-status', '本机已有此主题的完成记录；仍可重新操作本实验。', 'success');
      get('retry-save').hidden = true;
      return;
    }
    feedback('save-status', readProgress() === null
      ? '本机进度暂不可用；学习交互仍可继续。'
      : '完成三项判断后保存本机进度。');
    get('retry-save').hidden = true;
  }

  function saveCompletion() {
    if (!Object.values(done).every(Boolean)) return;
    let saved = false;
    try { saved = window.SubjectProgress.markComplete(subject, stage, slug) === true; }
    catch (_) { saved = false; }
    pendingSave = !saved;
    if (saved) {
      historicalCompletion = true;
      saveNotice = '三项判断已完成，已保存本机学习进度。';
      const snapshot = Model.getLocalSnapshot();
      get('snapshot-state').textContent =
        `本实验全程只在本机模拟：连接真实设备=${snapshot.connectedToRealDevice ? '是' : '否'}，网络请求数=${snapshot.networkRequests}。`;
    } else saveNotice = '';
    renderProgress();
  }

  function maybeComplete() {
    if (Object.values(done).every(Boolean) && !historicalCompletion) saveCompletion();
    else renderProgress();
  }

  function checkSafety() {
    const selection = {};
    const missing = [];
    for (const rule of Model.getSafetyRules()) {
      const value = selectedValue(`safety-${rule.id}`);
      if (!value) missing.push(rule.label);
      else selection[rule.id] = value;
    }
    if (missing.length) {
      feedback('safety-status', `还有 ${missing.length} 项操作没有判断。`, 'warning');
      return;
    }
    let result;
    try { result = Model.judgeSafety(selection); }
    catch (error) {
      feedback('safety-status', `安全判断数据异常：${error.message}`, 'error');
      return;
    }
    if (!result.correct) {
      done.safety = false;
      done.procedure = false;
      done.dataflow = false;
      get('procedure-panel').hidden = true;
      get('dataflow-panel').hidden = true;
      const wrong = result.mismatches[0];
      const rule = Model.getSafetyRules().find(r => r.id === wrong.ruleId);
      feedback('safety-status', `“${rule.label}”判断有误：${rule.reason}请重新判断。`, 'error');
      renderProgress();
      return;
    }
    done.safety = true;
    get('procedure-panel').hidden = false;
    feedback('safety-status', '正确：通电前检查、断电插拔、防静电和异常先断电是基本安全规程。', 'success');
    feedback('order-status', '现在为实验步骤排序。');
    get('procedure-title').focus();
    renderProgress();
  }

  function checkOrder() {
    if (!done.safety) {
      feedback('order-status', '先完成第 1 步的安全判断。', 'warning');
      return;
    }
    const steps = Model.getProcedureSteps();
    const chosen = steps.map(s => selectedValue(`order-${s.id}`));
    if (chosen.some(value => !value)) {
      feedback('order-status', '还有步骤没有选择次序。', 'warning');
      return;
    }
    if (new Set(chosen).size !== chosen.length) {
      feedback('order-status', '每个次序只能用一次，请检查是否有重复。', 'error');
      return;
    }
    const order = chosen.map(position => steps[Number(position) - 1].id);
    let result;
    try { result = Model.orderProcedure(order); }
    catch (error) {
      feedback('order-status', `排序数据异常：${error.message}`, 'error');
      return;
    }
    if (!result.correct) {
      done.procedure = false;
      done.dataflow = false;
      get('dataflow-panel').hidden = true;
      const first = result.mismatches[0];
      const expectedStep = Model.getProcedureSteps().find(s => s.id === first.expected);
      feedback('order-status', `步骤顺序有误，请重新排序：第 ${first.position + 1} 步应是“${expectedStep.label}”，相邻步骤存在依赖关系。`, 'error');
      renderProgress();
      return;
    }
    done.procedure = true;
    get('dataflow-panel').hidden = false;
    feedback('order-status', '正确：明确目的→检查器材→连接→通电采集→如实记录→断电整理，顺序不能颠倒。', 'success');
    feedback('dataflow-status', '现在梳理数据从设备到归档的流程。');
    get('dataflow-title').focus();
    renderProgress();
  }

  function checkDataFlow() {
    if (!done.procedure) {
      feedback('dataflow-status', '先完成步骤排序。', 'warning');
      return;
    }
    const selection = {};
    const missing = [];
    for (const stage of Model.getDataStages()) {
      const value = selectedValue(`flow-${stage.id}`);
      if (!value) missing.push(stage.label);
      else selection[stage.id] = value;
    }
    if (missing.length) {
      feedback('dataflow-status', `还有 ${missing.length} 个数据环节没有匹配。`, 'warning');
      return;
    }
    let result;
    try { result = Model.matchDataFlow(selection); }
    catch (error) {
      feedback('dataflow-status', `数据流程异常：${error.message}`, 'error');
      return;
    }
    if (!result.correct) {
      done.dataflow = false;
      const wrong = result.mismatches[0];
      const stage = Model.getDataStages().find(s => s.id === wrong.stageId);
      const expected = Model.getDataStages().find(s => s.stageKey === wrong.expected);
      feedback('dataflow-status', `“${stage.label}”匹配有误，应属于“${expected.stageLabel}”阶段。请重新判断。`, 'error');
      renderProgress();
      return;
    }
    done.dataflow = true;
    feedback('dataflow-status', '正确：数据经设备采集、网络传输、平台汇集后分析使用，并按要求归档；这是真实实验数据流程的先修训练。', 'success');
    maybeComplete();
  }

  renderTask();
  renderSafety();
  renderOrder();
  renderDataFlow();
  get('check-safety').addEventListener('click', checkSafety);
  get('check-order').addEventListener('click', checkOrder);
  get('check-dataflow').addEventListener('click', checkDataFlow);
  get('retry-save').addEventListener('click', saveCompletion);
  renderProgress();
})();
