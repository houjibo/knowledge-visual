(function () {
  'use strict';
  const Model = window.DataWorkbenchModel;
  const get = id => document.getElementById(id);
  const subject = 'computer', stage = 'high', slug = 'data-workbench';
  const previous = window.SubjectProgress.read(subject, stage);
  let historicalCompletion = previous !== null && previous[slug] === true;
  const encoded = new Set();
  let planCorrect = false, analysis = null, meanCorrect = false, reportCorrect = false;
  let earned = false, pendingSave = false, saveNotice = '';

  function setFeedback(id, message, kind = '') {
    const element = get(id);
    element.textContent = message;
    element.className = `feedback${kind ? ` ${kind}` : ''}`;
  }

  function updateEncodingTally() {
    get('encoding-tally').textContent = `已正确预测 ${encoded.size}/3 种符号。`;
  }

  function renderChallenges() {
    const items = [
      [encoded.size === 3, 'A、中文符号、表情符号的 UTF-8 字节数'],
      [planCorrect, '单位、缺失与重复的整理方案'],
      [analysis !== null && meanCorrect, '当前四个有效日的均值'],
      [analysis !== null && reportCorrect, '有边界的图表报告结论']
    ];
    const list = get('challenge-list');
    list.replaceChildren();
    items.forEach(([done, label]) => {
      const li = document.createElement('li');
      li.textContent = `${done ? '✓ 已完成' : '○ 待完成'} · ${label}`;
      list.append(li);
    });
    get('retry-save').hidden = !pendingSave;
    if (pendingSave) {
      setFeedback('progress-status', '本轮已赢得完成资格，但记录未能保存。修复浏览器存储后可重试；损坏的原始记录不会自动覆盖。', 'error');
    } else if (saveNotice) setFeedback('progress-status', saveNotice, 'success');
    else if (historicalCompletion) setFeedback('progress-status', '本机已有这个主题的完成记录；当前数据仍可继续探索。', 'success');
    else if (previous === null) setFeedback('progress-status', '本机进度暂不可用；仍可完成本轮学习，保存失败后可重试。');
    else setFeedback('progress-status', '完成四组挑战后保存本机进度。');
  }

  function saveCompletion() {
    if (!earned) return;
    let saved = false;
    try { saved = window.SubjectProgress.markComplete(subject, stage, slug) === true; }
    catch (_) { saved = false; }
    pendingSave = !saved;
    if (saved) {
      historicalCompletion = true;
      saveNotice = '四组挑战已完成，已保存本机学习进度。';
    } else saveNotice = '';
    renderChallenges();
  }

  function maybeEarn() {
    if (!earned && encoded.size === 3 && planCorrect && analysis !== null && meanCorrect && reportCorrect) {
      earned = true;
      saveCompletion();
    } else renderChallenges();
  }

  function resetEncodingView() {
    saveNotice = '';
    get('byte-prediction').value = '';
    get('encoding-result').hidden = true;
    setFeedback('encoding-status', '先预测当前符号的 UTF-8 字节数。');
  }

  function checkEncoding() {
    const prediction = get('byte-prediction').value;
    if (!prediction) {
      setFeedback('encoding-status', '请选择一个字节数，再查看真实编码。', 'error');
      get('byte-prediction').focus();
      return;
    }
    const result = Model.encodeSymbol(get('symbol-select').value);
    get('code-point').textContent = `${result.symbol} 对应 ${result.codePoint}；UTF-8 共 ${result.count} 字节。`;
    const list = get('byte-list');
    list.replaceChildren();
    result.bytes.forEach((byte, index) => {
      const item = document.createElement('li');
      const title = document.createElement('strong'); title.textContent = `字节 ${index + 1}`;
      const hex = document.createElement('code'); hex.textContent = `${byte.hex}₁₆`;
      const binary = document.createElement('code'); binary.textContent = `${byte.binary}₂`;
      item.append(title, hex, binary); list.append(item);
    });
    get('encoding-result').hidden = false;
    const correct = Number(prediction) === result.count;
    if (correct) encoded.add(result.key);
    setFeedback('encoding-status', correct
      ? `预测正确：${result.symbol} 在 UTF-8 中占 ${result.count} 字节。`
      : `这次预测不符：${result.symbol} 实际占 ${result.count} 字节；观察下方逐字节证据后可重试。`,
    correct ? 'success' : 'error');
    updateEncodingTally();
    maybeEarn();
  }

  function clearMeanAndReport() {
    saveNotice = '';
    meanCorrect = false; reportCorrect = false;
    get('mean-prediction').value = '';
    get('report-decision').value = '';
    get('report-decision').disabled = true;
    get('check-report').disabled = true;
    setFeedback('mean-status', '先观察当前图表，再预测四个有效日的平均值。');
    setFeedback('report-status', '均值正确后选择结论。');
  }

  function addChartRow(day, liters, maximum) {
    const row = document.createElement('div'); row.className = `chart-row${liters === null ? ' missing' : ''}`;
    const name = document.createElement('strong'); name.textContent = day;
    const track = document.createElement('div'); track.className = 'bar-track';
    const value = document.createElement('span'); value.className = 'chart-value';
    if (liters === null) value.textContent = '缺失 · 不计';
    else {
      const bar = document.createElement('span'); bar.className = 'bar';
      bar.style.width = `${100 * liters / maximum}%`;
      track.append(bar); value.textContent = `${liters} L`;
    }
    row.append(name, track, value);
    get('chart-rows').append(row);
  }

  function renderAnalysis() {
    if (!planCorrect) return;
    get('analysis-panel').hidden = false;
    const raw = {
      monday: get('monday-reading').value, tuesday: get('tuesday-reading').value,
      wednesdayMl: get('wednesday-reading').value, friday: get('friday-reading').value
    };
    analysis = Model.analyzeReadings(raw);
    if (!analysis.ok) {
      const error = analysis.error;
      analysis = null;
      get('chart').hidden = true;
      get('mean-prediction').disabled = true;
      get('check-mean').disabled = true;
      setFeedback('data-status', error, 'error');
      renderChallenges();
      return;
    }
    get('chart').hidden = false;
    get('mean-prediction').disabled = false;
    get('check-mean').disabled = false;
    setFeedback('data-status', '6 条原始记录整理为 4 个有读数的日子；周三已换算为 L，周四缺失，重复 F-05 只计一次。');
    get('chart-scale').textContent = `横向长度表示升数；统一刻度 0–${analysis.axisMaximum} L，柱形从 0 开始。周四没有柱形，不代表 0 L。`;
    get('chart-rows').replaceChildren();
    for (const item of analysis.observed) {
      if (item.day === '周五') addChartRow('周四', null, analysis.axisMaximum);
      addChartRow(item.day, item.liters, analysis.axisMaximum);
    }
    const axis = get('chart-axis'); axis.replaceChildren();
    const zero = document.createElement('span'); zero.textContent = '0 L';
    const top = document.createElement('span'); top.textContent = `${analysis.axisMaximum} L`;
    axis.append(zero, top);
    renderChallenges();
  }

  function resetPlan() {
    planCorrect = false; analysis = null;
    get('analysis-panel').hidden = true;
    get('decision-feedback').replaceChildren();
    clearMeanAndReport();
    setFeedback('plan-status', '方案已修改，请重新核对三个决定。');
    renderChallenges();
  }

  function checkPlan() {
    const result = Model.checkPlan({unit: get('unit-decision').value,
      missing: get('missing-decision').value, duplicate: get('duplicate-decision').value});
    const messages = [
      [result.unit, '单位：1000 mL = 1 L，毫升数应除以 1000。'],
      [result.missing, '缺失：没有读数只能标记待补测，不能当作真实的 0 L。'],
      [result.duplicate, '重复：同一 F-05 记录只保留一条，不能双算或全部删除。']
    ];
    const list = get('decision-feedback'); list.replaceChildren();
    messages.forEach(([correct, detail]) => {
      const li = document.createElement('li'); li.textContent = `${correct ? '✓' : '请再检查'} ${detail}`;
      list.append(li);
    });
    planCorrect = result.ready;
    clearMeanAndReport();
    if (planCorrect) {
      setFeedback('plan-status', '三个处理决定正确。现在观察图表并预测均值。', 'success');
      renderAnalysis();
    } else {
      analysis = null; get('analysis-panel').hidden = true;
      setFeedback('plan-status', '还有处理决定需要修改；正确处理后再生成图表。', 'error');
      renderChallenges();
    }
  }

  function onReadingsChanged() {
    get('duplicate-reading').textContent = get('friday-reading').value || '未填写';
    clearMeanAndReport();
    if (planCorrect) renderAnalysis();
    else renderChallenges();
  }

  function checkMean() {
    if (!analysis) return;
    meanCorrect = Model.checkMean(get('mean-prediction').value, analysis.mean);
    reportCorrect = false;
    get('report-decision').value = '';
    get('report-decision').disabled = !meanCorrect;
    get('check-report').disabled = !meanCorrect;
    setFeedback('report-status', meanCorrect ? '均值已核对。请选择能由这组数据支持的结论。' : '均值正确后选择结论。');
    const values = analysis.observed.map(item => item.liters).join(' + ');
    setFeedback('mean-status', meanCorrect
      ? `预测正确：（${values}）÷ 4 = ${analysis.mean.toFixed(2)} L。周四缺失、重复周五都不进入分母。`
      : `当前预测未通过。请把四个有效日的升数相加，再除以 4；空白日不计入分母。`,
    meanCorrect ? 'success' : 'error');
    maybeEarn();
  }

  function checkReport() {
    if (!analysis || !meanCorrect) return;
    reportCorrect = get('report-decision').value === 'bounded';
    setFeedback('report-status', reportCorrect
      ? `判断正确：四个观测日平均 ${analysis.mean.toFixed(2)} L；周四和更长时期需要额外数据。`
      : '这个结论超出了现有记录。缺失日没有真实数值，四个观测日也不能代表整个学期。',
    reportCorrect ? 'success' : 'error');
    maybeEarn();
  }

  get('symbol-select').addEventListener('change', resetEncodingView);
  get('check-encoding').addEventListener('click', checkEncoding);
  for (const id of ['unit-decision', 'missing-decision', 'duplicate-decision']) get(id).addEventListener('change', resetPlan);
  get('check-plan').addEventListener('click', checkPlan);
  for (const id of ['monday-reading', 'tuesday-reading', 'wednesday-reading', 'friday-reading']) get(id).addEventListener('input', onReadingsChanged);
  get('mean-prediction').addEventListener('input', () => {
    saveNotice = '';
    meanCorrect = false; reportCorrect = false;
    get('report-decision').value = '';
    get('report-decision').disabled = true;
    get('check-report').disabled = true;
    setFeedback('mean-status', '预测已修改，请核对当前均值。');
    setFeedback('report-status', '均值正确后选择结论。');
    renderChallenges();
  });
  get('check-mean').addEventListener('click', checkMean);
  get('report-decision').addEventListener('change', () => {
    saveNotice = '';
    reportCorrect = false;
    setFeedback('report-status', '结论已修改，请核对。');
    renderChallenges();
  });
  get('check-report').addEventListener('click', checkReport);
  get('retry-save').addEventListener('click', saveCompletion);
  updateEncodingTally();
  renderChallenges();
})();
