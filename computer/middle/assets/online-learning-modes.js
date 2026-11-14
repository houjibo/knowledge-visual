(function () {
  'use strict';
  const Model = window.OnlineLearningModesModel;
  const $ = id => document.getElementById(id);
  const keys = Object.keys(Model.CASES);
  const earned = new Set();
  let shifted = false;
  let conclusionCorrect = false;

  function currentKey() {
    return $('scenario').value === 'remote-question' && shifted ? 'remote-shifted' : $('scenario').value;
  }

  function feedback(id, message, kind) {
    $(id).textContent = message;
    $(id).className = `feedback${kind ? ` ${kind}` : ''}`;
  }

  function renderModes(result) {
    Object.keys(Model.MODES).forEach(mode => {
      const card = $(`mode-${mode}`);
      const possible = result && result.feasible[mode];
      const preferred = result && result.expected.mode === mode;
      card.classList.toggle('feasible', !!possible);
      card.classList.toggle('blocked', !!result && !possible);
      card.classList.toggle('preferred', !!preferred);
      card.querySelector('.mode-status').textContent = !result ? '提交后显示可行性'
        : preferred ? '可行 · 本情境推荐' : possible ? '可行但不优先' : '当前不可行';
    });
  }

  function renderProgress() {
    keys.forEach(key => {
      $(`challenge-${key}`).textContent = earned.has(key) ? '✓ 本轮已完成' : '○ 待完成';
    });
    const ready = earned.size === keys.length;
    $('conclusion-choice').disabled = !ready;
    $('check-conclusion').disabled = !ready;
    const stored = window.SubjectProgress.read('computer', 'middle');
    const saved = stored !== null && stored['online-learning-modes'] === true;
    if (saved) {
      $('progress-status').textContent = ready && conclusionCorrect
        ? '本机已记录完成交流方式选择主题。'
        : `本机此前已记录完成；本轮已完成 ${earned.size}/4 种条件。`;
      $('retry-save').hidden = true;
    } else if (ready && conclusionCorrect) {
      $('progress-status').textContent = '本轮任务已完成，但本机进度未能保存；可重试保存。';
      $('retry-save').hidden = false;
    } else {
      $('progress-status').textContent = stored === null
        ? `本机进度暂不可用；仍可继续实验。本轮已完成 ${earned.size}/4 种条件。`
        : `本轮已完成 ${earned.size}/4 种条件；还需完成结论。`;
      $('retry-save').hidden = true;
    }
  }

  function saveCompletion() {
    if (!conclusionCorrect || earned.size !== keys.length) return;
    const saved = window.SubjectProgress.markComplete('computer', 'middle', 'online-learning-modes');
    feedback('conclusion-feedback', saved ? '结论正确，已记录本主题完成。'
      : '结论正确，但本机进度保存失败。可重试保存。', saved ? 'success' : 'error');
    renderProgress();
  }

  function renderSituation() {
    const current = Model.scenario(currentKey());
    $('scenario-status').textContent = `${current.title}。先观察任务条件，再选最合适的方式与依据。`;
    $('task-text').textContent = current.task;
    $('place-value').textContent = current.place;
    $('network-value').textContent = current.internet ? '可用' : '暂不可用';
    $('overlap-value').textContent = current.overlap ? '有' : '没有';
    for (const cell of document.querySelectorAll('[data-person][data-time]')) {
      const active = current.times[cell.dataset.person] === cell.dataset.time;
      cell.textContent = active ? '可' : '—';
      cell.classList.toggle('active', active);
      cell.setAttribute('aria-label', `${cell.dataset.person.toUpperCase()} 在 ${cell.dataset.time}${active ? '可参与' : '不在可参与时段'}`);
    }
    $('schedule-summary').textContent = `A 可参与 ${current.times.a}；B 可参与 ${current.times.b}；${current.overlap ? '两人有共同时间。' : '两人没有共同时间。'}`;
    $('change-time-button').disabled = $('scenario').value !== 'remote-question';
    $('change-time-button').textContent = shifted ? '恢复 B 到 18:00' : '让 B 改到 20:00';
    $('mode-choice').value = '';
    $('reason-choice').value = '';
    feedback('choice-feedback', '先选择交流方式与主要依据。');
    renderModes(null);
    renderProgress();
  }

  $('scenario').addEventListener('change', () => {
    shifted = false;
    renderSituation();
  });
  $('change-time-button').addEventListener('click', () => {
    if ($('scenario').value !== 'remote-question') return;
    shifted = !shifted;
    renderSituation();
  });
  $('check-choice').addEventListener('click', () => {
    const result = Model.assess(currentKey(), $('mode-choice').value, $('reason-choice').value);
    if (result.status === 'incomplete') {
      feedback('choice-feedback', result.feedback, 'error');
      return;
    }
    renderModes(result);
    if (result.status === 'correct') {
      earned.add(currentKey());
      renderProgress();
    }
    feedback('choice-feedback', `${result.status === 'correct' ? '方式与依据均符合本情境。' : '请比较条件并修正。'}${result.feedback}`,
      result.status === 'correct' ? 'success' : 'error');
  });
  $('check-conclusion').addEventListener('click', () => {
    if (earned.size !== keys.length) return;
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
  ['scenario', 'mode-choice', 'reason-choice', 'check-choice'].forEach(id => { $(id).disabled = false; });
  renderSituation();
})();
