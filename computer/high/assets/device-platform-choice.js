(function () {
  'use strict';

  const Model = window.HighDevicePlatformChoiceModel;
  const subject = 'computer';
  const stage = 'high';
  const slug = 'device-platform-choice';
  const get = id => document.getElementById(id);
  const done = {device: false, platform: false, data: false};
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

  function renderTaskAndDevices() {
    const task = Model.getTask();
    get('task-requirement').textContent = `任务：${task.requirement}`;
    const grid = get('device-grid');
    for (const device of Model.getDevices()) {
      const card = document.createElement('div');
      card.className = 'device-card';

      const label = document.createElement('label');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'device-choice';
      radio.value = device.id;
      label.appendChild(radio);
      label.append(` ${device.label}`);
      card.appendChild(label);

      const caps = document.createElement('ul');
      caps.className = 'cap-list';
      const capabilityText = {
        offline: device.capabilities.offline ? '可离线工作' : '依赖联网',
        camera: device.capabilities.camera ? '带相机' : '无相机',
        portable: device.capabilities.portable ? '便携' : '不便携'
      };
      for (const text of [capabilityText.offline, capabilityText.camera, capabilityText.portable, device.detail]) {
        const item = document.createElement('li');
        item.textContent = text;
        caps.appendChild(item);
      }
      card.appendChild(caps);
      grid.appendChild(card);
    }
  }

  function renderStages() {
    const wrap = get('stage-rows');
    for (const stageInfo of Model.getStages()) {
      const row = document.createElement('div');
      row.className = 'stage-row';

      const name = document.createElement('div');
      name.className = 'stage-name';
      const strong = document.createElement('strong');
      strong.textContent = stageInfo.label;
      name.appendChild(strong);
      const condition = document.createElement('span');
      condition.textContent = stageInfo.condition;
      name.appendChild(condition);
      row.appendChild(name);

      const options = document.createElement('div');
      options.className = 'platform-options';
      for (const platform of Model.getPlatforms()) {
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `stage-${stageInfo.id}`;
        radio.value = platform.id;
        label.appendChild(radio);
        label.append(` ${platform.label}`);
        options.appendChild(label);
      }
      row.appendChild(options);
      wrap.appendChild(row);
    }
  }

  function renderContributions() {
    const body = get('contribution-body');
    const choices = get('member-choices');
    for (const member of Model.getPlatformData().contributions) {
      const row = document.createElement('tr');
      const cells = [member.memberId, `${member.edits} 次`, `${member.lastSyncHoursAgo} 小时前`, member.active ? '是' : '否'];
      for (const value of cells) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.appendChild(cell);
      }
      body.appendChild(row);

      const label = document.createElement('label');
      label.className = 'choice';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'active-members';
      checkbox.value = member.memberId;
      label.appendChild(checkbox);
      label.append(` ${member.memberId}（编辑 ${member.edits} 次，${member.lastSyncHoursAgo} 小时前同步）`);
      choices.appendChild(label);
    }
  }

  function readProgress() {
    try { return window.SubjectProgress.read(subject, stage); }
    catch (_) { return null; }
  }

  function renderProgress() {
    const labels = {
      device: '按离线、拍照与便携约束选设备',
      platform: '按联网与协作条件匹配三阶段平台',
      data: '依据平台数据判断协作者并处理冲突'
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

  const DEVICE_REASON = {
    'network-dependent-weak-battery': '轻薄办公本部分记录与同步依赖联网，野外续航也有限，不满足无网离线条件。请重新选择。',
    'not-portable-needs-power': '桌面工作站需要固定电源和场地、无法带到野外。请重新选择。',
    'cannot-run-recording-program': '功能机不能安装考察记录程序，也无法整理结构化数据。请重新选择。'
  };

  function checkDevice() {
    const choice = selectedValue('device-choice');
    if (!choice) {
      feedback('device-status', '请先为这次野外记录选择一台设备。', 'warning');
      return;
    }
    const result = Model.chooseDevice(choice);
    if (!result.correct) {
      done.device = false;
      done.platform = false;
      done.data = false;
      get('platform-panel').hidden = true;
      get('data-panel').hidden = true;
      feedback('device-status', DEVICE_REASON[result.reason] || '该设备不满足任务约束，请重新选择。', 'error');
      renderProgress();
      return;
    }
    done.device = true;
    get('platform-panel').hidden = false;
    feedback('device-status', '正确：加固平板可离线运行记录程序、带相机、便携且续航长，满足野外约束。', 'success');
    feedback('platform-status', '现在为野外、营地、回校三个阶段分别选择平台。');
    get('platform-title').focus();
    renderProgress();
  }

  function checkPlatforms() {
    if (!done.device) {
      feedback('platform-status', '先完成第 1 步的设备选择。', 'warning');
      return;
    }
    const mapping = {};
    const missing = [];
    for (const stageInfo of Model.getStages()) {
      const value = selectedValue(`stage-${stageInfo.id}`);
      if (!value) missing.push(stageInfo.label);
      else mapping[stageInfo.id] = value;
    }
    if (missing.length) {
      feedback('platform-status', `还有 ${missing.length} 个阶段没有选择平台（${missing.join('、')}）。`, 'warning');
      return;
    }
    let result;
    try { result = Model.matchPlatforms(mapping); }
    catch (error) {
      feedback('platform-status', `匹配数据异常：${error.message}`, 'error');
      return;
    }
    if (!result.correct) {
      done.platform = false;
      done.data = false;
      get('data-panel').hidden = true;
      const stageNames = {field: '野外', camp: '营地', school: '回校'};
      const detail = result.mismatches.map(item => {
        if (item.actual === 'video-site') return `${stageNames[item.stage]}阶段不能用仅在线视频网站做记录或协作`;
        if (item.stage === 'field') return '野外无网，必须选择可离线工作的平台';
        return `${stageNames[item.stage]}阶段需要多人协作，应选择云端协作文档`;
      }).join('；');
      feedback('platform-status', `${detail}。请重新匹配。`, 'error');
      renderProgress();
      return;
    }
    done.platform = true;
    get('data-panel').hidden = false;
    feedback('platform-status', '正确：野外离线记录，营地与回校用云端协作文档汇总；视频网站只用于观看，不做记录或协作。', 'success');
    feedback('data-status', '现在依据平台数据判断持续协作者并处理同步冲突。');
    get('data-title').focus();
    renderProgress();
  }

  function checkData() {
    if (!done.platform) {
      feedback('data-status', '先完成平台匹配。', 'warning');
      return;
    }
    const activeMembers = selectedValues('active-members');
    const conflictAction = selectedValue('conflict-action');
    if (activeMembers.length === 0 || !conflictAction) {
      feedback('data-status', '请勾选持续协作的成员，并选择同步冲突的处理方式。', 'warning');
      return;
    }
    let result;
    try { result = Model.decideCollaboration({activeMembers, conflictAction}); }
    catch (error) {
      feedback('data-status', `决策数据异常：${error.message}`, 'error');
      return;
    }
    if (!result.correct) {
      done.data = false;
      const fields = result.mismatches.map(item => item.field);
      const messages = [];
      if (fields.includes('activeMembers')) messages.push('应依据编辑次数和最近同步时间，选出近期仍在同步且有实质编辑的两名成员');
      if (fields.includes('conflictAction')) messages.push('直接覆盖会丢失野外离线采集的数据，应保留双方版本再人工合并');
      feedback('data-status', `${messages.join('；')}。请重新判断。`, 'error');
      renderProgress();
      return;
    }
    done.data = true;
    feedback('data-status', '正确：member-a 与 member-b 近期持续同步且有实质编辑；同步冲突保留双方版本再人工合并，避免丢失离线数据。', 'success');
    maybeComplete();
  }

  renderTaskAndDevices();
  renderStages();
  renderContributions();
  get('check-device').addEventListener('click', checkDevice);
  get('check-platforms').addEventListener('click', checkPlatforms);
  get('check-data').addEventListener('click', checkData);
  get('retry-save').addEventListener('click', saveCompletion);
  renderProgress();
})();
