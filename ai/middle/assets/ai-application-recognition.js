(function () {
  'use strict';

  const Model = window.KVAiApplicationRecognitionModel;
  const subject = 'ai';
  const stage = 'middle';
  const slug = 'ai-application-recognition';
  const get = id => document.getElementById(id);
  const done = {classify: false, impact: false, boundary: false};
  let pendingSave = false;
  let historicalCompletion = false;
  let saveNotice = '';

  const KIND_TEXT = {ai: '人工智能应用', automation: '固定自动化'};
  const IMPACT_TEXT = {learning: '学习', life: '生活', work: '工作'};

  function feedback(id, message, kind = '') {
    const node = get(id);
    node.textContent = message;
    node.classList.remove('success', 'error', 'warning');
    if (kind) node.classList.add(kind);
  }

  function selectedValue(name) {
    const item = document.querySelector(`input[name="${name}"]:checked`);
    return item ? item.value : '';
  }

  function selectedValues(name) {
    return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(item => item.value);
  }

  function renderTaskAndApps() {
    get('task-note').textContent = Model.getTask().note;
    const list = get('app-list');
    for (const app of Model.getApplications()) {
      const card = document.createElement('div');
      card.className = 'case-card';
      const strong = document.createElement('strong');
      strong.textContent = app.label;
      card.appendChild(strong);
      const wrap = document.createElement('div');
      wrap.className = 'case-options';
      for (const value of ['ai', 'automation']) {
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `kind-${app.id}`;
        radio.value = value;
        label.appendChild(radio);
        label.append(` ${KIND_TEXT[value]}`);
        wrap.appendChild(label);
      }
      card.appendChild(wrap);
      list.appendChild(card);
    }
  }

  function renderImpacts() {
    const list = get('impact-list');
    const aiApps = Model.getApplications().filter(a => a.kind === 'ai');
    for (const app of aiApps) {
      const card = document.createElement('div');
      card.className = 'case-card';
      const strong = document.createElement('strong');
      strong.textContent = app.label;
      card.appendChild(strong);
      const wrap = document.createElement('div');
      wrap.className = 'impact-options';
      for (const domain of ['learning', 'life', 'work']) {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = `impact-${app.id}`;
        checkbox.value = domain;
        label.appendChild(checkbox);
        label.append(` ${IMPACT_TEXT[domain]}`);
        wrap.appendChild(label);
      }
      card.appendChild(wrap);
      list.appendChild(card);
    }
  }

  function renderBoundary() {
    const list = get('boundary-list');
    for (const item of Model.getCapabilityCases()) {
      const card = document.createElement('div');
      card.className = 'case-card';
      const strong = document.createElement('strong');
      strong.textContent = item.label;
      card.appendChild(strong);
      const wrap = document.createElement('div');
      wrap.className = 'case-options';
      for (const [value, text] of [['ai-reliable', 'AI 可较可靠辅助'], ['human-review', '需要人类复核']]) {
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `boundary-${item.id}`;
        radio.value = value;
        label.appendChild(radio);
        label.append(` ${text}`);
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
      classify: '区分 AI 应用与固定自动化',
      impact: '归类学习生活工作影响',
      boundary: '判断 AI 能力边界'
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
        `本实验全程只在本机模拟：连接真实服务=${snapshot.connectedToRealService ? '是' : '否'}，网络请求数=${snapshot.networkRequests}。`;
    } else saveNotice = '';
    renderProgress();
  }

  function maybeComplete() {
    if (Object.values(done).every(Boolean) && !historicalCompletion) saveCompletion();
    else renderProgress();
  }

  function checkClassify() {
    const selection = {};
    const missing = [];
    for (const app of Model.getApplications()) {
      const value = selectedValue(`kind-${app.id}`);
      if (!value) missing.push(app.label);
      else selection[app.id] = value;
    }
    if (missing.length) {
      feedback('classify-status', `还有 ${missing.length} 个应用没有判断类型。`, 'warning');
      return;
    }
    let result;
    try { result = Model.classifyApplications(selection); }
    catch (error) {
      feedback('classify-status', `识别数据异常：${error.message}`, 'error');
      return;
    }
    if (!result.correct) {
      done.classify = false;
      done.impact = false;
      done.boundary = false;
      get('impact-panel').hidden = true;
      get('boundary-panel').hidden = true;
      const wrong = result.mismatches[0];
      const app = Model.getApplications().find(a => a.id === wrong.appId);
      feedback('classify-status', `“${app.label}”判断有误：${app.reason}请重新判断。`, 'error');
      renderProgress();
      return;
    }
    done.classify = true;
    get('impact-panel').hidden = false;
    feedback('classify-status', '正确：能从数据学习、适应新情况的是 AI 应用；只按固定规则动作的是自动化。', 'success');
    feedback('impact-status', '现在为 AI 应用选择影响域。');
    get('impact-title').focus();
    renderProgress();
  }

  function checkImpact() {
    if (!done.classify) {
      feedback('impact-status', '先完成第 1 步的应用识别。', 'warning');
      return;
    }
    const selection = {};
    const missing = [];
    const aiApps = Model.getApplications().filter(a => a.kind === 'ai');
    for (const app of aiApps) {
      const values = selectedValues(`impact-${app.id}`);
      if (values.length === 0) missing.push(app.label);
      else selection[app.id] = values;
    }
    if (missing.length) {
      feedback('impact-status', `还有 ${missing.length} 个应用没有选择影响域。`, 'warning');
      return;
    }
    let result;
    try { result = Model.judgeImpacts(selection); }
    catch (error) {
      feedback('impact-status', `影响数据异常：${error.message}`, 'error');
      return;
    }
    if (!result.correct) {
      done.impact = false;
      done.boundary = false;
      get('boundary-panel').hidden = true;
      const wrong = result.mismatches[0];
      const app = aiApps.find(a => a.id === wrong.appId);
      feedback('impact-status', `“${app.label}”的影响域不完整或多选：它在${wrong.expected.map(d => IMPACT_TEXT[d]).join('、')}等场景有影响。请重新选择。`, 'error');
      renderProgress();
      return;
    }
    done.impact = true;
    get('boundary-panel').hidden = false;
    feedback('impact-status', '正确：同一 AI 应用可能同时影响学习、生活和工作。', 'success');
    feedback('boundary-status', '现在判断哪些任务需要人类复核。');
    get('boundary-title').focus();
    renderProgress();
  }

  function checkBoundary() {
    if (!done.impact) {
      feedback('boundary-status', '先完成影响归类。', 'warning');
      return;
    }
    const selection = {};
    const missing = [];
    for (const item of Model.getCapabilityCases()) {
      const value = selectedValue(`boundary-${item.id}`);
      if (!value) missing.push(item.label);
      else selection[item.id] = value;
    }
    if (missing.length) {
      feedback('boundary-status', `还有 ${missing.length} 个任务没有判断。`, 'warning');
      return;
    }
    let result;
    try { result = Model.judgeBoundary(selection); }
    catch (error) {
      feedback('boundary-status', `边界数据异常：${error.message}`, 'error');
      return;
    }
    if (!result.correct) {
      done.boundary = false;
      const wrong = result.mismatches[0];
      const item = Model.getCapabilityCases().find(c => c.id === wrong.caseId);
      feedback('boundary-status', `“${item.label}”判断有误：${item.reason}请重新判断。`, 'error');
      renderProgress();
      return;
    }
    done.boundary = true;
    feedback('boundary-status', '正确：AI 可辅助常规识别与初稿，但医疗、招聘、事实判断等高风险任务需要人类复核，AI 不保证总是正确。', 'success');
    maybeComplete();
  }

  renderTaskAndApps();
  renderImpacts();
  renderBoundary();
  get('check-classify').addEventListener('click', checkClassify);
  get('check-impact').addEventListener('click', checkImpact);
  get('check-boundary').addEventListener('click', checkBoundary);
  get('retry-save').addEventListener('click', saveCompletion);
  renderProgress();
})();
