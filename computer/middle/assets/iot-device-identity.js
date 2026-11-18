(function () {
  'use strict';

  const Model = window.IotDeviceIdentityModel;
  const subject = 'computer';
  const stage = 'middle';
  const slug = 'iot-device-identity';
  const get = id => document.getElementById(id);
  const done = {identity: false, inference: false, protection: false};
  let pendingSave = false;
  let historicalCompletion = false;
  let saveNotice = '';

  const IDENTITY_TEXT = {
    'device-id': '设备 ID',
    'serial-number': '序列号（SN）',
    'mac-address': 'MAC 地址',
    'cloud-account-binding': '云账号绑定标识',
    'national-id': '人的身份证号（干扰项）'
  };
  const INFERENCE_TEXT = {
    'daily-routine': '在家时间和作息规律',
    'home-commute': '住址、常去地点和通勤路线',
    'health-condition': '健康状况和运动习惯',
    'none': '推断不出任何个人信息'
  };

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

  function renderTaskAndDevices() {
    get('task-note').textContent = Model.getTask().note;
    const list = get('device-list');
    const options = Model.getIdentityOptions();
    for (const device of Model.getDevices()) {
      const card = document.createElement('div');
      card.className = 'case-card';

      const strong = document.createElement('strong');
      strong.textContent = `${device.label} 的数字身份是？`;
      card.appendChild(strong);

      const wrap = document.createElement('div');
      wrap.className = 'case-options';
      for (const option of options) {
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `identity-${device.id}`;
        radio.value = option;
        label.appendChild(radio);
        label.append(` ${IDENTITY_TEXT[option]}`);
        wrap.appendChild(label);
      }
      card.appendChild(wrap);
      list.appendChild(card);
    }
  }

  function renderFlows() {
    const list = get('flow-list');
    const options = ['daily-routine', 'home-commute', 'health-condition', 'none'];
    for (const flow of Model.getDataFlows()) {
      const card = document.createElement('div');
      card.className = 'case-card';

      const strong = document.createElement('strong');
      strong.textContent = flow.label;
      card.appendChild(strong);

      const wrap = document.createElement('div');
      wrap.className = 'case-options';
      for (const option of options) {
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `inference-${flow.id}`;
        radio.value = option;
        label.appendChild(radio);
        label.append(` ${INFERENCE_TEXT[option]}`);
        wrap.appendChild(label);
      }
      card.appendChild(wrap);
      list.appendChild(card);
    }
  }

  function renderProtection() {
    const anonymize = [
      {id: 'rotate-random-id', label: '用随机化、定期轮换的标识代替固定设备 ID/MAC'},
      {id: 'keep-fixed-id', label: '一直使用固定不变的设备 ID，方便追踪'}
    ];
    const minimize = [
      {id: 'collect-required-only', label: '只采集完成任务必需的字段，并缩短数据保留期'},
      {id: 'collect-everything', label: '上报精确位置并长期保留全部数据'}
    ];
    const aWrap = get('anonymize-choices');
    for (const option of anonymize) {
      const label = document.createElement('label');
      label.className = 'choice';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'protection-anonymize';
      radio.value = option.id;
      label.appendChild(radio);
      label.append(` ${option.label}`);
      aWrap.appendChild(label);
    }
    const mWrap = get('minimize-choices');
    for (const option of minimize) {
      const label = document.createElement('label');
      label.className = 'choice';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'protection-minimize';
      radio.value = option.id;
      label.appendChild(radio);
      label.append(` ${option.label}`);
      mWrap.appendChild(label);
    }
  }

  function readProgress() {
    try { return window.SubjectProgress.read(subject, stage); }
    catch (_) { return null; }
  }

  function renderProgress() {
    const labels = {
      identity: '把四台设备与数字身份标识对应',
      inference: '判断设备数据可推断的个人信息',
      protection: '选择匿名化与数据最小化保护'
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

  function checkIdentity() {
    const selection = {};
    const missing = [];
    for (const device of Model.getDevices()) {
      const value = selectedValue(`identity-${device.id}`);
      if (!value) missing.push(device.label);
      else selection[device.id] = value;
    }
    if (missing.length) {
      feedback('identity-status', `还有 ${missing.length} 台设备没有选择标识。`, 'warning');
      return;
    }
    let result;
    try { result = Model.matchIdentities(selection); }
    catch (error) {
      feedback('identity-status', `匹配数据异常：${error.message}`, 'error');
      return;
    }
    if (!result.correct) {
      done.identity = false;
      done.inference = false;
      done.protection = false;
      get('inference-panel').hidden = true;
      get('protection-panel').hidden = true;
      const wrong = result.mismatches[0];
      if (wrong.actual === 'national-id') {
        feedback('identity-status', '身份证号是人的法定身份，不是设备的数字身份标识。请重新匹配。', 'error');
      } else {
        feedback('identity-status', '该设备与标识不匹配：不同标识分别对应设备 ID、序列号、MAC 地址或账号绑定。请重新选择。', 'error');
      }
      renderProgress();
      return;
    }
    done.identity = true;
    get('inference-panel').hidden = false;
    feedback('identity-status', '正确：每台联网设备都有可被系统识别和关联的数字标识，它不同于人的身份证号。', 'success');
    feedback('inference-status', '现在判断这些不含姓名的数据能推断什么。');
    get('inference-title').focus();
    renderProgress();
  }

  function checkInference() {
    if (!done.identity) {
      feedback('inference-status', '先完成第 1 步的身份匹配。', 'warning');
      return;
    }
    const selection = {};
    const missing = [];
    for (const flow of Model.getDataFlows()) {
      const value = selectedValue(`inference-${flow.id}`);
      if (!value) missing.push(flow.label);
      else selection[flow.id] = value;
    }
    if (missing.length) {
      feedback('inference-status', `还有 ${missing.length} 组数据没有判断。`, 'warning');
      return;
    }
    let result;
    try { result = Model.judgeInference(selection); }
    catch (error) {
      feedback('inference-status', `推断数据异常：${error.message}`, 'error');
      return;
    }
    if (!result.correct) {
      done.inference = false;
      done.protection = false;
      get('protection-panel').hidden = true;
      const choseNone = result.mismatches.some(item => item.actual === 'none');
      const message = choseNone
        ? '即使没有姓名，长期、连续的设备数据也能形成行为画像、关联到具体个人，不能认为推断不出信息。请重新判断。'
        : '数据与可推断信息不匹配：电表对应作息、定位对应住址通勤、可穿戴对应健康。请重新选择。';
      feedback('inference-status', message, 'error');
      renderProgress();
      return;
    }
    done.inference = true;
    get('protection-panel').hidden = false;
    feedback('inference-status', '正确：去标识不等于完全匿名，长期设备数据仍可推断作息、位置和健康等个人信息。', 'success');
    feedback('protection-status', '现在选择上报前的隐私保护做法。');
    get('protection-title').focus();
    renderProgress();
  }

  function checkProtection() {
    if (!done.inference) {
      feedback('protection-status', '先完成推断判断。', 'warning');
      return;
    }
    const decision = {
      anonymize: selectedValue('protection-anonymize'),
      minimize: selectedValue('protection-minimize')
    };
    if (!decision.anonymize || !decision.minimize) {
      feedback('protection-status', '请分别选择标识处理和数据采集保留的做法。', 'warning');
      return;
    }
    let result;
    try { result = Model.chooseProtection(decision); }
    catch (error) {
      feedback('protection-status', `保护数据异常：${error.message}`, 'error');
      return;
    }
    if (!result.correct) {
      done.protection = false;
      const fields = result.mismatches.map(item => item.field);
      const messages = [];
      if (fields.includes('anonymize')) messages.push('固定设备 ID 方便长期追踪，应使用随机化、定期轮换的标识');
      if (fields.includes('minimize')) messages.push('精确位置加长期保留属于过度采集，应只采必需字段并缩短保留期');
      feedback('protection-status', `${messages.join('；')}。请重新选择。`, 'error');
      renderProgress();
      return;
    }
    done.protection = true;
    feedback('protection-status', '正确：随机轮换标识降低关联风险，数据最小化减少采集；匿名化后仍可能被重新识别，两者要配合使用。', 'success');
    maybeComplete();
  }

  renderTaskAndDevices();
  renderFlows();
  renderProtection();
  get('check-identity').addEventListener('click', checkIdentity);
  get('check-inference').addEventListener('click', checkInference);
  get('check-protection').addEventListener('click', checkProtection);
  get('retry-save').addEventListener('click', saveCompletion);
  renderProgress();
})();
