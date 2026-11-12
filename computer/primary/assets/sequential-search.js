(function () {
  'use strict';
  const Model = window.SequentialSearchModel;
  const subject = 'computer', stage = 'primary', slug = 'sequential-search';
  const get = id => document.getElementById(id);
  const preset = get('preset-select'), target = get('target-select'), prediction = get('prediction-select');
  const stepButton = get('step-button'), playButton = get('play-button'), pauseButton = get('pause-button');
  const cards = get('card-list'), trace = get('trace-list'), runStatus = get('run-status');
  const predictionStatus = get('prediction-status'), challengeProgress = get('challenge-progress');
  const progressStatus = get('progress-status'), retrySave = get('retry-save');
  const previous = window.SubjectProgress.read(subject, stage);
  let historicalCompletion = previous !== null && previous[slug] === true;
  let state = Model.createState(Model.PRESETS.standard, 7);
  let foundCorrect = false, absentCorrect = false, earned = false, pendingSave = false;
  let saveNotice = '', timer = null;

  function stop() {
    if (timer !== null) { clearTimeout(timer); timer = null; }
    renderControls();
  }

  function renderControls() {
    stepButton.disabled = state.done;
    playButton.disabled = state.done || timer !== null;
    pauseButton.disabled = timer === null;
    prediction.disabled = state.comparisons > 0;
  }

  function renderCards() {
    cards.replaceChildren();
    state.values.forEach((value, index) => {
      const li = document.createElement('li');
      const history = state.history[index];
      const status = history ? (history.match ? 'found' : 'miss') : index === state.nextIndex && !state.done ? 'next' : 'waiting';
      li.className = 'search-card'; li.dataset.index = String(index + 1); li.dataset.state = status;
      if (status === 'next') li.setAttribute('aria-current', 'step');
      const ordinal = document.createElement('span'), number = document.createElement('strong'), result = document.createElement('span');
      ordinal.className = 'ordinal'; ordinal.textContent = `第 ${index + 1} 张`;
      number.textContent = String(value);
      result.className = 'card-result';
      result.textContent = {next: '下一张', miss: '不相同', found: '找到了', waiting: '待查看'}[status];
      li.append(ordinal, number, result);
      cards.append(li);
    });
    cards.setAttribute('aria-label', `按查找顺序排列的五张数字卡片：${state.values.join('、')}。已比较 ${state.comparisons} 张。${state.done ? (state.foundIndex === null ? '未找到目标。' : `第 ${state.foundIndex + 1} 张找到目标。`) : `下一张是第 ${state.nextIndex + 1} 张。`}`);
  }

  function renderTrace() {
    trace.replaceChildren();
    if (!state.history.length) {
      const li = document.createElement('li'); li.textContent = '还没有比较任何卡片。'; trace.append(li);
    }
    state.history.forEach(({index, value, match}) => {
      const li = document.createElement('li');
      li.textContent = `第 ${index + 1} 次：第 ${index + 1} 张是 ${value}，${value} ${match ? '=' : '≠'} ${state.target}；${match ? '找到，停止。' : (state.done && index === 4 ? '五张都不相同，未找到。' : '继续看下一张。')}`;
      trace.append(li);
    });
  }

  function renderProgress() {
    challengeProgress.textContent = `找到：${foundCorrect ? '已正确预测' : '待完成'} · 未找到：${absentCorrect ? '已正确预测' : '待完成'}`;
    retrySave.hidden = !pendingSave;
    if (pendingSave) {
      progressStatus.textContent = `两类预测已完成，但完成记录未能保存。${state.done ? '' : '当前轮尚未完成；'}恢复存储后可重试保存此前赢得的资格，异常记录原文会保留。`;
    } else if (saveNotice) {
      progressStatus.textContent = saveNotice;
    } else if (historicalCompletion) {
      progressStatus.textContent = '本机已有这个主题的完成记录；当前一轮仍需单独执行。重置与更换参数会保留历史记录。';
    } else if (previous === null) {
      progressStatus.textContent = '本机进度暂不可用，仍可探索。完成后将尝试保存；如失败可重试，异常记录不会自动覆盖。';
    } else {
      progressStatus.textContent = '当前浏览器尚无这个主题的完成记录。分别正确预测找到与未找到两轮后才尝试保存。';
    }
  }

  function saveCompletion() {
    if (!earned) return;
    let saved = false;
    try { saved = window.SubjectProgress.markComplete(subject, stage, slug) === true; }
    catch (_) { saved = false; }
    pendingSave = !saved;
    if (saved) {
      historicalCompletion = true;
      saveNotice = state.done ? '两类预测已完成，已保存本机学习进度。' : '已保存此前赢得的完成资格；当前轮尚未完成。';
    } else saveNotice = '';
    renderProgress();
  }

  function render() {
    renderCards(); renderTrace(); renderControls(); renderProgress();
    get('comparison-count').textContent = String(state.comparisons);
    get('next-label').textContent = state.done
      ? (state.foundIndex === null ? '结论：未找到' : `结论：第 ${state.foundIndex + 1} 张找到`)
      : `下一张：第 ${state.nextIndex + 1} 张`;
    if (!state.history.length) runStatus.textContent = '尚未开始；先预测比较次数。';
    else if (!state.done) runStatus.textContent = `已比较 ${state.comparisons} 张，继续查看第 ${state.nextIndex + 1} 张。`;
    else if (state.foundIndex === null) runStatus.textContent = '五张卡片都已比较，目标不在这组卡片中。';
    else runStatus.textContent = `第 ${state.foundIndex + 1} 张找到目标，查找立即停止。`;
    runStatus.classList.toggle('success', state.done && state.foundIndex !== null);
    if (!state.done) {
      predictionStatus.textContent = state.comparisons ? '比较中；结束后揭晓预测是否正确。' : '执行结束后再揭晓预测结果。';
      predictionStatus.className = 'status';
    }
  }

  function finishRound() {
    const expected = state.comparisons, chosen = Number(prediction.value), correct = chosen === expected;
    predictionStatus.textContent = `你预测 ${chosen} 次，实际比较 ${expected} 次：${correct ? '预测正确！' : '这次未猜对，可重新查找。'}${state.foundIndex === null ? '五张均不匹配。' : `在第 ${state.foundIndex + 1} 张找到。`}`;
    predictionStatus.className = correct ? 'status success' : 'status error';
    if (correct) {
      if (state.foundIndex === null) absentCorrect = true;
      else foundCorrect = true;
    }
    if (foundCorrect && absentCorrect && !earned) { earned = true; saveCompletion(); }
    renderProgress();
  }

  function advance() {
    if (state.done) return;
    if (!prediction.value) {
      runStatus.textContent = '请先预测需要比较几次，再开始查找。';
      prediction.focus(); stop(); return;
    }
    state = Model.step(state);
    if (state.done) stop();
    render();
    if (state.done) finishRound();
  }

  function schedule() {
    timer = setTimeout(() => {
      timer = null;
      advance();
      if (!state.done && prediction.value && document.visibilityState === 'visible') schedule();
      else renderControls();
    }, 650);
    renderControls();
  }

  function restart(resetExample = false) {
    stop();
    if (resetExample) { preset.value = 'standard'; target.value = '7'; }
    prediction.value = '';
    state = Model.createState(Model.PRESETS[preset.value], Number(target.value));
    saveNotice = '';
    predictionStatus.textContent = '执行结束后再揭晓预测结果。';
    predictionStatus.className = 'status';
    render();
  }

  stepButton.addEventListener('click', advance);
  playButton.addEventListener('click', () => {
    if (!prediction.value) { advance(); return; }
    if (timer === null && !state.done) schedule();
  });
  pauseButton.addEventListener('click', stop);
  get('reset-button').addEventListener('click', () => restart());
  get('example-button').addEventListener('click', () => restart(true));
  preset.addEventListener('change', () => restart());
  target.addEventListener('change', () => restart());
  retrySave.addEventListener('click', saveCompletion);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible') stop(); });
  window.addEventListener('pagehide', stop);
  render();
})();
