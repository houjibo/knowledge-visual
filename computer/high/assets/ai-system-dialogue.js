(function () {
  'use strict';

  const Model = window.HighAiSystemDialogueModel;
  const subject = 'computer';
  const stage = 'high';
  const slug = 'ai-system-dialogue';
  const get = id => document.getElementById(id);
  const done = {comparison: false, evidence: false, action: false};
  let evidenceOpened = false;
  let pendingSave = false;
  let historicalCompletion = false;
  let saveNotice = '';
  const interaction = Model.compareInteractionModes();

  get('form-steps').replaceChildren(...interaction.form.steps.map(text => {
    const item = document.createElement('li');
    item.textContent = text;
    return item;
  }));
  get('form-step-summary').textContent = `本例显示 ${interaction.form.steps.length} 个查找步骤；这是路径示意，不是耗时测量。`;
  get('dialogue-prompt').textContent = interaction.dialogue.prompt;
  get('assistant-response').textContent = interaction.dialogue.response;

  function feedback(id, message, kind = '') {
    const node = get(id);
    node.textContent = message;
    node.classList.remove('success', 'error', 'warning');
    if (kind) node.classList.add(kind);
  }

  function selectedRadio(name) {
    const item = document.querySelector(`input[name="${name}"]:checked`);
    return item ? item.value : '';
  }

  function readProgress() {
    try { return window.SubjectProgress.read(subject, stage); }
    catch (_) { return null; }
  }

  function renderProgress() {
    const labels = {
      comparison: '识别两种路径使用相同记录',
      evidence: '根据预约记录核验续借回答',
      action: '区分生成文字与已提交动作'
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

  function checkComparison() {
    const answer = selectedRadio('comparison-check');
    if (!answer) {
      feedback('comparison-status', '先选择两条交互路径是否使用相同记录。', 'warning');
      return;
    }
    evidenceOpened = false;
    done.evidence = false;
    done.action = false;
    get('evidence-panel').hidden = true;
    get('action-panel').hidden = true;
    document.querySelectorAll('input[name="trust-prediction"], input[name="renewal-decision"], input[name="action-boundary"]')
      .forEach(input => { input.checked = false; });
    if (answer !== 'same') {
      done.comparison = false;
      get('reveal-evidence').disabled = true;
      feedback('comparison-status', '路径改变了表达方式；本例的书目、借阅事实和规则保持相同。请重新判断。', 'error');
      renderProgress();
      return;
    }
    done.comparison = true;
    get('reveal-evidence').disabled = false;
    feedback('comparison-status', '正确：两种界面都围绕同一项借阅咨询。路径差异不代表一般性能或速度结论。', 'success');
    feedback('prediction-status', '先记录你对回复可靠性的预测。');
    renderProgress();
  }

  function showEvidence() {
    if (!done.comparison) {
      feedback('prediction-status', '先完成两种交互路径的比较。', 'warning');
      return;
    }
    const prediction = selectedRadio('trust-prediction');
    if (!prediction) {
      feedback('prediction-status', '先选择你当前的判断，再查看记录。', 'warning');
      return;
    }
    const evidence = Model.getEvidence();
    evidenceOpened = true;
    get('reservation-count').textContent = `${evidence.record.queuedReservations} 人等待`;
    get('loan-status').textContent = evidence.record.recordStatus;
    get('system-state').textContent = `当前系统记录：${evidence.record.recordStatus}。对话样例只提供文字，没有提交业务动作。`;
    get('evidence-panel').hidden = false;
    feedback('prediction-status', prediction === 'act'
      ? '已记录预测。现在对照预约队列和业务规则，检查回答是否有依据。'
      : '已记录预测。下面查看系统原始记录和续借规则。', 'success');
    feedback('decision-status', '来源已显示；判断对话建议是否符合记录与规则。');
    get('evidence-title').focus();
  }

  function checkDecision() {
    if (!evidenceOpened) {
      feedback('decision-status', '先查看虚构系统记录与规则，再作判断。', 'warning');
      return;
    }
    const decision = selectedRadio('renewal-decision');
    if (!decision) {
      feedback('decision-status', '选择是否按对话建议直接续借。', 'warning');
      return;
    }
    const result = Model.verifyRenewalDecision({evidenceOpened, decision});
    if (!result.correct) {
      done.evidence = false;
      done.action = false;
      get('action-panel').hidden = true;
      feedback('decision-status', '还不能办理：预约队列有 1 人，规则明确禁止此时续借。对话答案与系统记录冲突，请重新判断。', 'error');
      renderProgress();
      return;
    }
    done.evidence = true;
    get('action-panel').hidden = false;
    feedback('decision-status', '正确：预约队列与续借规则优先于这条对话样例。当前记录仍是“未续借”。', 'success');
    feedback('action-status', '现在判断文字回复是否已改变业务状态。');
    get('action-title').focus();
    renderProgress();
  }

  function checkActionBoundary() {
    if (!done.evidence) {
      feedback('action-status', '先完成来源核验。', 'warning');
      return;
    }
    const answer = selectedRadio('action-boundary');
    if (!answer) {
      feedback('action-status', '请选择回答出现后的系统记录状态。', 'warning');
      return;
    }
    if (answer !== 'unchanged') {
      done.action = false;
      feedback('action-status', '文字建议不等于已提交业务请求；系统记录仍显示“未续借”。请重新判断。', 'error');
      renderProgress();
      return;
    }
    done.action = true;
    feedback('action-status', '正确：对话只产生文字，本例借阅记录没有变化，也没有真实续借。', 'success');
    maybeComplete();
  }

  get('check-comparison').addEventListener('click', checkComparison);
  get('reveal-evidence').addEventListener('click', showEvidence);
  get('check-decision').addEventListener('click', checkDecision);
  get('check-action-boundary').addEventListener('click', checkActionBoundary);
  get('retry-save').addEventListener('click', saveCompletion);
  renderProgress();
})();
