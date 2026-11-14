(function () {
  'use strict';
  const Model = window.OnlineCollaborationModel;
  const $ = id => document.getElementById(id);
  const scenarios = Object.keys(Model.scenarioNames);
  const earned = new Set();
  let state = Model.initial('offline');
  let history = [];
  let perfect = true;
  let conclusionCorrect = false;
  let saveFailed = false;

  function feedback(id, message, kind) {
    $(id).textContent = message;
    $(id).className = `feedback${kind ? ` ${kind}` : ''}`;
  }

  function renderCard(id, version, connection, stale) {
    const card = $(`card-${id}`);
    card.querySelector('.version').textContent = version === null ? '不使用' : `版本 ${version}`;
    card.querySelector('.connection').textContent = connection;
    card.classList.toggle('stale', stale);
  }

  function renderHistory() {
    const list = $('history');
    list.replaceChildren();
    history.forEach(item => {
      const row = document.createElement('li');
      row.textContent = item;
      list.append(row);
    });
  }

  function renderProgress() {
    scenarios.forEach(scenario => {
      $(`challenge-${scenario}`).textContent = earned.has(scenario) ? '✓ 本轮已完成' : '○ 待完成';
    });
    const ready = earned.size === scenarios.length;
    $('conclusion-choice').disabled = !ready;
    $('check-conclusion').disabled = !ready;
    const stored = window.SubjectProgress.read('computer', 'middle');
    const saved = stored !== null && stored['online-collaboration'] === true;
    if (saved) {
      $('progress-status').textContent = ready && conclusionCorrect
        ? '本机已记录完成资料共享与同步主题。'
        : `本机此前已记录完成；本轮已完成 ${earned.size}/3 项。`;
      $('retry-save').hidden = true;
    } else if (ready && conclusionCorrect) {
      $('progress-status').textContent = '本轮任务已完成，但本机进度未能保存；可重试保存。';
      $('retry-save').hidden = false;
    } else {
      $('progress-status').textContent = stored === null
        ? `本机进度暂不可用；仍可继续实验。本轮已完成 ${earned.size}/3 项。`
        : `本轮已完成 ${earned.size}/3 项；还需完成对照结论。`;
      $('retry-save').hidden = true;
    }
  }

  function saveCompletion() {
    if (!conclusionCorrect || earned.size !== scenarios.length) return;
    saveFailed = !window.SubjectProgress.markComplete('computer', 'middle', 'online-collaboration');
    if (saveFailed) feedback('conclusion-feedback', '结论正确，但本机进度保存失败。可重试保存。', 'error');
    else feedback('conclusion-feedback', '结论正确，已记录本主题完成。', 'success');
    renderProgress();
  }

  function render() {
    const offline = state.scenario === 'offline';
    renderCard('a', state.versions.a, '本机编辑者', false);
    renderCard('service', state.shared, offline ? '本情境没有共享服务' : '只存一份共享版本；本页模拟', false);
    renderCard('b', state.versions.b, offline ? '独立副本：等待手动递送' : '已连接', state.edited && state.versions.b < 2);
    renderCard('c', state.versions.c, offline ? '独立副本：等待手动递送' : state.connected.c ? '已连接' : '暂时断线', state.edited && state.versions.c < 2);
    $('flow-caption').textContent = offline
      ? 'A → 手动递送给所选同伴；另一位保留原副本。'
      : 'A → 模拟共享服务 → 本步已连接的同伴；断线者需重连后再同步。';
    $('version-summary').textContent = `当前 A：版本 ${state.versions.a}；${offline ? '共享服务：不使用' : `共享服务：版本 ${state.shared}`}；B：版本 ${state.versions.b}；C：版本 ${state.versions.c}。`;
    $('manual-target').disabled = !offline || !state.edited || Model.isComplete(state);
    $('edit-button').disabled = state.edited;
    $('reconnect-button').disabled = state.scenario !== 'disconnected' || !state.edited || state.steps < 1 || state.connected.c;
    const canStep = state.edited && !Model.isComplete(state) && (offline || state.connected.c || state.steps === 0);
    $('predict-b').disabled = !canStep;
    $('predict-c').disabled = !canStep;
    $('step-button').disabled = !canStep;
    $('scenario-status').textContent = `${Model.scenarioNames[state.scenario]} · 已推进 ${state.steps} 步。${Model.isComplete(state) ? 'B、C 都取得新版。' : ''}`;
    renderHistory();
    renderProgress();
  }

  function reset(message) {
    state = Model.initial($('scenario').value);
    history = ['A、B、C 从版本 1 开始。'];
    perfect = true;
    $('manual-target').value = '';
    $('predict-b').value = '';
    $('predict-c').value = '';
    feedback('step-feedback', message || '先让 A 修改资料，再预测下一步。');
    render();
  }

  $('scenario').addEventListener('change', () => reset('已切换情境；从版本 1 重新开始。'));
  $('reset-button').addEventListener('click', () => reset('已重做本情境；此前获得的情境标记仍保留。'));
  $('edit-button').addEventListener('click', () => {
    state = Model.edit(state);
    history.push(state.scenario === 'offline'
      ? 'A 把自己的副本改为版本 2；B、C 仍是版本 1。'
      : 'A 把共享资料改为版本 2；B、C 尚未执行同步。');
    feedback('step-feedback', '请选择 B、C 下一步看到的版本，再核对。');
    render();
  });
  $('reconnect-button').addEventListener('click', () => {
    state = Model.reconnectC(state);
    history.push('C 已重连，但仍持版本 1；下一次同步才能取得新版。');
    feedback('step-feedback', 'C 已重连，版本仍是 1；预测下一次同步。');
    render();
  });
  $('step-button').addEventListener('click', () => {
    const target = $('manual-target').value;
    try {
      const result = Model.assess(state, state.scenario === 'offline' ? target : null,
        $('predict-b').value === '' ? null : Number($('predict-b').value),
        $('predict-c').value === '' ? null : Number($('predict-c').value));
      if (result.status === 'incomplete') {
        feedback('step-feedback', result.feedback, 'error');
        return;
      }
      state = result.next;
      perfect = perfect && result.status === 'correct';
      history.push(`${state.scenario === 'offline' ? `手动递送给 ${target.toUpperCase()}` : `同步 ${result.delivered.map(peer => peer.toUpperCase()).join('、')}`}：B 为版本 ${state.versions.b}，C 为版本 ${state.versions.c}。`);
      $('manual-target').value = '';
      $('predict-b').value = '';
      $('predict-c').value = '';
      render();
      const finished = Model.isComplete(state);
      if (finished && perfect) {
        earned.add(state.scenario);
        renderProgress();
      }
      feedback('step-feedback', result.feedback + (finished
        ? perfect ? '本情境已完成；继续完成其余情境。' : '本情境未取得标记；可重做并逐步预测。'
        : ''), result.status === 'correct' ? 'success' : 'error');
    } catch (error) {
      feedback('step-feedback', error.message, 'error');
    }
  });
  $('check-conclusion').addEventListener('click', () => {
    if (earned.size !== scenarios.length) return;
    const choice = document.querySelector('input[name="conclusion"]:checked');
    const result = Model.checkConclusion(choice ? choice.value : null);
    feedback('conclusion-feedback', result.feedback, result.status === 'correct' ? 'success' : 'error');
    if (result.status === 'correct') {
      conclusionCorrect = true;
      saveCompletion();
    }
  });
  $('retry-save').addEventListener('click', saveCompletion);
  window.addEventListener('pageshow', renderProgress);
  window.addEventListener('storage', renderProgress);
  ['scenario', 'reset-button'].forEach(id => { $(id).disabled = false; });
  reset();
})();
