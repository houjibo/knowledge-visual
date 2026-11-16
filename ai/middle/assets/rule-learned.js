(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const model = window.KVRuleLearnedModel;
  if (!model || !window.SubjectProgress) {
    $('train-samples').textContent = '练习加载失败，请刷新页面。';
    $('progress-status').textContent = '本机进度暂不可用。';
    return;
  }
  const slug = 'rule-learned-comparison';
  let trained = null;
  let testSeen = false;
  let adapted = false;
  let eligible = false;
  let saveAttempted = false;
  const manual = $('manual-threshold');
  function setFeedback(id, text, kind) { $(id).textContent = text; $(id).className = 'feedback' + (kind ? ` ${kind}` : ''); }
  function selectedIds() { return [...$('train-samples').querySelectorAll('input:checked')].map(input => input.value); }
  function renderProgress() {
    const record = SubjectProgress.read('ai', 'middle');
    const saved = record !== null && record[slug] === true;
    $('retry-save').hidden = !(eligible && saveAttempted && !saved);
    $('progress-status').textContent = saved
      ? (eligible ? '本机已记录本主题操作完成。' : '本机此前已记录完成；本轮需重新训练和对照。')
      : eligible && saveAttempted ? '本轮训练和对照已完成，但本机记录未保存；可重试保存。'
      : record === null ? '本机进度暂不可用，仍可训练和对照。' : '完成一次训练和留出对照后尝试记录本机操作完成。';
  }
  function saveCompletion() {
    if (!eligible) return;
    const record = SubjectProgress.read('ai', 'middle');
    if (!(record && record[slug] === true)) { saveAttempted = true; SubjectProgress.markComplete('ai','middle',slug); }
    renderProgress();
  }
  function warning() {
    return adapted ? '已查看这组测试后调整方案：它已参与后续选择，不能作为独立最终评估。' :
      testSeen ? '已查看这组固定测试；若据此调整方案，就不能再把它当作独立最终评估。' :
      '这是一组固定公开的演示数据，不可作为真实模型的独立最终评估。';
  }
  function clearTest() {
    $('test-results').hidden = true;
    $('test-rows').replaceChildren();
    $('test-summary').textContent = '';
    setFeedback('test-feedback', trained ? `可查看当前对照。${warning()}` : `训练完成后可查看。${warning()}`);
    $('test-button').disabled = !trained;
  }
  function changeTraining() {
    if (testSeen) adapted = true;
    trained = null;
    $('loss-grid').replaceChildren();
    $('training-summary').textContent = '训练样本已改变，请重新训练。';
    setFeedback('train-feedback','样本已改变，选择至少一张 A 和一张 B 后重新训练。');
    clearTest();
  }
  model.trainSamples.forEach(sample => {
    const card = document.createElement('div');
    card.className = 'sample';
    const label = document.createElement('label');
    const input = document.createElement('input'); input.type = 'checkbox'; input.value = sample.id; input.checked = true;
    const text = document.createElement('span'); text.textContent = `分值 ${sample.score} · 标签 ${sample.label}`;
    const meter = document.createElement('meter'); meter.min = 0; meter.max = 10; meter.value = sample.score;
    meter.setAttribute('aria-label', `分值 ${sample.score}，满刻度 10`);
    label.append(input,text); card.append(label,meter); $('train-samples').append(card);
  });
  // Replace the initial loading text without disturbing the newly created controls.
  for (const node of [...$('train-samples').childNodes]) if (node.nodeType === Node.TEXT_NODE) node.remove();
  $('train-samples').addEventListener('change', changeTraining);
  $('select-all').addEventListener('click', () => {
    const boxes = [...$('train-samples').querySelectorAll('input')];
    if (boxes.every(input => input.checked)) return;
    boxes.forEach(input => { input.checked = true; });
    changeTraining();
  });
  manual.addEventListener('input', () => {
    if (testSeen) adapted = true;
    $('manual-value').textContent = manual.value;
    $('manual-rule').textContent = `分值 ≥ ${manual.value} 判为 B，否则判为 A。`;
    clearTest();
  });
  $('train-button').addEventListener('click', () => {
    trained = model.train(selectedIds());
    $('loss-grid').replaceChildren();
    if (!trained) {
      $('training-summary').textContent = '没有训练结果。';
      setFeedback('train-feedback','请至少选择一张 A 和一张 B，再训练。','try');
      clearTest(); return;
    }
    const winnerText = trained.winners.join('、');
    $('training-summary').textContent = `所选 ${trained.count} 张训练卡片：最少错分 ${trained.minimum} 张；阈值 ${winnerText} 并列最少，按规则选最小阈值 ${trained.threshold}。训练枚举 12 个阈值，共作 ${12 * trained.count} 次训练样本判断；手写阈值不经过这一步搜索。`;
    trained.candidates.forEach(item => {
      const card = document.createElement('div');
      card.className = 'loss' + (item.errors === trained.minimum ? ' best' : '') + (item.threshold === trained.threshold ? ' chosen' : '');
      const text = document.createElement('span'); text.textContent = `阈值 ${item.threshold}：错 ${item.errors}/${trained.count}`;
      const meter = document.createElement('meter'); meter.min = 0; meter.max = trained.count; meter.value = item.errors;
      meter.setAttribute('aria-label', `阈值 ${item.threshold}，训练错分 ${item.errors} 张，共 ${trained.count} 张`);
      card.append(text,meter); $('loss-grid').append(card);
    });
    setFeedback('train-feedback',`训练完成：选择阈值 ${trained.threshold}。阈值只由已选训练卡片的分值和标签决定。`,'good');
    clearTest();
  });
  $('test-button').addEventListener('click', () => {
    if (!trained) return;
    const result = model.evaluate(Number(manual.value), trained.threshold);
    if (!result) return;
    const body = $('test-rows'); body.replaceChildren();
    result.rows.forEach(row => {
      const tr = document.createElement('tr');
      const cells = [String(row.score),row.label,`${row.manualPrediction}（${row.manualCorrect ? '对' : '错'}）`,`${row.learnedPrediction}（${row.learnedCorrect ? '对' : '错'}）`];
      cells.forEach((value,index) => { const td = document.createElement('td'); td.textContent = value; if(index >= 2) td.className = (index === 2 ? row.manualCorrect : row.learnedCorrect) ? 'correct' : 'wrong'; tr.append(td); });
      body.append(tr);
    });
    testSeen = true;
    $('test-results').hidden = false;
    $('test-summary').textContent = `手写阈值 ${manual.value} 正确 ${result.manualCorrect}/${result.total}；训练阈值 ${trained.threshold} 正确 ${result.learnedCorrect}/${result.total}。两者使用相同留出卡片。`;
    setFeedback('test-feedback',warning(),'good');
    eligible = true;
    saveCompletion();
  });
  $('retry-save').addEventListener('click', saveCompletion);
  manual.disabled = false;
  $('train-button').disabled = false;
  $('select-all').disabled = false;
  renderProgress();
})();
