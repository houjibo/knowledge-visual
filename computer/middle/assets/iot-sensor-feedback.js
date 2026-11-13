(function () {
  'use strict';
  const Model = window.IotSensorFeedbackModel;
  const $ = id => document.getElementById(id);
  const scenarioKeys = ['dry', 'wet', 'lost'];
  const phaseIds = ['sensor', 'gateway', 'controller', 'environment'];
  const earned = new Set();
  let rounds = [];
  let roundIndex = 0;
  let started = false;
  let phase = 0;
  let prediction = null;
  let allCorrect = true;
  let saveFailed = false;

  function pumpText(on) { return on ? '开' : '关'; }
  function current() { return rounds[roundIndex]; }

  function renderProgress() {
    scenarioKeys.forEach(key => {
      $(`challenge-${key}`).textContent = earned.has(key) ? '✓ 本轮已完成' : '○ 待完成';
    });
    const stored = window.SubjectProgress.read('computer', 'middle');
    const saved = stored !== null && stored['iot-sensor-feedback'] === true;
    if (saved) {
      $('progress-status').textContent = '本机已记录完成传感与控制主题。';
      $('retry-save').hidden = true;
    } else if (earned.size === scenarioKeys.length) {
      $('progress-status').textContent = saveFailed || stored === null
        ? '三个场景已完成，但本机进度未能保存；可重试保存。'
        : '三个场景已完成，正在保存本机进度…';
      $('retry-save').hidden = false;
    } else {
      $('progress-status').textContent = stored === null
        ? `本机进度暂不可用；仍可继续实验。本轮已完成 ${earned.size}/3 项。`
        : `本轮已完成 ${earned.size}/3 项；尚未记录本主题完成。`;
      $('retry-save').hidden = true;
    }
  }

  function saveCompletion() {
    if (earned.size !== scenarioKeys.length) return;
    saveFailed = !window.SubjectProgress.markComplete('computer', 'middle', 'iot-sensor-feedback');
    renderProgress();
  }

  function phaseMessages(round) {
    return [
      `传感器读取虚构湿度指数 ${round.reading}。`,
      round.delivered
        ? `网关把读数 ${round.reading} 送达控制器。`
        : `网关消息丢失；控制器没有收到本轮读数 ${round.reading}。`,
      round.delivered
        ? `收到 ${round.reading}；${round.reading < Model.THRESHOLD ? '低于' : '达到或超过'}阈值 ${Model.THRESHOLD}，命令水泵${pumpText(round.command)}。`
        : `没有新读数，本模型沿用上一命令：水泵${pumpText(round.command)}。若消息送达，读数 ${round.reading} 会使水泵${pumpText(round.reading < Model.THRESHOLD)}。`,
      `水泵${pumpText(round.command)}：按教学规则指数${round.command ? `增加 ${Model.PUMP_GAIN}` : `减少 ${Model.IDLE_LOSS}`}，下一轮为 ${round.next}。`
    ];
  }

  function render() {
    const round = current();
    const count = rounds.length;
    $('round-status').textContent = `${Model.SCENARIOS[$('scenario').value].label} · 第 ${roundIndex + 1}/${count} 轮。`;
    $('reading-value').textContent = String(round.reading);
    $('reading-gauge').value = round.reading;
    $('prior-command').textContent = `上一轮命令：水泵${pumpText(round.previousPump)}。`;
    $('delivery-hint').textContent = `本轮消息：${round.delivered ? '送达控制器' : '在网关后丢失'}。`;
    const messages = phaseMessages(round);
    phaseIds.forEach((id, index) => {
      const box = $(`phase-${id}`);
      box.classList.toggle('revealed', index < phase);
      box.querySelector('p').textContent = index < phase ? messages[index] : '尚未揭示';
    });
    $('pump-prediction').disabled = started;
    $('next-prediction').disabled = started;
    $('start-button').disabled = started;
    $('step-button').disabled = !started || phase >= phaseIds.length;
    const nextAvailable = started && phase === phaseIds.length && roundIndex + 1 < count;
    $('next-button').hidden = !nextAvailable;
    $('next-button').disabled = !nextAvailable;
    if (!started) $('step-status').textContent = '尚未提交预测。';
    else if (phase < phaseIds.length) $('step-status').textContent = `已观察 ${phase}/4 环；继续揭示${phaseIds.length - phase}环。`;
    else if (nextAvailable) $('step-status').textContent = '本轮四环已观察；进入下一轮，检查反馈后的新读数。';
    else $('step-status').textContent = '本场景全部环节已观察；可换场景或重新挑战。';
  }

  function reset(message) {
    rounds = Model.runScenario($('scenario').value);
    roundIndex = 0;
    started = false;
    phase = 0;
    prediction = null;
    allCorrect = true;
    $('pump-prediction').value = '';
    $('next-prediction').value = '';
    $('prediction-status').textContent = message || '等待预测。';
    $('prediction-status').className = 'feedback';
    render();
  }

  function finishRound() {
    const round = current();
    const correct = prediction.pump === round.command && prediction.next === round.next;
    allCorrect = allCorrect && correct;
    $('prediction-status').textContent = `${correct ? '本轮预测正确。' : '本轮预测未对。'}实际命令为水泵${pumpText(round.command)}，下一轮指数 ${round.next}。${correct ? '请继续完成场景。' : '可继续观察；若要取得本场景完成记录，请重新挑战。'}`;
    $('prediction-status').className = `feedback ${correct ? 'success' : 'error'}`;
    if (roundIndex === rounds.length - 1 && allCorrect) {
      earned.add($('scenario').value);
      renderProgress();
      if (earned.size === scenarioKeys.length) saveCompletion();
    }
  }

  $('scenario').addEventListener('change', () => reset('场景已改变；请重新预测。'));
  $('reset-button').addEventListener('click', () => reset());
  $('start-button').addEventListener('click', () => {
    const pump = $('pump-prediction').value;
    const rawNext = $('next-prediction').value;
    const next = Number(rawNext);
    if (!pump || rawNext === '' || !Number.isInteger(next) || next < 0 || next > 100) {
      $('prediction-status').textContent = '请选择水泵命令，并填写 0–100 的整数作为下一轮指数。';
      $('prediction-status').className = 'feedback error';
      return;
    }
    prediction = {pump: pump === 'on', next};
    started = true;
    $('prediction-status').textContent = '预测已提交；逐环观察后核对。';
    $('prediction-status').className = 'feedback';
    render();
  });
  $('step-button').addEventListener('click', () => {
    if (!started || phase >= phaseIds.length) return;
    phase += 1;
    render();
    if (phase === phaseIds.length) finishRound();
  });
  $('next-button').addEventListener('click', () => {
    if (!started || phase !== phaseIds.length || roundIndex + 1 >= rounds.length) return;
    roundIndex += 1;
    started = false;
    phase = 0;
    prediction = null;
    $('pump-prediction').value = '';
    $('next-prediction').value = '';
    $('prediction-status').textContent = '上一轮的结果成为本轮读数；请重新预测。';
    $('prediction-status').className = 'feedback';
    render();
  });
  $('retry-save').addEventListener('click', saveCompletion);
  window.addEventListener('pageshow', renderProgress);
  window.addEventListener('storage', renderProgress);
  ['scenario', 'reset-button'].forEach(id => { $(id).disabled = false; });
  reset();
  renderProgress();
})();
