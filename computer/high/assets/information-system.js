(function () {
  'use strict';
  const Model = window.InformationSystemModel;
  const get = id => document.getElementById(id);
  const subject = 'computer', stage = 'high', slug = 'information-system';
  const previous = window.SubjectProgress.read(subject, stage);
  let historicalCompletion = previous !== null && previous[slug] === true;
  let state = Model.createState(2);
  let elementsCorrect = false, riskCorrect = false, observedBypass = false;
  const scenarios = new Set();
  const history = [];
  let earned = false, pendingSave = false, saveNotice = '';

  const challengeLabels = [
    ['elements', '识别输入、规则、数据与输出'],
    ['borrowed', '预测正常借阅并观察写入'],
    ['limit', '预测借阅上限拒绝'],
    ['forbidden', '预测未授权补库存被阻止'],
    ['bypass', '预测关闭权限检查后的错误放行'],
    ['offline', '预测断线时服务端未收到'],
    ['risk', '解释应恢复处理程序的权限检查']
  ];

  function setFeedback(id, message, kind = '') {
    const node = get(id);
    node.textContent = message;
    node.className = `feedback${kind ? ` ${kind}` : ''}`;
  }

  function renderChallenges() {
    const done = key => key === 'elements' ? elementsCorrect : key === 'risk' ? riskCorrect : scenarios.has(key);
    const list = get('challenge-list'); list.replaceChildren();
    for (const [key, label] of challengeLabels) {
      const item = document.createElement('li');
      item.textContent = `${done(key) ? '✓ 已完成' : '○ 待完成'} · ${label}`;
      list.append(item);
    }
    get('retry-save').hidden = !pendingSave;
    if (pendingSave) setFeedback('progress-status', '本轮已达标，但进度未能保存。修复浏览器存储后可重试；损坏的原始记录不会自动覆盖。', 'error');
    else if (saveNotice) setFeedback('progress-status', saveNotice, 'success');
    else if (historicalCompletion) setFeedback('progress-status', '本机已有这个主题的完成记录；仍可调整原型继续探索。', 'success');
    else if (previous === null) setFeedback('progress-status', '本机进度暂不可用；仍可学习，达标后若保存失败可重试。');
    else setFeedback('progress-status', '完成七项挑战后保存本机进度。');
  }

  function saveCompletion() {
    if (!earned) return;
    let saved = false;
    try { saved = window.SubjectProgress.markComplete(subject, stage, slug) === true; }
    catch (_) { saved = false; }
    pendingSave = !saved;
    if (saved) {
      historicalCompletion = true;
      saveNotice = '七项挑战已完成，已保存本机学习进度。';
    } else saveNotice = '';
    renderChallenges();
  }

  function maybeEarn() {
    if (!earned && elementsCorrect && riskCorrect && ['borrowed', 'limit', 'forbidden', 'bypass', 'offline'].every(key => scenarios.has(key))) {
      earned = true; saveCompletion();
    } else renderChallenges();
  }

  function renderState() {
    get('stock-count').textContent = `${state.stock} 本`;
    get('loans-s01').textContent = `${state.loans['S-01']} 本`;
    get('loans-s02').textContent = `${state.loans['S-02']} 本`;
    get('revision-count').textContent = String(state.revision);
    const books = get('stock-visual'); books.replaceChildren();
    for (let i = 0; i < 4; i++) {
      const book = document.createElement('span');
      book.className = `book${i >= state.stock ? ' empty' : ''}`;
      book.textContent = i < state.stock ? 'B-01' : '空';
      books.append(book);
    }
    books.setAttribute('aria-label', `库存 ${state.stock} 本，4 个位置；S-01 已借 ${state.loans['S-01']} 本，S-02 已借 ${state.loans['S-02']} 本。`);
  }

  function renderTrace(trace) {
    for (const item of trace) {
      const node = get('flow').querySelector(`[data-stage="${item.stage}"]`);
      node.className = item.state;
      node.querySelector('p').textContent = item.text;
    }
  }

  function renderHistory() {
    const list = get('request-history'); list.replaceChildren();
    if (history.length === 0) {
      const empty = document.createElement('li'); empty.textContent = '尚无请求。'; list.append(empty); return;
    }
    for (const entry of history.slice(-8)) {
      const item = document.createElement('li');
      item.textContent = `${entry.actor} ${entry.action}：预测${entry.prediction}，实际${entry.actual}；库存 ${entry.before} → ${entry.after} 本。`;
      list.append(item);
    }
  }

  function currentConfig() {
    return {loanLimit: Number(get('loan-limit').value), accessCheck: get('access-check').value === 'on', connection: get('connection').value};
  }

  function markConfigurationChanged() {
    saveNotice = '';
    get('outcome-prediction').value = '';
    get('configuration-warning').hidden = get('access-check').value !== 'off';
    setFeedback('prediction-status', '配置或请求已改变，请先预测下一条请求的结果。');
    renderChallenges();
  }

  function resetState() {
    state = Model.createState(Number(get('stock-start').value));
    history.length = 0;
    saveNotice = '';
    renderState(); renderHistory();
    for (const node of get('flow').children) { node.className = ''; node.querySelector('p').textContent = '等待请求'; }
    setFeedback('state-change', `已回到库存 ${state.stock} 本、两名学生各借 0 本、数据版本 0 的起点。`);
    markConfigurationChanged();
  }

  function checkElements() {
    const choices = {
      input: get('element-input').value, rule: get('element-rule').value,
      data: get('element-data').value, output: get('element-output').value
    };
    const checks = Model.checkElements(choices);
    const labels = [['input', '输入是请求者和动作'], ['rule', '规则是上限与权限检查'],
      ['data', '数据是库存与借阅计数'], ['output', '输出是批准或拒绝的反馈']];
    const list = get('element-feedback'); list.replaceChildren();
    for (const [key, text] of labels) {
      const item = document.createElement('li'); item.textContent = `${checks[key] ? '✓' : '请再检查'} ${text}`; list.append(item);
    }
    elementsCorrect = checks.ready;
    setFeedback('elements-status', checks.ready
      ? '四项要素判断正确。人、终端和模拟连接也参与了这次流程。'
      : '有要素尚未放对；观察上方系统组成后再试。', checks.ready ? 'success' : 'error');
    maybeEarn();
  }

  function runRequest() {
    const prediction = get('outcome-prediction').value;
    if (!prediction) {
      setFeedback('prediction-status', '先预测系统结果，再提交模拟请求。', 'error');
      get('outcome-prediction').focus(); return;
    }
    const config = currentConfig();
    const request = {actor: get('request-actor').value, action: get('request-action').value};
    let result;
    try { result = Model.simulate(config, request, state); }
    catch (error) { setFeedback('prediction-status', error.message, 'error'); return; }
    const correct = prediction === result.outcome;
    state = result.after;
    renderState(); renderTrace(result.trace);
    history.push({actor: Model.ACTORS[request.actor].label, action: request.action === 'borrow' ? '借阅' : '补库存',
      prediction: Model.OUTCOME_LABELS[prediction], actual: Model.OUTCOME_LABELS[result.outcome],
      before: result.before.stock, after: result.after.stock});
    renderHistory();
    setFeedback('prediction-status', `${correct ? '预测正确' : '预测未通过'}：实际结果为“${Model.OUTCOME_LABELS[result.outcome]}”。${result.reason}`,
      result.risk ? 'warning' : correct ? 'success' : 'error');
    setFeedback('state-change', result.changed
      ? `数据写入：库存 ${result.before.stock} → ${result.after.stock} 本，版本 ${result.before.revision} → ${result.after.revision}；S-01 ${result.before.loans['S-01']} → ${result.after.loans['S-01']} 本，S-02 ${result.before.loans['S-02']} → ${result.after.loans['S-02']} 本。`
      : `没有数据写入：库存仍为 ${result.after.stock} 本，版本仍为 ${result.after.revision}。`);
    if (result.risk) {
      observedBypass = true;
      get('risk-decision').disabled = false;
      get('check-risk').disabled = false;
      setFeedback('risk-status', '已观察到学生补库存被错误放行；请选择修复做法。', 'warning');
    }
    if (correct) {
      if (result.outcome === 'borrowed' && config.accessCheck) scenarios.add('borrowed');
      if (result.outcome === 'limit') scenarios.add('limit');
      if (result.outcome === 'forbidden' && request.action === 'restock') scenarios.add('forbidden');
      if (result.risk) scenarios.add('bypass');
      if (result.outcome === 'offline') scenarios.add('offline');
    }
    get('outcome-prediction').value = '';
    maybeEarn();
  }

  function checkRisk() {
    if (!observedBypass) return;
    const choice = get('risk-decision').value;
    if (!choice) { setFeedback('risk-status', '先选择一种修复做法。', 'error'); get('risk-decision').focus(); return; }
    riskCorrect = choice === 'server-control';
    setFeedback('risk-status', riskCorrect
      ? '判断正确：处理程序必须核对角色，并复核写入；只隐藏终端按钮无法阻止其他请求。'
      : '这不能阻止处理程序接受未授权请求；应恢复角色检查并复核写入。',
    riskCorrect ? 'success' : 'error');
    maybeEarn();
  }

  for (const id of ['element-input', 'element-rule', 'element-data', 'element-output']) get(id).addEventListener('change', () => {
    elementsCorrect = false; saveNotice = '';
    setFeedback('elements-status', '要素选择已改变，请重新核对。'); renderChallenges();
  });
  get('check-elements').addEventListener('click', checkElements);
  get('stock-start').addEventListener('change', resetState);
  for (const id of ['loan-limit', 'access-check', 'connection', 'request-actor', 'request-action']) get(id).addEventListener('change', markConfigurationChanged);
  get('outcome-prediction').addEventListener('change', () => {
    saveNotice = ''; setFeedback('prediction-status', '预测已修改，提交后观察真实处理轨迹。'); renderChallenges();
  });
  get('run-request').addEventListener('click', runRequest);
  get('reset-state').addEventListener('click', resetState);
  get('risk-decision').addEventListener('change', () => {
    riskCorrect = false; saveNotice = '';
    setFeedback('risk-status', '修复判断已修改，请重新核对。'); renderChallenges();
  });
  get('check-risk').addEventListener('click', checkRisk);
  get('retry-save').addEventListener('click', saveCompletion);
  renderState(); renderChallenges();
})();
