(function () {
  'use strict';

  const Model = window.IotAutonomousControlModel;
  const subject = 'computer';
  const stage = 'middle';
  const slug = 'iot-autonomous-control';
  const get = id => document.getElementById(id);
  const done = {supply: false, maintenance: false, control: false};
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

  function renderTaskAndSupply() {
    get('task-note').textContent = Model.getTask().note;
    const list = get('supply-list');
    for (const source of Model.getSupplySources()) {
      const card = document.createElement('div');
      card.className = 'case-card';

      const strong = document.createElement('strong');
      strong.textContent = source.label;
      card.appendChild(strong);

      const wrap = document.createElement('div');
      wrap.className = 'case-options';
      for (const [value, text] of [['trusted', '可信'], ['untrusted', '不可信']]) {
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `supply-${source.id}`;
        radio.value = value;
        label.appendChild(radio);
        label.append(` ${text}`);
        wrap.appendChild(label);
      }
      card.appendChild(wrap);
      list.appendChild(card);
    }
  }

  function renderMaintenance() {
    const list = get('maintenance-list');
    for (const item of Model.getMaintenanceCases()) {
      const card = document.createElement('div');
      card.className = 'case-card';

      const strong = document.createElement('strong');
      strong.textContent = item.label;
      card.appendChild(strong);

      const wrap = document.createElement('div');
      wrap.className = 'case-options';
      for (const [value, text] of [['true', '安全'], ['false', '有风险']]) {
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `maintenance-${item.id}`;
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
      supply: '判断供应链可信来源',
      maintenance: '认识更新与停止维护的风险',
      control: '用工程属性判断自主可控'
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

  function checkSupply() {
    const selection = {};
    const missing = [];
    for (const source of Model.getSupplySources()) {
      const value = selectedValue(`supply-${source.id}`);
      if (!value) missing.push(source.label);
      else selection[source.id] = value;
    }
    if (missing.length) {
      feedback('supply-status', `还有 ${missing.length} 个来源没有判断。`, 'warning');
      return;
    }
    let result;
    try { result = Model.judgeSupplyChain(selection); }
    catch (error) {
      feedback('supply-status', `来源数据异常：${error.message}`, 'error');
      return;
    }
    if (!result.correct) {
      done.supply = false;
      done.maintenance = false;
      done.control = false;
      get('maintenance-panel').hidden = true;
      get('control-panel').hidden = true;
      const wrong = result.mismatches[0];
      const source = Model.getSupplySources().find(item => item.id === wrong.sourceId);
      feedback('supply-status', `“${source.label}”判断有误：${source.reason}请重新判断。`, 'error');
      renderProgress();
      return;
    }
    done.supply = true;
    get('maintenance-panel').hidden = false;
    feedback('supply-status', '正确：可信来源正规、可核验签名；不明渠道和无签名的“破解固件”无法保证完整与安全。', 'success');
    feedback('maintenance-status', '现在判断不同维护状态的安全后果。');
    get('maintenance-title').focus();
    renderProgress();
  }

  function checkMaintenance() {
    if (!done.supply) {
      feedback('maintenance-status', '先完成第 1 步的来源判断。', 'warning');
      return;
    }
    const selection = {};
    const missing = [];
    for (const item of Model.getMaintenanceCases()) {
      const raw = selectedValue(`maintenance-${item.id}`);
      if (!raw) missing.push(item.label);
      else selection[item.id] = raw === 'true';
    }
    if (missing.length) {
      feedback('maintenance-status', `还有 ${missing.length} 种做法没有判断。`, 'warning');
      return;
    }
    let result;
    try { result = Model.judgeMaintenance(selection); }
    catch (error) {
      feedback('maintenance-status', `维护数据异常：${error.message}`, 'error');
      return;
    }
    if (!result.correct) {
      done.maintenance = false;
      done.control = false;
      get('control-panel').hidden = true;
      const wrong = result.mismatches[0];
      const item = Model.getMaintenanceCases().find(x => x.id === wrong.caseId);
      feedback('maintenance-status', `“${item.label}”判断有误：${item.reason}请重新判断。`, 'error');
      renderProgress();
      return;
    }
    done.maintenance = true;
    get('control-panel').hidden = false;
    feedback('maintenance-status', '正确：及时补丁修复已知漏洞；忽略更新和停止维护（EOL）的设备会让漏洞长期暴露，应隔离或更换。', 'success');
    feedback('control-status', '现在勾选所有能增强自主可控的做法。');
    get('control-title').focus();
    renderProgress();
  }

  function checkControl() {
    if (!done.maintenance) {
      feedback('control-status', '先完成维护判断。', 'warning');
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
      const hasShortcut = result.mismatches.some(item => item.practiceId === 'brand-nationality-shortcut');
      const hasLockin = result.mismatches.some(item => item.practiceId === 'single-vendor-lockin');
      const messages = [];
      if (hasShortcut || hasLockin) messages.push('品牌国籍一刀切和单一厂商锁定都不是自主可控，应看对技术、数据和服务连续性的掌控');
      const missing = result.mismatches.filter(item => item.kind === 'missing').map(item => item.practiceId);
      if (missing.length) messages.push('还需纳入数据自持、开放标准或本地化等增强可控的做法');
      feedback('control-status', `${messages.join('；')}。请重新选择。`, 'error');
      renderProgress();
      return;
    }
    done.control = true;
    feedback('control-status', '正确：数据自持、开放标准、可替代和本地化提升自主可控；它是掌控程度问题，与品牌国籍没有必然等同关系。', 'success');
    maybeComplete();
  }

  renderTaskAndSupply();
  renderMaintenance();
  renderControl();
  get('check-supply').addEventListener('click', checkSupply);
  get('check-maintenance').addEventListener('click', checkMaintenance);
  get('check-control').addEventListener('click', checkControl);
  get('retry-save').addEventListener('click', saveCompletion);
  renderProgress();
})();
