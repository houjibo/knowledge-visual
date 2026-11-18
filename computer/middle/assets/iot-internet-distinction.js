(function () {
  'use strict';

  const Model = window.IotInternetDistinctionModel;
  const subject = 'computer';
  const stage = 'middle';
  const slug = 'iot-internet-distinction';
  const get = id => document.getElementById(id);
  const done = {classify: false, elements: false, impact: false};
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

  function renderTaskAndCases() {
    get('task-note').textContent = Model.getTask().note;
    const list = get('case-list');
    for (const item of Model.getCases()) {
      const card = document.createElement('div');
      card.className = 'case-card';

      const strong = document.createElement('strong');
      strong.textContent = item.label;
      card.appendChild(strong);

      const options = document.createElement('div');
      options.className = 'case-options';
      for (const [value, text] of [['internet', '互联网'], ['iot', '物联网']]) {
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `case-${item.id}`;
        radio.value = value;
        label.appendChild(radio);
        label.append(` ${text}`);
        options.appendChild(label);
      }
      card.appendChild(options);
      list.appendChild(card);
    }
  }

  function renderElements() {
    const elements = Model.getThreeElements();
    const grid = get('element-grid');
    const columns = [
      {key: 'sensor', title: '传感器', name: 'element-sensor'},
      {key: 'network', title: '网络', name: 'element-network'},
      {key: 'actuator', title: '受控设备', name: 'element-actuator'}
    ];
    const options = [elements.sensor, elements.network, elements.actuator, ...elements.distractors];
    for (const column of columns) {
      const wrap = document.createElement('div');
      wrap.className = 'element-col';
      const heading = document.createElement('h3');
      heading.textContent = column.title;
      wrap.appendChild(heading);
      for (const option of options) {
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = column.name;
        radio.value = option.id;
        label.appendChild(radio);
        label.append(` ${option.label}`);
        wrap.appendChild(label);
      }
      grid.appendChild(wrap);
    }
  }

  function renderImpact() {
    const impact = Model.getImpactOptions();
    const benefitWrap = get('benefit-choices');
    const riskWrap = get('risk-choices');
    for (const option of impact.benefits) {
      const label = document.createElement('label');
      label.className = 'choice';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'impact-benefit';
      radio.value = option.id;
      label.appendChild(radio);
      label.append(` ${option.label}`);
      benefitWrap.appendChild(label);
    }
    for (const option of impact.risks) {
      const label = document.createElement('label');
      label.className = 'choice';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'impact-risk';
      radio.value = option.id;
      label.appendChild(radio);
      label.append(` ${option.label}`);
      riskWrap.appendChild(label);
    }
  }

  function readProgress() {
    try { return window.SubjectProgress.read(subject, stage); }
    catch (_) { return null; }
  }

  function renderProgress() {
    const labels = {
      classify: '把六个案例分为互联网或物联网',
      elements: '识别传感器、网络和受控设备',
      impact: '同时看到便利与隐私影响'
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

  function checkClassify() {
    const selection = {};
    const missing = [];
    for (const item of Model.getCases()) {
      const value = selectedValue(`case-${item.id}`);
      if (!value) missing.push(item.label);
      else selection[item.id] = value;
    }
    if (missing.length) {
      feedback('classify-status', `还有 ${missing.length} 个案例没有判断（${missing.slice(0, 2).join('、')}…）。`, 'warning');
      return;
    }
    let result;
    try { result = Model.classify(selection); }
    catch (error) {
      feedback('classify-status', `分类数据异常：${error.message}`, 'error');
      return;
    }
    if (!result.correct) {
      done.classify = false;
      done.elements = false;
      done.impact = false;
      get('element-panel').hidden = true;
      get('impact-panel').hidden = true;
      const wrong = result.mismatches[0];
      const source = Model.getCases().find(item => item.id === wrong.caseId);
      feedback('classify-status', `“${source.label}”判断有误：${source.reason}请重新判断。`, 'error');
      renderProgress();
      return;
    }
    done.classify = true;
    get('element-panel').hidden = false;
    feedback('classify-status', '正确：互联网主要是人与人通信和内容获取；物联网通过传感器自动上报或远程控制物理设备，并常以互联网为网络基础。', 'success');
    feedback('element-status', '现在识别远程控制空调案例的三个要素。');
    get('element-title').focus();
    renderProgress();
  }

  function checkElements() {
    if (!done.classify) {
      feedback('element-status', '先完成第 1 步的分类。', 'warning');
      return;
    }
    const elements = {
      sensor: selectedValue('element-sensor'),
      network: selectedValue('element-network'),
      actuator: selectedValue('element-actuator')
    };
    if (!elements.sensor || !elements.network || !elements.actuator) {
      feedback('element-status', '请为传感器、网络和受控设备各选一项。', 'warning');
      return;
    }
    let result;
    try { result = Model.identifyElements(elements); }
    catch (error) {
      feedback('element-status', `要素数据异常：${error.message}`, 'error');
      return;
    }
    if (!result.correct) {
      done.elements = false;
      done.impact = false;
      get('impact-panel').hidden = true;
      const fieldNames = {sensor: '传感器', network: '网络', actuator: '受控设备'};
      const names = result.mismatches.map(item => fieldNames[item.field]).join('、');
      feedback('element-status', `“${names}”选择有误：手机 App 是人的操作入口、路由器外壳不是设备，真正被控制的是空调。请重新选择。`, 'error');
      renderProgress();
      return;
    }
    done.elements = true;
    get('impact-panel').hidden = false;
    feedback('element-status', '正确：温湿度传感器采集数据，经家庭网络（连接互联网）传送，空调接收指令并执行。', 'success');
    feedback('impact-status', '现在判断这项物联网应用的便利与隐私影响。');
    get('impact-title').focus();
    renderProgress();
  }

  function checkImpact() {
    if (!done.elements) {
      feedback('impact-status', '先完成三要素识别。', 'warning');
      return;
    }
    const benefit = selectedValue('impact-benefit');
    const risk = selectedValue('impact-risk');
    if (!benefit || !risk) {
      feedback('impact-status', '请分别选择一项便利影响和一项隐私/安全影响。', 'warning');
      return;
    }
    let result;
    try { result = Model.judgeImpact({benefit, risk}); }
    catch (error) {
      feedback('impact-status', `影响数据异常：${error.message}`, 'error');
      return;
    }
    if (!result.correct) {
      done.impact = false;
      const fields = result.mismatches.map(item => item.field);
      const messages = [];
      if (fields.includes('benefit')) messages.push('远程控制确实带来提前调节、方便节能的便利，不是“和普通电器完全一样”');
      if (fields.includes('risk')) messages.push('联网设备的标识和长期读数可能推断出在家时间等生活习惯，存在隐私风险');
      feedback('impact-status', `${messages.join('；')}。请重新判断。`, 'error');
      renderProgress();
      return;
    }
    done.impact = true;
    feedback('impact-status', '正确：远程控制既带来便利与节能，也因设备数据可能暴露作息而需要注意隐私与安全。', 'success');
    maybeComplete();
  }

  renderTaskAndCases();
  renderElements();
  renderImpact();
  get('check-classify').addEventListener('click', checkClassify);
  get('check-elements').addEventListener('click', checkElements);
  get('check-impact').addEventListener('click', checkImpact);
  get('retry-save').addEventListener('click', saveCompletion);
  renderProgress();
})();
