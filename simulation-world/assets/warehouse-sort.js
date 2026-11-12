(function () {
  'use strict';

  const Model = window.WarehouseSortModel;
  const get = id => document.getElementById(id);
  const ids = ['arrival-interval', 'service-a', 'service-b', 'prediction-select',
    'preset-a', 'preset-b', 'preset-clear', 'step-button', 'run-button', 'pause-button', 'reset-button'];
  const control = Object.fromEntries(ids.map(id => [id, get(id)]));
  if (!Model) {
    get('simulation-status').textContent = '模拟模型未加载，请检查本地文件。';
    return;
  }

  let state = Model.createState();
  let timer = null;
  let prediction = '';
  let verdict = '';
  let message = '选择一项预测，再单步或运行。每一步跨越 1 模拟秒。';
  const completedRuns = [];

  function stopTimer() {
    if (timer !== null) clearInterval(timer);
    timer = null;
  }

  function label(route) {
    return route === 'A' ? 'A 口' : route === 'B' ? 'B 口' : '两口都不排队';
  }

  function configFromControls() {
    return {
      arrivalInterval: Number(control['arrival-interval'].value),
      serviceA: Number(control['service-a'].value),
      serviceB: Number(control['service-b'].value),
    };
  }

  function setControls(config) {
    control['arrival-interval'].value = String(config.arrivalInterval);
    control['service-a'].value = String(config.serviceA);
    control['service-b'].value = String(config.serviceB);
  }

  function reset(messageText) {
    stopTimer();
    state = Model.createState(configFromControls());
    prediction = '';
    verdict = '';
    control['prediction-select'].value = '';
    message = messageText;
    render();
  }

  function makeParcel(id) {
    const item = document.createElement('li');
    const parcel = Model.PARCELS.find(part => part.id === id);
    item.className = 'parcel';
    item.dataset.route = parcel.route;
    item.textContent = `${id} · ${parcel.route}`;
    return item;
  }

  function renderList(id, parcelIds, emptyText) {
    const list = get(id);
    list.replaceChildren();
    if (parcelIds.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'empty';
      empty.textContent = emptyText;
      list.append(empty);
      return;
    }
    for (const parcelId of parcelIds) list.append(makeParcel(parcelId));
  }

  function renderLane(route) {
    const lower = route.toLowerCase();
    renderList(`${lower}-queue`, state.queues[route], '没有等待中的包裹');
    const active = state.active[route];
    get(`${lower}-active`).textContent = active
      ? `${active.id} · 还需 ${active.endAt - state.time} 秒`
      : '空闲';
    const progress = get(`${lower}-progress`);
    const duration = state.config[`service${route}`];
    progress.max = duration;
    progress.value = active ? duration - (active.endAt - state.time) : 0;
    get(`${lower}-done`).textContent = String(state.done.filter(item => item.route === route).length);
    get(`${lower}-peak`).textContent = String(state.peakQueue[route]);
  }

  function recordText(record) {
    if (!record) return '尚无记录。';
    return `到达间隔 ${record.config.arrivalInterval} 秒；A/B 处理 ${record.config.serviceA}/${record.config.serviceB} 秒；整批 ${record.time} 秒；A/B 最大等待 ${record.peakQueue.A}/${record.peakQueue.B} 件。`;
  }

  function renderComparison() {
    const older = completedRuns[0];
    const latest = completedRuns.length === 2 ? completedRuns[1] : null;
    get('comparison-old').querySelector('p').textContent = recordText(older);
    get('comparison-new').querySelector('p').textContent = recordText(latest);
    if (!latest) {
      get('comparison-result').textContent = older
        ? '第一轮已记录。修改条件并完成第二轮，即可对照两条支路。'
        : '完成两轮后可比较整批时间与两口等待峰值。';
      return;
    }
    const difference = latest.time - older.time;
    const timeText = difference < 0 ? `快 ${-difference} 秒` : difference > 0 ? `慢 ${difference} 秒` : '用时相同';
    get('comparison-result').textContent = `本轮整批 ${latest.time} 秒，比前轮${timeText}；A 口最大等待 ${older.peakQueue.A}→${latest.peakQueue.A} 件，B 口 ${older.peakQueue.B}→${latest.peakQueue.B} 件。`;
  }

  function renderEvent() {
    if (state.time < 0) {
      get('event-summary').textContent = '尚未到达任何包裹。';
      return;
    }
    const fragments = [];
    if (state.event.completed.length) fragments.push(`${state.event.completed.join('、')} 完成`);
    if (state.event.arrived) {
      const parcel = Model.PARCELS.find(item => item.id === state.event.arrived);
      fragments.push(`${parcel.id} 到达 ${label(parcel.route)}`);
    }
    if (state.event.started.length) fragments.push(`${state.event.started.join('、')} 开始处理`);
    if (!fragments.length) fragments.push('本秒没有到达或完成事件');
    get('event-summary').textContent = `第 ${state.time} 秒：${fragments.join('；')}。${state.complete ? '本批全部分拣完成。' : ''}`;
  }

  function render() {
    get('clock').textContent = state.time < 0 ? '未开始' : `${state.time} 秒`;
    get('arrived-count').textContent = `${state.nextArrival} / ${Model.PARCELS.length}`;
    get('completed-count').textContent = `${state.done.length} / ${Model.PARCELS.length}`;
    get('first-queue').textContent = state.firstQueue ? label(state.firstQueue) : state.complete ? '都不排队' : '待观察';
    const upcoming = Model.PARCELS.slice(state.nextArrival);
    renderList('incoming-items', upcoming.map(item => item.id), '全部已到达');
    get('next-parcel').textContent = upcoming.length
      ? `下一件：${upcoming[0].id} → ${label(upcoming[0].route)}`
      : '12 件包裹已全部到达';
    renderLane('A');
    renderLane('B');
    renderEvent();
    renderComparison();
    get('prediction-status').textContent = verdict || (prediction
      ? `已选择${label(prediction)}；开始后将锁定预测。`
      : '请选择预测，再开始模拟。');
    get('simulation-status').textContent = message;
    for (const id of ['arrival-interval', 'service-a', 'service-b', 'preset-a', 'preset-b', 'preset-clear', 'reset-button']) control[id].disabled = false;
    control['prediction-select'].disabled = state.time >= 0;
    control['step-button'].disabled = state.complete;
    control['run-button'].disabled = state.complete || timer !== null;
    control['pause-button'].disabled = timer === null;
  }

  function advance() {
    if (!prediction) {
      message = '先选“哪一口会先出现等待”，再开始模拟。';
      render();
      return;
    }
    if (state.complete) return;
    state = Model.step(state);
    if (!verdict && (state.firstQueue || state.complete)) {
      const answer = state.firstQueue || 'none';
      verdict = prediction === answer
        ? `预测正确：${label(answer)}${answer === 'none' ? '' : '最先出现等待'}。`
        : `预测未命中：实际是${label(answer)}${answer === 'none' ? '' : '最先出现等待'}。可重跑再试。`;
    }
    if (state.complete) {
      stopTimer();
      completedRuns.push({config: {...state.config}, time: state.time, peakQueue: {...state.peakQueue}});
      if (completedRuns.length > 2) completedRuns.shift();
      message = `12 件包裹已全部分拣，整批用时 ${state.time} 模拟秒。`;
    } else {
      message = `已推进到第 ${state.time} 秒。${timer !== null ? '正在连续运行。' : '可继续单步或连续运行。'}`;
    }
    render();
  }

  control['prediction-select'].addEventListener('change', event => {
    prediction = event.target.value;
    render();
  });
  for (const id of ['arrival-interval', 'service-a', 'service-b']) {
    control[id].addEventListener('change', () => reset('条件已更新。本轮已重置；请重新预测。'));
  }
  for (const [id, config] of [
    ['preset-a', {arrivalInterval: 1, serviceA: 3, serviceB: 1}],
    ['preset-b', {arrivalInterval: 1, serviceA: 1, serviceB: 4}],
    ['preset-clear', {arrivalInterval: 1, serviceA: 1, serviceB: 1}],
  ]) {
    control[id].addEventListener('click', () => {
      setControls(config);
      reset('示例已载入；请预测哪一口先排队。');
    });
  }
  control['step-button'].addEventListener('click', () => {
    stopTimer();
    advance();
  });
  control['run-button'].addEventListener('click', () => {
    if (!prediction) {
      message = '先选“哪一口会先出现等待”，再开始模拟。';
      render();
      return;
    }
    if (state.complete || timer !== null) return;
    timer = setInterval(advance, 350);
    message = '正在连续运行；可随时暂停。';
    render();
  });
  control['pause-button'].addEventListener('click', () => {
    stopTimer();
    message = `已在第 ${state.time < 0 ? 0 : state.time} 秒暂停。`;
    render();
  });
  control['reset-button'].addEventListener('click', () => reset('已重跑当前条件；请重新预测。'));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && timer !== null) {
      stopTimer();
      message = '页面转到后台，连续运行已暂停。';
      render();
    }
  });
  window.addEventListener('pagehide', stopTimer);
  const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  motion?.addEventListener?.('change', () => {
    if (timer !== null) {
      stopTimer();
      message = '动态偏好已变化，连续运行已暂停。';
      render();
    }
  });
  render();
})();
