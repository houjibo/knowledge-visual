(function () {
  'use strict';

  const Model = window.KVSmartSocietySystemModel;
  const subject = 'ai';
  const stage = 'middle';
  const slug = 'smart-society-system';
  const get = id => document.getElementById(id);
  const done = {elements: false, boundary: false, control: false};
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
    const item = document.querySelector(`input[name="${name}"]:checked`);
    return item ? item.value : '';
  }

  function selectedValues(name) {
    return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(item => item.value);
  }

  function renderElements() {
    get('task-note').textContent = Model.getTask().note;
    const list = get('element-list');
    const componentIds = Model.getSystemElements().map(e => e.componentId);
    for (const element of Model.getSystemElements()) {
      const card = document.createElement('div');
      card.className = 'case-card';
      const strong = document.createElement('strong');
      strong.textContent = `${element.label}对应哪个环节？`;
      card.appendChild(strong);
      const wrap = document.createElement('div');
      wrap.className = 'case-options';
      for (const componentId of componentIds) {
        const component = Model.getSystemElements().find(e => e.componentId === componentId);
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `element-${element.id}`;
        radio.value = componentId;
        label.appendChild(radio);
        label.append(` ${component.componentLabel}`);
        wrap.appendChild(label);
      }
      card.appendChild(wrap);
      list.appendChild(card);
    }
  }

  function renderBoundary() {
    const list = get('boundary-list');
    for (const scenario of Model.getBoundaryScenarios()) {
      const card = document.createElement('div');
      card.className = 'case-card';
      const strong = document.createElement('strong');
      strong.textContent = scenario.label;
      card.appendChild(strong);
      const wrap = document.createElement('div');
      wrap.className = 'case-options';
      for (const [value, text] of [['system', '智慧社会系统'], ['single-automation', '单一自动化设备']]) {
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `boundary-${scenario.id}`;
        radio.value = value;
        label.appendChild(radio);
        label.append(` ${text}`);
        wrap.appendChild(label);
      }
      card.appendChild(wrap);
      list.appendChild(card);
    }
  }

  function renderControl() {
    const wrap = get('control-choices');
    for (const practice of Model.getControlPractices()) {
      const label = document.createElement('label');
      label.className = 'choice';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'control-practice';
      checkbox.value = practice.id;
      label.appendChild(checkbox);
      label.append(` ${practice.label}`);
      wrap.appendChild(label);
    }
  }

  function readProgress() {
    try { return window.SubjectProgress.read(subject, stage); }
    catch (_) { return null; }
  }

  function renderProgress() {
    const labels = {
      elements: '识别智慧社会系统的六个要素',
      boundary: '区分系统与单一自动化设备',
      control: '认识自主可控技术的重要性'
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
        `本实验全程只在本机模拟：连接真实平台=${snapshot.connectedToRealPlatform ? '是' : '否'}，网络请求数=${snapshot.networkRequests}。`;
    } else saveNotice = '';
    renderProgress();
  }

  function maybeComplete() {
    if (Object.values(done).every(Boolean) && !historicalCompletion) saveCompletion();
    else renderProgress();
  }

  function checkElements() {
    const selection = {};
    const missing = [];
    for (const element of Model.getSystemElements()) {
      const value = selectedValue(`element-${element.id}`);
      if (!value) missing.push(element.label);
      else selection[element.id] = value;
    }
    if (missing.length) {
      feedback('elements-status', `还有 ${missing.length} 个要素没有选择环节。`, 'warning');
      return;
    }
    let result;
    try { result = Model.matchElements(selection); }
    catch (error) {
      feedback('elements-status', `要素数据异常：${error.message}`, 'error');
      return;
    }
    if (!result.correct) {
      done.elements = false;
      done.boundary = false;
      done.control = false;
      get('boundary-panel').hidden = true;
      get('control-panel').hidden = true;
      feedback('elements-status', '要素与环节不匹配，请重新判断：请按感知→网络→平台→决策→应用→制度的数据闭环对应。', 'error');
      renderProgress();
      return;
    }
    done.elements = true;
    get('boundary-panel').hidden = false;
    feedback('elements-status', '正确：数据从感知设备经网络到数据平台，由算法决策后通过应用服务市民，并由人与制度保障运行。', 'success');
    feedback('boundary-status', '现在判断哪些场景构成智慧社会系统。');
    get('boundary-title').focus();
    renderProgress();
  }

  function checkBoundary() {
    if (!done.elements) {
      feedback('boundary-status', '先完成第 1 步的要素匹配。', 'warning');
      return;
    }
    const selection = {};
    const missing = [];
    for (const scenario of Model.getBoundaryScenarios()) {
      const value = selectedValue(`boundary-${scenario.id}`);
      if (!value) missing.push(scenario.label);
      else selection[scenario.id] = value;
    }
    if (missing.length) {
      feedback('boundary-status', `还有 ${missing.length} 个场景没有判断。`, 'warning');
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
      done.control = false;
      get('control-panel').hidden = true;
      const wrong = result.mismatches[0];
      const scenario = Model.getBoundaryScenarios().find(s => s.id === wrong.scenarioId);
      feedback('boundary-status', `“${scenario.label}”判断有误：${scenario.reason}请重新判断。`, 'error');
      renderProgress();
      return;
    }
    done.boundary = true;
    get('control-panel').hidden = false;
    feedback('boundary-status', '正确：智慧社会系统需要多要素协同和数据驱动的决策闭环；感应门、定时路灯等只是单一自动化设备。', 'success');
    feedback('control-status', '现在判断哪些做法增强系统自主可控。');
    get('control-title').focus();
    renderProgress();
  }

  function checkControl() {
    if (!done.boundary) {
      feedback('control-status', '先完成边界判断。', 'warning');
      return;
    }
    const chosen = selectedValues('control-practice');
    if (chosen.length === 0) {
      feedback('control-status', '请勾选增强自主可控的做法。', 'warning');
      return;
    }
    let result;
    try { result = Model.judgeControl(chosen); }
    catch (error) {
      feedback('control-status', `可控数据异常：${error.message}`, 'error');
      return;
    }
    if (!result.correct) {
      done.control = false;
      const hasLockin = result.mismatches.some(m => m.practiceId === 'single-vendor-lockin');
      const messages = [];
      if (hasLockin) messages.push('完全依赖单一外部厂商、可被远程停服会削弱自主可控，不应选择');
      const missing = result.mismatches.filter(m => m.kind === 'missing').map(m => m.practiceId);
      if (missing.length) messages.push('还需纳入数据自持、开放标准或本地化等增强可控的做法');
      feedback('control-status', `${messages.join('；')}。请重新选择。`, 'error');
      renderProgress();
      return;
    }
    done.control = true;
    feedback('control-status', '正确：数据自持、开放标准和本地化让系统在断供或停服时仍能连续运行，这正是自主可控的重要意义。', 'success');
    maybeComplete();
  }

  renderElements();
  renderBoundary();
  renderControl();
  get('check-elements').addEventListener('click', checkElements);
  get('check-boundary').addEventListener('click', checkBoundary);
  get('check-control').addEventListener('click', checkControl);
  get('retry-save').addEventListener('click', saveCompletion);
  renderProgress();
})();
