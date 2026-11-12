(function () {
  'use strict';
  const Model = window.SearchStrategiesModel;
  const subject = 'computer', stage = 'high', slug = 'search-strategies';
  const get = id => document.getElementById(id);
  const sizeSelect = get('size-select'), orderSelect = get('order-select');
  const targetSelect = get('target-select'), predictionSelect = get('prediction-select');
  const stepButton = get('step-button'), playButton = get('play-button'), pauseButton = get('pause-button');
  const runStatus = get('run-status'), predictionStatus = get('prediction-status');
  const prerequisitePanel = get('prerequisite-panel'), prerequisiteSelect = get('prerequisite-select');
  const prerequisiteStatus = get('prerequisite-status'), progressStatus = get('progress-status');
  const previous = window.SubjectProgress.read(subject, stage);
  let historicalCompletion = previous !== null && previous[slug] === true;
  let state = Model.createState();
  const achieved = {front15: false, near15: false, missing7: false, missing15: false, prerequisite: false};
  const observedMissing = {};
  let roundCounted = false, earned = false, pendingSave = false, saveNotice = '';
  let prerequisiteFeedback = '选择后核对，可更正答案。', prerequisiteCorrect = false;
  let timer = null;

  function updateTargetLabels() {
    const size = Number(sizeSelect.value);
    targetSelect.querySelector('[value="near"]').textContent = `靠后：${size - 1}`;
    targetSelect.querySelector('[value="missing"]').textContent = `未出现：${size + 1}`;
  }
  function stop() {
    if (timer !== null) { clearTimeout(timer); timer = null; }
    renderControls();
  }
  function renderControls() {
    stepButton.disabled = state.done;
    playButton.disabled = state.done || timer !== null;
    pauseButton.disabled = timer === null;
    predictionSelect.disabled = state.order === 'shuffled' || state.ticks > 0;
  }
  function cardState(side, index) {
    if (side === 'linear') {
      if (state.linear.foundIndex === index) return 'found';
      if (index < state.linear.next) return 'checked';
      if (!state.linear.done && index === state.linear.next) return 'next';
      return 'waiting';
    }
    if (!state.binary.available) return 'blocked';
    if (state.binary.foundIndex === index) return 'found';
    if (index < state.binary.low || index > state.binary.high) return 'excluded';
    if (!state.binary.done && index === Math.floor((state.binary.low + state.binary.high) / 2)) return 'next';
    return 'candidate';
  }
  function renderCards(side) {
    const list = get(`${side}-cards`), model = state[side];
    list.replaceChildren();
    state.values.forEach((value, index) => {
      const li = document.createElement('li'), position = document.createElement('span');
      const number = document.createElement('strong'), label = document.createElement('em');
      const status = cardState(side, index);
      li.className = 'data-card'; li.dataset.index = String(index + 1); li.dataset.state = status;
      li.dataset.last = String(model.last !== null && model.last.index === index);
      if (status === 'next') li.setAttribute('aria-current', 'step');
      position.textContent = `第 ${index + 1} 项`;
      number.textContent = String(value);
      label.textContent = {found: '已找到', checked: '已查', next: '下一项', waiting: '待查',
        excluded: '已排除', candidate: '候选', blocked: '不可二分'}[status];
      li.append(position, number, label); list.append(li);
    });
    list.setAttribute('aria-label', `${side === 'linear' ? '顺序' : '二分'}查找，数据 ${state.values.join('、')}。${model.comparisons} 次比较。${side === 'binary' && !model.available ? '数据乱序，不能直接二分。' : ''}`);
  }
  function renderTrace(side) {
    const list = get(`${side}-trace`), model = state[side];
    list.replaceChildren();
    if (side === 'binary' && !model.available) {
      const li = document.createElement('li'); li.textContent = '数据未排序，不能直接使用二分查找；本轮没有二分比较或结果。'; list.append(li); return;
    }
    if (!model.history.length) {
      const li = document.createElement('li'); li.textContent = '还没有比较。'; list.append(li); return;
    }
    model.history.forEach((item, index) => {
      const li = document.createElement('li');
      if (side === 'linear') {
        li.textContent = `第 ${index + 1} 次：检查第 ${item.index + 1} 项 ${item.value}，${item.matched ? '找到目标。' : item.index === state.size - 1 ? '已到末尾，未找到。' : '不匹配，继续向右。'}`;
      } else {
        let result;
        if (item.relation === 'equal') result = `找到目标，位置为第 ${item.index + 1} 项。`;
        else {
          const [from, to] = item.discarded;
          const remaining = item.afterLow > item.afterHigh ? '候选区间已空，未找到。' :
            `剩余第 ${item.afterLow + 1}–${item.afterHigh + 1} 项。`;
          result = `${state.target} ${item.relation === 'left' ? '<' : '>'} ${item.value}，排除第 ${from + 1}–${to + 1} 项；${remaining}`;
        }
        li.textContent = `第 ${index + 1} 次：候选第 ${item.beforeLow + 1}–${item.beforeHigh + 1} 项，检查中间第 ${item.index + 1} 项 ${item.value}；${result}`;
      }
      list.append(li);
    });
  }
  function resultText(side) {
    const model = state[side];
    if (side === 'binary' && !model.available) return '数据未排序，不能直接使用';
    if (model.done) return model.foundIndex === null ? '候选已空，未找到' : `第 ${model.foundIndex + 1} 项找到`;
    if (side === 'linear') return `下一项：第 ${model.next + 1} 项`;
    return `候选：第 ${model.low + 1}–${model.high + 1} 项；下一中点第 ${Math.floor((model.low + model.high) / 2) + 1} 项`;
  }
  function renderStrategies() {
    for (const side of ['linear', 'binary']) {
      renderCards(side); renderTrace(side);
      const model = state[side];
      get(`${side}-count`).textContent = side === 'binary' && !model.available ? '—' : String(model.comparisons);
      get(`${side}-next`).textContent = resultText(side);
      get(`${side}-meter`).firstElementChild.style.width = `${100 * model.comparisons / state.size}%`;
    }
  }
  function challengeKey() {
    const key = `${state.scenario}${state.size}`;
    return Object.hasOwn(achieved, key) ? key : null;
  }
  function renderChallenge() {
    const labels = {
      front15: '15 项：首位目标，顺序查找更少',
      near15: '15 项：靠后目标，二分查找更少',
      missing7: '7 项：未出现目标，观察两侧次数',
      missing15: '15 项：未出现目标，观察规模变化',
      prerequisite: '乱序：正确解释不能直接二分'
    };
    const list = get('challenge-list'); list.replaceChildren();
    Object.entries(labels).forEach(([key, label]) => {
      const li = document.createElement('li'); li.textContent = `${achieved[key] ? '✓ 已完成' : '○ 待完成'} · ${label}`; list.append(li);
    });
    get('retry-save').hidden = !pendingSave;
    if (pendingSave) {
      progressStatus.textContent = `${historicalCompletion ? '本机先前已有完成记录；' : ''}五项挑战已完成，但本次记录未能保存。${state.done ? '' : '当前轮尚未完成；'}恢复存储后可重试保存此前赢得的资格，损坏记录原文会保留。`;
    } else if (saveNotice) progressStatus.textContent = saveNotice;
    else if (historicalCompletion) progressStatus.textContent = '本机已有这个主题的完成记录；当前一轮仍需单独执行。更换参数会保留历史完成。';
    else if (previous === null) progressStatus.textContent = '本机进度暂不可用，仍可探索。完成后会尝试保存；如失败可重试，损坏记录不会自动覆盖。';
    else progressStatus.textContent = '当前浏览器尚无这个主题的完成记录。四组正确预测和乱序前提判断全部完成后才尝试保存。';
  }
  function saveCompletion() {
    if (!earned) return;
    let saved = false;
    try { saved = window.SubjectProgress.markComplete(subject, stage, slug) === true; }
    catch (_) { saved = false; }
    pendingSave = !saved;
    if (saved) {
      historicalCompletion = true;
      saveNotice = state.done ? '五项挑战已完成，已保存本机学习进度。' : '已保存此前赢得的完成资格；当前轮尚未完成。';
    } else saveNotice = '';
    renderChallenge();
  }
  function maybeEarn() {
    if (!earned && Object.values(achieved).every(Boolean)) { earned = true; saveCompletion(); }
  }
  function render() {
    renderControls(); renderStrategies(); renderChallenge();
    const shuffled = state.order === 'shuffled';
    prerequisitePanel.hidden = !shuffled;
    get('setting-note').textContent = shuffled ? '乱序时仅运行顺序查找；二分查找不会给出虚假的次数或结果。可在下方核对原因。' :
      '两侧只统计与数据项的比较，不计排序准备和设备运行时间。预测在两侧结束后揭晓。';
    if (state.ticks === 0) runStatus.textContent = shuffled ? '乱序数据：可以逐项查找；二分查找需要先满足有序前提。' : '先预测，再逐步比较。';
    else if (state.done && shuffled) runStatus.textContent = `顺序查找已完成：${state.linear.comparisons} 次比较；乱序数据不能直接二分。`;
    else if (state.done) runStatus.textContent = `两侧已结束：顺序 ${state.linear.comparisons} 次，二分 ${state.binary.comparisons} 次。目标${state.linear.foundIndex === null ? '未出现' : `在第 ${state.linear.foundIndex + 1} 项找到`}。`;
    else runStatus.textContent = `已共同推进 ${state.ticks} 步；${state.linear.done ? '顺序已结束' : '顺序继续'}，${state.binary.available ? state.binary.done ? '二分已结束' : '二分继续' : '二分不可用'}。`;
    runStatus.className = `status-box${state.done ? ' success' : ''}`;
    if (shuffled) predictionStatus.textContent = '乱序数据不执行二分比较；请在下方解释前提。';
    else if (!state.done) predictionStatus.textContent = state.ticks ? '两侧尚未都结束，预测暂不揭晓。' : '两侧查找完成后揭晓预测。';
    else {
      const actual = Model.winner(state), chosen = predictionSelect.value;
      const names = {linear: '顺序查找', binary: '二分查找', tie: '一样多'};
      predictionStatus.textContent = `你预测 ${names[chosen]} 比较较少；实际为 ${names[actual]}（顺序 ${state.linear.comparisons} 次、二分 ${state.binary.comparisons} 次）：${chosen === actual ? '预测正确！' : '这次未猜对，可换条件再试。'}`;
    }
    predictionStatus.className = `status-box${!shuffled && state.done ? predictionSelect.value === Model.winner(state) ? ' success' : ' error' : ''}`;
    prerequisiteStatus.textContent = prerequisiteFeedback;
    prerequisiteStatus.className = `status-box${prerequisiteCorrect ? ' success' : ''}`;
    get('scale-summary').textContent = observedMissing[7] && observedMissing[15] ?
      `未出现目标：7 项时顺序 ${observedMissing[7].linear} 次、二分 ${observedMissing[7].binary} 次；15 项时顺序 ${observedMissing[15].linear} 次、二分 ${observedMissing[15].binary} 次。这里统计比较次数，不是运行时长；若需先排序，还要另计准备成本。` :
      '完成 7 项和 15 项的“未出现”实验后，可对照两种规模的实际次数。';
  }
  function advance() {
    if (state.done) return;
    if (state.order === 'sorted' && predictionSelect.value === '') {
      runStatus.textContent = '请先预测哪种方法比较次数较少，再开始查找。';
      predictionSelect.focus(); stop(); return;
    }
    state = Model.step(state);
    if (state.done) {
      stop();
      if (!roundCounted) {
        roundCounted = true;
        if (state.order === 'sorted') {
          if (state.scenario === 'missing') observedMissing[state.size] = {linear: state.linear.comparisons, binary: state.binary.comparisons};
          const key = challengeKey();
          if (key && predictionSelect.value === Model.winner(state)) achieved[key] = true;
          maybeEarn();
        }
      }
    }
    render();
  }
  function schedule() {
    timer = setTimeout(() => {
      timer = null; advance();
      if (!state.done && (state.order === 'shuffled' || predictionSelect.value !== '') && document.visibilityState === 'visible') schedule();
      else renderControls();
    }, 480);
    renderControls();
  }
  function restart(example = false) {
    stop();
    if (example) { sizeSelect.value = '15'; orderSelect.value = 'sorted'; targetSelect.value = 'near'; }
    updateTargetLabels();
    predictionSelect.value = ''; prerequisiteSelect.value = '';
    prerequisiteFeedback = achieved.prerequisite ? '此前已正确解释乱序前提；本轮仍可重新核对。' : '选择后核对，可更正答案。';
    prerequisiteCorrect = achieved.prerequisite;
    state = Model.createState({size: Number(sizeSelect.value), order: orderSelect.value, scenario: targetSelect.value});
    roundCounted = false; saveNotice = '';
    render();
  }
  stepButton.addEventListener('click', advance);
  playButton.addEventListener('click', () => {
    if (state.order === 'sorted' && predictionSelect.value === '') { advance(); return; }
    if (!state.done && timer === null) { advance(); if (!state.done) schedule(); }
  });
  pauseButton.addEventListener('click', stop);
  get('reset-button').addEventListener('click', () => restart());
  get('example-button').addEventListener('click', () => restart(true));
  for (const select of [sizeSelect, orderSelect, targetSelect]) select.addEventListener('change', () => restart());
  get('check-prerequisite').addEventListener('click', () => {
    if (state.order !== 'shuffled') return;
    if (!prerequisiteSelect.value) prerequisiteFeedback = '请先选择一个原因。';
    else if (prerequisiteSelect.value === 'sorted') {
      achieved.prerequisite = true; prerequisiteCorrect = true;
      prerequisiteFeedback = '判断正确：乱序时无法根据中间值可靠地排除左半或右半。若为一次查找先排序，还要计算准备成本。';
      maybeEarn();
    } else { prerequisiteCorrect = false; prerequisiteFeedback = '还不对：看中间项后，能否根据大小可靠地排除另一半？可更正答案。'; }
    render();
  });
  get('retry-save').addEventListener('click', saveCompletion);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible') stop(); });
  window.addEventListener('pagehide', stop);
  render();
})();
