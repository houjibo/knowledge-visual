(function () {
  'use strict';

  const Model = window.HighResponsiblePublishingModel;
  const subject = 'computer';
  const stage = 'high';
  const slug = 'responsible-publishing';
  const get = id => document.getElementById(id);
  const done = {platform: false, prepublish: false, withdrawal: false};
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

  function renderTaskAndPlatforms() {
    const task = Model.getTask();
    get('task-requirement').innerHTML = '';
    get('task-requirement').append(`任务：${task.requirement}`);

    const grid = get('platform-grid');
    for (const platform of Model.getPlatforms()) {
      const card = document.createElement('div');
      card.className = 'platform-card';

      const label = document.createElement('label');
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'platform-choice';
      radio.value = platform.id;
      label.appendChild(radio);
      label.append(` ${platform.label}`);
      card.appendChild(label);

      const meta = document.createElement('ul');
      meta.className = 'platform-meta';
      for (const text of [`受众：${platform.audience}`, `权限：${platform.permission}`, `撤回：${platform.retractable}`]) {
        const item = document.createElement('li');
        item.textContent = text;
        meta.appendChild(item);
      }
      card.appendChild(meta);
      grid.appendChild(card);
    }
  }

  const CHECK_FIELDS = [
    {key: 'source', label: '来源检查', question: '结论是否有可核对的来源？'},
    {key: 'privacy', label: '隐私检查', question: '是否包含可识别个人的真实姓名？'},
    {key: 'authorization', label: '授权检查', question: '配图是否已确认使用授权？'},
    {key: 'permission', label: '权限检查', question: '在所选平台的发布权限是否符合？'}
  ];

  function renderDraftAndChecks() {
    const draft = Model.getDraft();
    get('draft-title').textContent = draft.title;
    get('draft-body').textContent =
      `${draft.body} 草稿写出了“全校可节水约三成”的结论、引用了同学“${draft.realNameSample}”的反馈，并配了一张来源不明的活动照片。`;
    const clues = get('draft-clues');
    for (const text of [
      '结论“约三成”没有标注任何数据来源或引用。',
      `反馈中写出了同学真实姓名“${draft.realNameSample}”，属于可识别个人的信息。`,
      '配图来自网络，尚未确认授权。',
      '校内学习平台允许经指导老师确认后发布，权限本身没有问题。'
    ]) {
      const item = document.createElement('li');
      item.textContent = text;
      clues.appendChild(item);
    }

    const rows = get('check-rows');
    for (const field of CHECK_FIELDS) {
      const row = document.createElement('div');
      row.className = 'check-row';

      const question = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = field.label;
      question.appendChild(strong);
      const detail = document.createElement('div');
      detail.className = 'source-note';
      detail.textContent = field.question;
      question.appendChild(detail);
      row.appendChild(question);

      const options = document.createElement('div');
      options.className = 'check-options';
      for (const [value, text] of [['pass', '通过（没有问题）'], ['fail', '不通过（需要处理）']]) {
        const optionLabel = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `check-${field.key}`;
        radio.value = value;
        optionLabel.appendChild(radio);
        optionLabel.append(` ${text}`);
        options.appendChild(optionLabel);
      }
      row.appendChild(options);
      rows.appendChild(row);
    }
  }

  function readProgress() {
    try { return window.SubjectProgress.read(subject, stage); }
    catch (_) { return null; }
  }

  function renderProgress() {
    const labels = {
      platform: '按需求选用受众可控、可撤回的平台',
      prepublish: '发布前识别来源、隐私和授权问题',
      withdrawal: '区分撤回原件与已传播副本'
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
    } else saveNotice = '';
    renderProgress();
  }

  function maybeComplete() {
    if (Object.values(done).every(Boolean) && !historicalCompletion) saveCompletion();
    else renderProgress();
  }

  function checkPlatform() {
    const choice = selectedValue('platform-choice');
    if (!choice) {
      feedback('platform-status', '请先为这次发布选择一个平台。', 'warning');
      return;
    }
    const result = Model.choosePlatform(choice);
    if (!result.correct) {
      done.platform = false;
      done.prepublish = false;
      done.withdrawal = false;
      get('check-fieldset').disabled = true;
      get('check-prepublish').disabled = true;
      get('withdrawal-panel').hidden = true;
      const message = result.reason === 'over-public-uncontrolled-spread'
        ? '个人公开发布平台对所有人可见，转发和截图不可控，不符合“受众可控、可撤回”的任务要求。请重新选择。'
        : '班级协作空间仅本班可见，无法向全校师生展示，受众过窄。请重新选择。';
      feedback('platform-status', message, 'error');
      renderProgress();
      return;
    }
    done.platform = true;
    get('check-fieldset').disabled = false;
    get('check-prepublish').disabled = false;
    feedback('platform-status', '正确：校内学习平台受众为全校师生且可控，支持发布者与管理员撤回，与任务需求匹配。', 'success');
    feedback('prepublish-status', '现在逐项判断这份草稿能否通过发布前检查。');
    renderProgress();
  }

  function checkPrepublish() {
    if (!done.platform) {
      feedback('prepublish-status', '先完成第 1 步的平台选择。', 'warning');
      return;
    }
    const checks = {};
    const missing = [];
    for (const field of CHECK_FIELDS) {
      const value = selectedValue(`check-${field.key}`);
      if (!value) missing.push(field.label);
      else checks[field.key] = value === 'pass';
    }
    if (missing.length) {
      feedback('prepublish-status', `还有 ${missing.length} 项没有判断（${missing.join('、')}），请逐项选择后再检查。`, 'warning');
      return;
    }
    let result;
    try { result = Model.checkPrepublish(checks); }
    catch (error) {
      feedback('prepublish-status', `核查数据异常：${error.message}`, 'error');
      return;
    }
    if (!result.correct) {
      done.prepublish = false;
      done.withdrawal = false;
      get('withdrawal-panel').hidden = true;
      const labels = {source: '来源', privacy: '隐私', authorization: '授权', permission: '权限'};
      const names = result.mismatches.map(item => labels[item.field]).join('、');
      feedback('prepublish-status', `“${names}”判断与草稿事实不符：无来源结论、真实姓名和未授权配图都应判为不通过，只有平台权限通过。请重新判断。`, 'error');
      renderProgress();
      return;
    }
    done.prepublish = true;
    const spread = Model.getSpreadState();
    get('spread-state').textContent =
      `模拟发布后：原帖可由发布者撤回（${spread.originalRetractable ? '是' : '否'}），但已有 ${spread.forwardedCopies} 个同学转发的副本，发布者无法删除（网络请求数仍为 ${spread.networkRequests}，全程只在本机模拟）。`;
    get('withdrawal-panel').hidden = false;
    feedback('prepublish-status', '正确：来源、隐私、授权三项不通过，问题稿在发布前被阻止；只有平台权限通过。', 'success');
    feedback('withdrawal-status', '现在判断撤回对原件和已转发副本的影响。');
    get('withdrawal-title').focus();
    renderProgress();
  }

  function checkWithdrawal() {
    if (!done.prepublish) {
      feedback('withdrawal-status', '先完成发布前检查。', 'warning');
      return;
    }
    const decision = selectedValue('withdrawal');
    if (!decision) {
      feedback('withdrawal-status', '请选择撤回效果的判断。', 'warning');
      return;
    }
    let result;
    try { result = Model.checkWithdrawal(decision); }
    catch (error) {
      feedback('withdrawal-status', `决策数据异常：${error.message}`, 'error');
      return;
    }
    if (!result.correct) {
      done.withdrawal = false;
      const message = result.reason === 'forwarded-copies-not-controllable'
        ? '撤回不能让他人转发的副本彻底消失，平台不保证发布者能召回所有已传播内容。请重新判断。'
        : '发布者仍然可以撤回自己的原帖，撤回并非完全无效。请重新判断。';
      feedback('withdrawal-status', message, 'error');
      renderProgress();
      return;
    }
    done.withdrawal = true;
    feedback('withdrawal-status', '正确：原件可撤回，但已转发副本不由发布者控制，信息传播具有不可逆性；本页没有真实发布或网络请求。', 'success');
    maybeComplete();
  }

  renderTaskAndPlatforms();
  renderDraftAndChecks();
  get('check-platform').addEventListener('click', checkPlatform);
  get('check-prepublish').addEventListener('click', checkPrepublish);
  get('check-withdrawal').addEventListener('click', checkWithdrawal);
  get('retry-save').addEventListener('click', saveCompletion);
  renderProgress();
})();
