(function () {
  'use strict';
  const Model = window.AssemblyLineModel;
  const keys = ['cut', 'assembly', 'quality'];
  const controls = keys.map(key => document.getElementById(`${key}-time`));
  const scene = document.getElementById('assembly-scene');
  const status = document.getElementById('simulation-status');
  const stepButton = document.getElementById('step-button');
  const runButton = document.getElementById('run-button');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let state = Model.createState([2, 5, 2]);
  let timer = null, timerToken = 0, peakQueue = 0, runRecorded = false;
  let previousCompleted = null, lastCompleted = null;

  function put(id, value) {
    const element = document.getElementById(id), text = String(value);
    if (element.textContent !== text) element.textContent = text;
  }
  function readTimes() { return controls.map(control => Number(control.value)); }
  function stopTimer() {
    timerToken++;
    if (timer !== null) window.clearInterval(timer);
    timer = null;
  }
  function setStatus(message) {
    status.textContent = message;
    status.dataset.mode = state.done ? 'complete' : timer !== null ? 'running' : 'paused';
  }
  function makePart(id, tag = 'li', completionTime = null) {
    const part = document.createElement(tag);
    part.className = 'part'; part.dataset.itemId = String(id);
    part.textContent = `#${String(id).padStart(2, '0')}`;
    part.setAttribute('aria-label', `零件 ${id}${completionTime === null ? '' : `，第 ${completionTime} 模拟秒完成`}`);
    if (completionTime !== null) { part.title = `零件 ${id}：第 ${completionTime} 模拟秒完成`; part.dataset.completedAt = String(completionTime); }
    return part;
  }
  function renderParts(id, parts, emptyText, completionTimes = null) {
    const container = document.getElementById(id);
    if (parts.length) container.replaceChildren(...parts.map((part, index) => makePart(part, 'li', completionTimes ? completionTimes[index] : null)));
    else {
      const empty = document.createElement('li'); empty.className = 'queue-empty'; empty.textContent = emptyText;
      container.replaceChildren(empty);
    }
  }
  function conditions(times) { return `${times.join(' / ')} 秒/件（切割 / 装配 / 质检）`; }

  function renderComparison() {
    put('previous-completed-time', previousCompleted ? previousCompleted.duration : '—');
    put('last-completed-time', lastCompleted ? lastCompleted.duration : '—');
    put('previous-completed-times', previousCompleted ? conditions(previousCompleted.times) : '尚无完整记录');
    put('last-completed-times', lastCompleted ? conditions(lastCompleted.times) : '尚无完整记录');
    if (!lastCompleted) put('comparison-result', '先完成瓶颈示例，再试均衡示例，观察整批交付时间的变化。');
    else if (!previousCompleted) put('comparison-result', `已保留最近完整批次：${lastCompleted.duration} 模拟秒。完成另一组条件后再比较；未完成的运行不会覆盖此记录。`);
    else {
      const saved = previousCompleted.duration - lastCompleted.duration;
      put('comparison-result', saved > 0
        ? `与前一次完整批次相比，节省 ${saved} 模拟秒：${previousCompleted.duration} → ${lastCompleted.duration} 秒。两次都完成了 8 件。`
        : saved < 0
          ? `与前一次完整批次相比，增加 ${-saved} 模拟秒：${previousCompleted.duration} → ${lastCompleted.duration} 秒。两次都完成了 8 件。`
          : `两次完整批次的总时间相同，均为 ${lastCompleted.duration} 模拟秒；两次都完成了 8 件。`);
    }
  }

  function render() {
    const metrics = Model.getMetrics(state);
    scene.dataset.time = String(state.time);
    scene.dataset.running = String(timer !== null);
    scene.dataset.completed = String(metrics.completedCount);
    scene.dataset.pending = String(metrics.pendingCount);
    scene.dataset.wip = String(metrics.wipCount);
    put('elapsed-time', state.time); put('completed-count', `${metrics.completedCount}/8`);
    put('pending-count', metrics.pendingCount); put('wip-count', metrics.wipCount);
    put('queued-count', metrics.queuedCount); put('peak-queue', peakQueue);
    put('assembly-queue-count', state.queues[0].length); put('quality-queue-count', state.queues[1].length);
    put('bottleneck-names', metrics.bottleneckIndexes.map(index => Model.STATION_NAMES[index]).join('、'));
    put('theoretical-rate', metrics.theoreticalRate.toFixed(1));
    put('first-completion', metrics.firstCompletion ?? '—');
    put('batch-duration', metrics.batchDuration ?? '—');
    put('batch-rate', metrics.batchAverageRate === null ? '—' : metrics.batchAverageRate.toFixed(1));
    renderParts('input-queue', state.pending, '全部原料已投料');
    renderParts('assembly-queue', state.queues[0], '当前无等待');
    renderParts('quality-queue', state.queues[1], '当前无等待');
    renderParts('finished-items', state.completed, '等待首件完成质检', state.completionTimes);
    keys.forEach((key, index) => {
      const station = state.stations[index];
      const card = document.getElementById(`station-${key}`);
      card.dataset.busy = String(station !== null);
      card.dataset.itemId = station ? String(station.id) : '';
      card.dataset.remaining = station ? String(station.remaining) : '0';
      card.dataset.bottleneck = String(metrics.bottleneckIndexes.includes(index));
      card.querySelector('.limit-badge').hidden = !metrics.bottleneckIndexes.includes(index);
      const holder = document.getElementById(`${key}-workpiece`);
      if (station) holder.replaceChildren(makePart(station.id, 'span'));
      else { const idle = document.createElement('span'); idle.className = 'idle-label'; idle.textContent = state.done ? '批次已完成' : '等待来料'; holder.replaceChildren(idle); }
      put(`${key}-state`, station ? `加工零件 #${station.id}` : state.done ? '批次已完成' : '等待来料');
      put(`${key}-remaining`, station ? station.remaining : 0);
      const progress = document.getElementById(`${key}-progress`);
      progress.max = state.times[index]; progress.value = station ? state.times[index] - station.remaining : 0;
      progress.setAttribute('aria-valuetext', station ? `零件 ${station.id} 已加工 ${state.times[index] - station.remaining} / ${state.times[index]} 秒，剩余 ${station.remaining} 秒` : '当前没有加工零件');
    });
    stepButton.disabled = timer !== null || state.done;
    runButton.disabled = state.done;
    runButton.textContent = timer !== null ? '暂停运行' : '开始运行';
    runButton.setAttribute('aria-pressed', String(timer !== null));
    renderComparison();
  }

  function recordCompletion() {
    if (!state.done || runRecorded) return;
    const metrics = Model.getMetrics(state);
    previousCompleted = lastCompleted;
    lastCompleted = Object.freeze({times: Object.freeze([...state.times]), duration: state.time, first: metrics.firstCompletion, averageRate: metrics.batchAverageRate});
    runRecorded = true;
  }

  function advance() {
    if (state.done) return;
    state = Model.tick(state);
    peakQueue = Math.max(peakQueue, Model.getMetrics(state).queuedCount);
    if (state.done) {
      stopTimer(); recordCompletion(); render();
      setStatus(`本批次 8 件全部完成，用时 ${state.time} 模拟秒；首件在第 ${state.completionTimes[0]} 秒完成。已自动停止，完整结果已保留供比较。`);
    } else {
      render();
      const finished = state.events.filter(event => event.type === 'finish');
      const activity = finished.length ? finished.map(event => `#${event.id} 完成${Model.STATION_NAMES[event.station]}`).join('；') : '各加工位已同时推进 1 秒';
      setStatus(`${timer !== null ? '运行中' : '已暂停'} · t=${state.time}：${activity}。当前完成 ${state.completed.length}/8 件。`);
    }
  }

  function pause(reason) {
    const wasRunning = timer !== null;
    stopTimer(); render();
    if (wasRunning && !state.done) setStatus(`${reason}，已暂停在第 ${state.time} 模拟秒。当前零件和队列保留，可以继续或单步观察。`);
  }

  function reset(reason) {
    stopTimer();
    state = Model.createState(readTimes()); peakQueue = 0; runRecorded = false;
    render();
    setStatus(`${reason}，已暂停并回到 t=0。零件 #1 已进入切割，其余 7 件待投料；完整批次对照保持不变。`);
  }

  stepButton.addEventListener('click', () => { if (timer === null) advance(); });
  runButton.addEventListener('click', () => {
    if (timer !== null) { pause('已手动暂停'); return; }
    if (state.done) return;
    if (document.hidden) { setStatus('页面处于后台，保持暂停；返回页面后可主动开始运行。'); return; }
    const token = ++timerToken;
    timer = window.setInterval(() => { if (token === timerToken) advance(); }, 500);
    render(); setStatus(`运行中 · t=${state.time}；每 500ms 推进 1 个模拟秒，所有已在加工的工位同时工作。`);
  });
  controls.forEach(control => control.addEventListener('change', () => reset('加工时间已修改，旧运行已停止')));
  document.getElementById('rerun-button').addEventListener('click', () => reset('已按当前加工条件重跑'));
  document.getElementById('balanced-preset').addEventListener('click', () => {
    controls.forEach(control => {control.value = '2';}); reset('已切换均衡示例 2 / 2 / 2');
  });
  document.getElementById('default-preset').addEventListener('click', () => {
    controls.forEach((control, index) => {control.value = String([2, 5, 2][index]);}); reset('已恢复瓶颈示例 2 / 5 / 2');
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause('页面已进入后台'); });
  const leave = () => pause('页面离开时自动暂停');
  window.addEventListener('pagehide', leave);
  window.addEventListener('beforeunload', leave);
  function updateMotion() {
    if (motion.matches) {
      pause('已开启减少动态效果');
      put('motion-note', '已检测到减少动态效果偏好，页面保持静止。可用“推进 1 秒”逐步观察，也可主动启动运行；偏好开启、页面后台、离开或修改条件时会停止已有计时器。模拟不写入学习进度，对照只存于本页内存。');
    } else put('motion-note', '页面默认暂停。你可以逐秒观察；自动运行时，每 500ms 推进 1 个模拟秒。页面进入后台、离开页面、修改条件或开启减少动态效果时自动暂停。所有比较仅存于本页内存，不记录学科学习进度。');
  }
  motion.addEventListener('change', updateMotion);
  render(); updateMotion();
})();
