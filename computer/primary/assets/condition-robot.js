(function () {
  'use strict';
  const Model = window.ConditionRobotModel;
  const subject = 'computer', stage = 'primary', slug = 'conditional-robot';
  const check = document.getElementById('check-direction');
  const whenTrue = document.getElementById('true-action');
  const whenFalse = document.getElementById('false-action');
  const grid = document.getElementById('robot-grid');
  const snapshotPanel = document.getElementById('last-snapshot');
  const conditionOutput = document.getElementById('snapshot-condition');
  const stepButton = document.getElementById('step-button');
  const runStatus = document.getElementById('run-status');
  const progressStatus = document.getElementById('progress-status');
  const retrySave = document.getElementById('retry-save');
  const prior = window.SubjectProgress.read(subject, stage);
  let state = Model.createState();
  let historyCompleted = prior !== null && prior[slug] === true;
  let earnedThisSession = false, pendingSave = false, saveNotice = '';
  const snapshotIds = ['before', 'check', 'kind', 'condition', 'branch', 'action', 'target', 'movement', 'after'];

  function put(id, value) { document.getElementById(id).textContent = String(value); }
  function positionText(position) { return `第 ${position.column} 列，第 ${position.row} 行`; }
  function targetText(position) {
    if (position.row < 1) return `${positionText(position)}（上方边界外）`;
    if (position.row > Model.HEIGHT) return `${positionText(position)}（下方边界外）`;
    if (position.column < 1) return `${positionText(position)}（左侧边界外）`;
    if (position.column > Model.WIDTH) return `${positionText(position)}（右侧边界外）`;
    return positionText(position);
  }
  function kindText(kind) { return {open: '畅通格', wall: '墙面', boundary: '地图边界外'}[kind]; }
  function conditionText(value) { return value ? '成立（true）' : '不成立（false）'; }
  function movementText(movement) { return {moved: '成功移动 1 格', wall: '碰到墙，留在原地', boundary: '超出边界，留在原地'}[movement]; }
  function showStatus(message, mode = '') {
    runStatus.className = `status${mode ? ` ${mode}` : ''}`;
    runStatus.textContent = message;
    runStatus.dataset.state = state.eligible ? 'success' : state.atGoal ? 'goal-incomplete' : state.steps ? 'exploring' : 'ready';
  }

  function renderProgress() {
    retrySave.hidden = !pendingSave;
    if (pendingSave) {
      progressStatus.textContent = `${historyCompleted ? '本机先前已有完成记录。' : ''}${state.eligible ? '当前探索已完成，但未能保存学习进度。' : '本页此前已完成一轮探索，但未能保存学习进度；当前探索尚未完成。'}恢复存储后，可重试保存此前赢得的完成资格，无需重走路线。损坏记录原文会保留。`;
    } else if (saveNotice) {
      progressStatus.textContent = saveNotice;
    } else if (historyCompleted) {
      progressStatus.textContent = '本机已有这个主题的完成记录；当前探索仍按新一轮规则判断。重置或修改参数会保留历史记录。';
    } else if (prior === null) {
      progressStatus.textContent = '本机进度暂不可用，你仍可探索。完成后将尝试保存；异常记录不会自动覆盖，保存失败可重试。';
    } else {
      progressStatus.textContent = '当前浏览器尚无这个主题的完成记录。同一规则下无碰撞、观察真假并抵达目标后，才会尝试保存。';
    }
  }

  function saveCompletion() {
    if (!earnedThisSession) return false;
    let saved = false;
    try { saved = window.SubjectProgress.markComplete(subject, stage, slug) === true; }
    catch (_) { saved = false; }
    pendingSave = !saved;
    if (saved) {
      historyCompleted = true;
      saveNotice = state.eligible ? '当前探索已完成，已保存本机学习进度。' : '已保存此前赢得的完成资格；当前探索尚未完成，地图与判断状态保持不变。';
    } else saveNotice = '';
    renderProgress();
    return saved;
  }

  function renderMap() {
    grid.replaceChildren();
    const snapshot = state.snapshot;
    for (let row = 1; row <= Model.HEIGHT; row++) for (let column = 1; column <= Model.WIDTH; column++) {
      const cell = document.createElement('div'), position = {column, row};
      cell.className = 'robot-cell'; cell.dataset.column = String(column); cell.dataset.row = String(row); cell.setAttribute('aria-hidden', 'true');
      const same = other => other.column === column && other.row === row;
      const current = same(state.position), goal = same(Model.GOAL), wall = Model.cellKind(position) === 'wall';
      if (wall) cell.classList.add('wall'); if (goal) cell.classList.add('goal'); if (current) cell.classList.add('current');
      cell.textContent = current ? '🤖' : goal ? '🏁' : wall ? '■' : '·';
      if (snapshot && same(snapshot.checkedPosition)) {
        cell.classList.add('checked'); const marker = document.createElement('span'); marker.className = 'cell-marker'; marker.textContent = '查'; cell.append(marker);
      }
      if (snapshot && same(snapshot.positionBefore)) {
        cell.classList.add('origin'); const marker = document.createElement('span'); marker.className = 'cell-marker origin-marker'; marker.textContent = '判'; cell.append(marker);
      }
      grid.append(cell);
    }
    grid.dataset.column = String(state.position.column); grid.dataset.row = String(state.position.row);
    if (snapshot) {
      grid.dataset.checkColumn = String(snapshot.checkedPosition.column); grid.dataset.checkRow = String(snapshot.checkedPosition.row);
      grid.dataset.checkKind = snapshot.checkedKind; grid.dataset.condition = String(snapshot.condition);
    } else {
      for (const key of ['checkColumn', 'checkRow', 'checkKind', 'condition']) delete grid.dataset[key];
    }
    const latest = snapshot ? `上次从${positionText(snapshot.positionBefore)}检查${targetText(snapshot.checkedPosition)}，${kindText(snapshot.checkedKind)}，条件${snapshot.condition ? '成立' : '不成立'}。` : '尚未判断。';
    grid.setAttribute('aria-label', `5 列 3 行地图，起点第 1 列第 3 行，目标第 5 列第 1 行；墙在第 3 列第 3 行、第 5 列第 2 行。机器人当前位置：${positionText(state.position)}。${latest}`);
    put('position-status', `当前位置：${positionText(state.position)}`);
  }

  function renderSnapshot() {
    const snapshot = state.snapshot;
    if (!snapshot) {
      snapshotIds.forEach(id => put(`snapshot-${id}`, '尚未判断'));
      delete snapshotPanel.dataset.condition; delete snapshotPanel.dataset.branch;
      delete conditionOutput.dataset.condition; delete document.getElementById('snapshot-movement').dataset.movement;
      return;
    }
    snapshotPanel.dataset.condition = String(snapshot.condition); snapshotPanel.dataset.branch = snapshot.branch;
    conditionOutput.dataset.condition = String(snapshot.condition);
    document.getElementById('snapshot-movement').dataset.movement = snapshot.movement;
    put('snapshot-before', positionText(snapshot.positionBefore)); put('snapshot-check', targetText(snapshot.checkedPosition));
    put('snapshot-kind', kindText(snapshot.checkedKind)); put('snapshot-condition', conditionText(snapshot.condition));
    put('snapshot-branch', snapshot.branch === 'if' ? '成立分支（if）' : '不成立分支（else）');
    put('snapshot-action', Model.DIRECTIONS[snapshot.action].label); put('snapshot-target', targetText(snapshot.actionTarget));
    put('snapshot-movement', movementText(snapshot.movement)); put('snapshot-after', positionText(snapshot.positionAfter));
  }

  function render() {
    put('condition-description', `如果${state.rule.check === 'right' ? '右侧' : '上方'}有障碍（墙或边界）`);
    put('if-action-label', `执行：${Model.DIRECTIONS[state.rule.whenTrue].label}`);
    put('else-action-label', `执行：${Model.DIRECTIONS[state.rule.whenFalse].label}`);
    for (const branch of ['if', 'else']) {
      const card = document.getElementById(`${branch}-branch`), selected = state.snapshot !== null && state.snapshot.branch === branch;
      if (selected) card.setAttribute('aria-current', 'step'); else card.removeAttribute('aria-current');
      card.querySelector('.selected-label').hidden = !selected;
    }
    put('judgement-count', state.steps); put('true-count', state.trueCount); put('false-count', state.falseCount); put('collision-count', state.collisions);
    renderMap(); renderSnapshot(); stepButton.disabled = state.atGoal;
  }

  function reset(message) {
    state = Model.createState({check: check.value, whenTrue: whenTrue.value, whenFalse: whenFalse.value});
    saveNotice = ''; render(); renderProgress();
    showStatus(`${message} 当前探索尚未判断；先前保存的记录或已赢得但待保存的资格都会保留。`);
  }

  stepButton.addEventListener('click', () => {
    if (state.atGoal) return;
    state = Model.step(state); render();
    const snapshot = state.snapshot;
    if (state.eligible) {
      earnedThisSession = true;
      const saved = saveCompletion();
      showStatus(`当前探索成功：同一规则下没有碰撞，已观察成立与不成立并抵达目标。${saved ? '已保存本机学习进度。' : '未能保存学习进度，可重试保存。'}`, 'success');
    } else if (state.atGoal) {
      renderProgress(); showStatus('当前探索已到目标，但尚未满足同一规则下无碰撞且观察真假两种结果的完成条件。可回到起点重新探索。');
    } else {
      renderProgress();
      showStatus(`第 ${state.steps} 次：在${positionText(snapshot.positionBefore)}判断，条件${snapshot.condition ? '成立' : '不成立'}；只执行 ${snapshot.branch} 分支“${Model.DIRECTIONS[snapshot.action].label}”。${movementText(snapshot.movement)}，当前位置：${positionText(snapshot.positionAfter)}。`, snapshot.movement === 'moved' ? '' : 'error');
    }
  });
  [check, whenTrue, whenFalse].forEach(control => control.addEventListener('change', () => reset('规则已修改，已回到起点并清空本轮判断。')));
  document.getElementById('reset-button').addEventListener('click', () => reset('已回到起点并保留当前规则。'));
  document.getElementById('example-button').addEventListener('click', () => {
    check.value = 'right'; whenTrue.value = 'up'; whenFalse.value = 'right'; reset('已恢复示例规则并回到起点。');
  });
  retrySave.addEventListener('click', () => {
    const saved = saveCompletion();
    if (state.eligible) showStatus(`当前探索已完成。${saved ? '已保存本机学习进度。' : '仍未能保存学习进度，可恢复存储后重试。'}`, 'success');
  });
  render(); renderProgress();
})();
