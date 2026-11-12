(function () {
  'use strict';
  const Model = window.AdjacentSwapSortModel;
  const subject = 'computer', stage = 'primary', slug = 'adjacent-swap-sort';
  const get = id => document.getElementById(id);
  const preset = get('preset-select'), prediction = get('prediction-select');
  const stepButton = get('step-button'), playButton = get('play-button'), pauseButton = get('pause-button');
  const cards = get('card-list'), trace = get('trace-list'), passList = get('pass-list');
  const runStatus = get('run-status'), predictionStatus = get('prediction-status');
  const challengeProgress = get('challenge-progress'), progressStatus = get('progress-status');
  const retrySave = get('retry-save');
  const previous = window.SubjectProgress.read(subject, stage);
  let historicalCompletion = previous !== null && previous[slug] === true;
  let state = Model.createState(Model.PRESETS.mixed);
  let unsortedCorrect = false, sortedCorrect = false, roundCounted = false;
  let earned = false, pendingSave = false, saveNotice = '', timer = null;

  function renderControls() {
    stepButton.disabled = state.done;
    playButton.disabled = state.done || timer !== null;
    pauseButton.disabled = timer === null;
    prediction.disabled = state.comparisons > 0;
  }
  function stop() {
    if (timer !== null) { clearTimeout(timer); timer = null; }
    renderControls();
  }
  function isInitiallySorted() {
    return state.initial.every((value, index) => index === 0 || state.initial[index - 1] < value);
  }

  function renderCards() {
    cards.replaceChildren();
    const fixedCount = state.done ? 5 : state.settledCount;
    state.values.forEach((value, index) => {
      const li = document.createElement('li');
      const settled = index >= 5 - fixedCount;
      const active = !state.done && (index === state.pairIndex || index === state.pairIndex + 1);
      const recent = state.last && (index === state.last.pairIndex || index === state.last.pairIndex + 1);
      const status = settled ? 'settled' : active ? 'active' : recent ? 'recent' : 'waiting';
      li.className = 'sort-card'; li.dataset.index = String(index + 1); li.dataset.state = status;
      if (active) li.setAttribute('aria-current', 'step');
      const ordinal = document.createElement('span'), number = document.createElement('strong'), result = document.createElement('span');
      ordinal.className = 'ordinal'; ordinal.textContent = `第 ${index + 1} 张`;
      number.textContent = String(value);
      result.className = 'card-result'; result.textContent = {settled: '已就位', active: '待比较', recent: '刚比较', waiting: '待查看'}[status];
      li.append(ordinal, number, result); cards.append(li);
    });
    cards.setAttribute('aria-label', `当前五张卡片：${state.values.join('、')}。已就位 ${fixedCount} 张。${state.done ? '排序完成。' : `下一对是第 ${state.pairIndex + 1}、${state.pairIndex + 2} 张。`}`);
  }

  function renderTrace() {
    trace.replaceChildren();
    if (!state.history.length) { const li = document.createElement('li'); li.textContent = '还没有比较任何卡片。'; trace.append(li); }
    state.history.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `第 ${item.pass} 轮，第 ${item.pairIndex + 1} 对：${item.left} ${item.swapped ? '>' : '<'} ${item.right}，${item.swapped ? '交换' : '保持'}；现在 ${item.after.join('、')}。`;
      trace.append(li);
    });
    passList.replaceChildren();
    if (!state.completedPasses.length) {
      const li = document.createElement('li'); li.textContent = '尚未完成一轮。'; passList.append(li);
    }
    state.completedPasses.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `第 ${item.pass} 轮：比较 ${item.comparisons} 对、交换 ${item.swaps} 次；${item.swaps ? `右侧的 ${item.fixedValue} 已就位。` : '整轮无交换，全部已排序，提前结束。'}`;
      passList.append(li);
    });
  }

  function renderProgress() {
    challengeProgress.textContent = `原本无序：${unsortedCorrect ? '已正确完成' : '待完成'} · 原本有序：${sortedCorrect ? '已正确完成' : '待完成'}`;
    retrySave.hidden = !pendingSave;
    if (pendingSave) {
      progressStatus.textContent = `${historicalCompletion ? '本机先前已有完成记录；' : ''}两类练习已完成，但本次完成记录未能保存。${state.done ? '' : '当前轮尚未完成；'}恢复存储后可重试保存此前赢得的资格，异常记录原文会保留。`;
    } else if (saveNotice) {
      progressStatus.textContent = saveNotice;
    } else if (historicalCompletion) {
      progressStatus.textContent = '本机已有这个主题的完成记录；当前一轮仍需单独执行。重置与更换卡片会保留历史记录。';
    } else if (previous === null) {
      progressStatus.textContent = '本机进度暂不可用，仍可探索。完成后将尝试保存；如失败可重试，异常记录不会自动覆盖。';
    } else {
      progressStatus.textContent = '当前浏览器尚无这个主题的完成记录。两类输入都正确预测并排到终点后才尝试保存。';
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
      saveNotice = state.done ? '两类排序已完成，已保存本机学习进度。' : '已保存此前赢得的完成资格；当前轮尚未完成。';
    } else saveNotice = '';
    renderProgress();
  }

  function render() {
    renderCards(); renderTrace(); renderControls(); renderProgress();
    get('pass-label').textContent = state.done ? `已完成 ${state.completedPasses.length} 轮` : `第 ${state.pass} 轮`;
    get('comparison-count').textContent = String(state.comparisons);
    get('swap-count').textContent = String(state.swaps);
    get('settled-count').textContent = String(state.done ? 5 : state.settledCount);
    get('next-label').textContent = state.done ? `结论：${state.values.join('、')}` : `下一对：第 ${state.pairIndex + 1}、${state.pairIndex + 2} 张`;
    if (!state.last) runStatus.textContent = '尚未开始；先预测第一轮交换次数。';
    else if (state.done && state.last.earlyStop) runStatus.textContent = `第 ${state.last.pass} 轮没有交换，五张已经有序，提前结束。`;
    else if (state.done) runStatus.textContent = `四轮完成，卡片已按从小到大排好。`;
    else if (state.last.passEnded) runStatus.textContent = `第 ${state.last.pass} 轮结束；右侧已有 ${state.settledCount} 张就位。继续第 ${state.pass} 轮。`;
    else runStatus.textContent = `刚比较 ${state.last.left} 与 ${state.last.right}，${state.last.swapped ? '已交换' : '保持原位'}；继续比较下一对。`;
    runStatus.classList.toggle('success', state.done);
    const first = state.completedPasses[0];
    if (first) {
      const chosen = Number(prediction.value), correct = chosen === first.swaps;
      predictionStatus.textContent = `你预测第一轮交换 ${chosen} 次，实际交换 ${first.swaps} 次：${correct ? '预测正确！' : '这次未猜对，可重新排序。'}`;
      predictionStatus.className = correct ? 'status success' : 'status error';
    } else {
      predictionStatus.textContent = state.comparisons ? '第一轮尚未结束；结束后揭晓预测结果。' : '第一轮结束后再揭晓预测结果。';
      predictionStatus.className = 'status';
    }
  }

  function advance() {
    if (state.done) return;
    if (prediction.value === '') {
      runStatus.textContent = '请先预测第一轮交换次数，再开始排序。';
      prediction.focus(); stop(); return;
    }
    state = Model.step(state);
    if (state.done) {
      stop();
      if (!roundCounted) {
        roundCounted = true;
        if (Number(prediction.value) === state.completedPasses[0].swaps) {
          if (isInitiallySorted()) sortedCorrect = true;
          else unsortedCorrect = true;
        }
        if (unsortedCorrect && sortedCorrect && !earned) { earned = true; saveCompletion(); }
      }
    }
    render();
  }

  function schedule() {
    timer = setTimeout(() => {
      timer = null; advance();
      if (!state.done && prediction.value !== '' && document.visibilityState === 'visible') schedule();
      else renderControls();
    }, 560);
    renderControls();
  }
  function restart(example = false) {
    stop();
    if (example) preset.value = 'mixed';
    prediction.value = '';
    state = Model.createState(Model.PRESETS[preset.value]);
    roundCounted = false; saveNotice = '';
    render();
  }

  stepButton.addEventListener('click', advance);
  playButton.addEventListener('click', () => {
    if (prediction.value === '') { advance(); return; }
    if (!state.done && timer === null) { advance(); if (!state.done) schedule(); }
  });
  pauseButton.addEventListener('click', stop);
  get('reset-button').addEventListener('click', () => restart());
  get('example-button').addEventListener('click', () => restart(true));
  preset.addEventListener('change', () => restart());
  retrySave.addEventListener('click', saveCompletion);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible') stop(); });
  window.addEventListener('pagehide', stop);
  render();
})();
