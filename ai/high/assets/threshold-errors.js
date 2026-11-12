(() => {
  'use strict';

  const model = window.ThresholdErrorsModel;
  const slug = 'threshold-errors';
  const byId = id => document.getElementById(id);
  const fpPrediction = byId('fp-prediction');
  const fnPrediction = byId('fn-prediction');
  const revealButton = byId('reveal-button');
  const resetButton = byId('reset-prediction');
  const predictionFeedback = byId('prediction-feedback');
  const threshold = byId('threshold');
  const resultsPanel = byId('results-panel');
  const applicationPanel = byId('application-panel');
  const applicationFeedback = byId('application-feedback');
  const progressStatus = byId('progress-status');
  const retrySave = byId('retry-save');
  const observed = new Set();
  let revealed = false;
  let predictionCorrect = false;
  let eligible = false;
  let savedThisRound = false;

  const outcomeNames = {
    tp: '真正例：有缺陷且需复检',
    fp: '误报：正常却需复检',
    fn: '漏报：有缺陷却放行',
    tn: '真负例：正常且放行'
  };

  function percent(value) {
    if (value === null) return '未定义';
    const rounded = (value * 100).toFixed(1);
    return `${rounded.endsWith('.0') ? rounded.slice(0, -2) : rounded}%`;
  }

  function renderBars(result = null) {
    const items = result ? result.items : model.SAMPLES;
    const rows = items.map(item => {
      const row = document.createElement('li');
      if (result) row.className = `outcome-${item.outcome}`;
      const name = document.createElement('span');
      name.textContent = `工件 ${item.id}`;
      const track = document.createElement('span');
      track.className = 'score-track';
      track.setAttribute('aria-hidden', 'true');
      const fill = document.createElement('span');
      fill.className = 'score-fill';
      fill.style.width = `${item.score / model.SAMPLES.length * 100}%`;
      track.append(fill);
      const detail = document.createElement('span');
      detail.className = 'score-result';
      detail.textContent = result
        ? `分值 ${item.score} · ${outcomeNames[item.outcome]}`
        : `分值 ${item.score} · 标签待揭晓`;
      row.append(name, track, detail);
      return row;
    });
    byId('score-list').replaceChildren(...rows);
  }

  function renderResult() {
    const value = Number(threshold.value);
    const result = model.evaluate(value);
    const baseline = model.evaluate(model.DEFAULT_THRESHOLD);
    observed.add(value);
    byId('threshold-value').value = value;
    for (const outcome of ['tp', 'fp', 'fn', 'tn']) byId(`${outcome}-count`).textContent = result[outcome];
    byId('precision-value').textContent = percent(result.precision);
    byId('recall-value').textContent = percent(result.recall);
    byId('precision-formula').textContent = result.precision === null
      ? 'TP + FP = 0，分母为 0，不能计算精确率'
      : `TP / (TP + FP) = ${result.tp} / ${result.predictedPositive}`;
    byId('recall-formula').textContent = `TP / (TP + FN) = ${result.tp} / ${result.actualPositive}`;
    byId('result-summary').textContent = `阈值 ${value}：12 件中标为需复检 ${result.predictedPositive} 件；真正例 ${result.tp}，误报 ${result.fp}，漏报 ${result.fn}，真负例 ${result.tn}。`;
    byId('comparison-feedback').textContent = value === model.DEFAULT_THRESHOLD
      ? `阈值 9 是基准：误报 ${baseline.fp} 件，漏报 ${baseline.fn} 件。请再查看阈值 4。`
      : `与阈值 9 相比：误报 ${baseline.fp} → ${result.fp} 件，漏报 ${baseline.fn} → ${result.fn} 件。`;
    renderBars(result);
  }

  function refreshProgress() {
    const prior = SubjectProgress.read('ai', 'high');
    progressStatus.textContent = prior === null
      ? '本机进度暂不可用；仍可完成实验。'
      : prior[slug] ? '本机已有完成记录；本轮仍可重新观察。' : '本轮完成前不会保存进度。';
  }

  function saveCompletion() {
    if (!eligible) return;
    if (SubjectProgress.markComplete('ai', 'high', slug)) {
      savedThisRound = true;
      retrySave.hidden = true;
      progressStatus.textContent = '本机已记录完成分类阈值主题。';
    } else {
      retrySave.hidden = false;
      progressStatus.textContent = '本轮判断已完成；本机存储不可用，进度未能保存。';
    }
  }

  function resetPrediction() {
    revealed = false;
    predictionCorrect = false;
    eligible = false;
    savedThisRound = false;
    observed.clear();
    fpPrediction.value = '';
    fnPrediction.value = '';
    fpPrediction.disabled = false;
    fnPrediction.disabled = false;
    revealButton.disabled = true;
    threshold.value = String(model.DEFAULT_THRESHOLD);
    threshold.disabled = true;
    byId('preset-high').disabled = true;
    byId('preset-low').disabled = true;
    resultsPanel.hidden = true;
    applicationPanel.hidden = true;
    retrySave.hidden = true;
    byId('low-miss-choice').value = '';
    byId('low-alarm-choice').value = '';
    predictionFeedback.className = 'status';
    predictionFeedback.textContent = '结果已隐藏。重新选择两个方向后揭晓。';
    applicationFeedback.className = 'status';
    applicationFeedback.textContent = '先查看两个预置阈值。';
    renderBars();
    refreshProgress();
  }

  function reveal() {
    if (revealed || !fpPrediction.value || !fnPrediction.value) return;
    const high = model.evaluate(model.DEFAULT_THRESHOLD);
    const low = model.evaluate(model.COMPARISON_THRESHOLD);
    predictionCorrect = fpPrediction.value === 'up' && fnPrediction.value === 'down';
    revealed = true;
    fpPrediction.disabled = true;
    fnPrediction.disabled = true;
    revealButton.disabled = true;
    threshold.disabled = false;
    byId('preset-high').disabled = false;
    byId('preset-low').disabled = false;
    resultsPanel.hidden = false;
    applicationPanel.hidden = false;
    predictionFeedback.className = predictionCorrect ? 'status success' : 'status';
    predictionFeedback.textContent = `${predictionCorrect ? '预测正确。' : '这次预测未全对；可重新预测。'}阈值从 9 降到 4 时，误报 ${high.fp} → ${low.fp} 件（增加），漏报 ${high.fn} → ${low.fn} 件（减少）。`;
    renderResult();
  }

  function checkChoices() {
    const miss = byId('low-miss-choice').value;
    const alarm = byId('low-alarm-choice').value;
    if (!miss || !alarm) {
      applicationFeedback.textContent = '请先选择两个目标对应的阈值。';
      return;
    }
    if (miss !== '4' || alarm !== '9') {
      applicationFeedback.textContent = '本例阈值 4 漏报 1 件、阈值 9 漏报 3 件；阈值 9 误报 1 件、阈值 4 误报 4 件。请据此重选。';
      return;
    }
    if (!predictionCorrect) {
      applicationFeedback.textContent = '两个目标选择正确；请用“重新预测”再正确判断误报和漏报的变化。';
      return;
    }
    if (!observed.has(4) || !observed.has(9)) {
      applicationFeedback.textContent = '两个目标选择正确；请实际查看阈值 9 与 4 的图示和四格结果。';
      return;
    }
    eligible = true;
    applicationFeedback.className = 'status success';
    applicationFeedback.textContent = '两个目标选择正确：本例少漏报选 4，少误报选 9；现实阈值仍须结合任务代价和独立数据判断。';
    if (!savedThisRound) saveCompletion();
  }

  fpPrediction.disabled = false;
  fnPrediction.disabled = false;
  resetButton.disabled = false;
  for (const select of [fpPrediction, fnPrediction]) {
    select.addEventListener('change', () => {
      revealButton.disabled = !fpPrediction.value || !fnPrediction.value;
    });
  }
  revealButton.addEventListener('click', reveal);
  resetButton.addEventListener('click', resetPrediction);
  threshold.addEventListener('input', () => { if (revealed) renderResult(); });
  byId('preset-high').addEventListener('click', () => {
    threshold.value = String(model.DEFAULT_THRESHOLD);
    renderResult();
  });
  byId('preset-low').addEventListener('click', () => {
    threshold.value = String(model.COMPARISON_THRESHOLD);
    renderResult();
  });
  byId('check-choices').addEventListener('click', checkChoices);
  retrySave.addEventListener('click', saveCompletion);
  renderBars();
  refreshProgress();
})();
