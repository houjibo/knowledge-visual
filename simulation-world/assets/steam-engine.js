(function () {
  'use strict';
  const model = window.SteamEngineModel;
  if (!model) return;
  const byId = id => document.getElementById(id);
  const rpmSelect = byId('rpm-select');
  const angleInput = byId('angle-input');
  const prediction = byId('intake-prediction');
  const revealButton = byId('reveal-button');
  const stepButton = byId('step-button');
  const playButton = byId('play-button');
  const pauseButton = byId('pause-button');
  const resetButton = byId('reset-button');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let rpm = 15;
  let startAngle = 0;
  let advance = 0;
  let revealed = false;
  let playing = false;
  let frame = 0;
  let lastFrame = 0;

  function setAttrs(id, attributes) {
    const element = byId(id);
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, String(value));
  }

  function format(value) { return Number(value.toFixed(2)); }

  function updateButtons() {
    revealButton.disabled = revealed || !prediction.value;
    prediction.disabled = revealed;
    stepButton.disabled = !revealed || playing || advance >= model.maxAdvance;
    playButton.disabled = !revealed || playing || advance >= model.maxAdvance || reducedMotion.matches || document.hidden;
    pauseButton.disabled = !playing;
    resetButton.disabled = !revealed || (!advance && !playing);
  }

  function render() {
    const state = model.at(startAngle + advance, rpm);
    byId('angle-output').value = `${startAngle}°`;
    byId('period-note').textContent = `一圈 ${state.periodSeconds} s；半圈 ${state.halfCycleSeconds} s`;
    byId('angle-readout').textContent = `${format(state.degrees)}°`;
    byId('elapsed-readout').textContent = `${model.elapsedSeconds(advance, rpm).toFixed(2)} s`;
    setAttrs('piston', {x: format(state.pistonX - 9)});
    setAttrs('piston-rod', {x1: format(state.pistonX), x2: format(state.crossheadX)});
    setAttrs('crosshead', {cx: format(state.crossheadX)});
    setAttrs('connecting-rod', {x1: format(state.crossheadX), x2: format(state.pinX), y2: format(state.pinY)});
    setAttrs('crank-arm', {x2: format(state.pinX), y2: format(state.pinY)});
    setAttrs('crank-pin', {cx: format(state.pinX), cy: format(state.pinY)});
    setAttrs('left-chamber', {width: format(state.pistonX - 9 - 144)});
    setAttrs('right-chamber', {x: format(state.pistonX + 9), width: format(355 - (state.pistonX + 9))});
    const side = state.intake === 'left' ? '左' : '右';
    const other = state.intake === 'left' ? '右' : '左';
    for (const name of ['left', 'right']) {
      const active = revealed && state.intake === name;
      setAttrs(`${name}-pipe`, {stroke: active ? '#ffd894' : '#729096', 'stroke-width': active ? 11 : 9, 'marker-end': active ? 'url(#flow-arrow)' : ''});
      setAttrs(`${name}-chamber`, {fill: active ? '#eea35d' : '#b0784a', opacity: active ? .7 : .3});
    }
    byId('flow-label').textContent = revealed ? `${side}腔进汽 · ${other}腔排汽` : '先预测进汽侧';
    byId('intake-readout').textContent = revealed ? `${side}侧` : '待预测';
    byId('displacement-readout').textContent = revealed ? `${format(state.displacement)} / 130` : '待揭晓';
    byId('phase-explanation').textContent = revealed
      ? `${side}腔进汽，${other}腔排汽；活塞${state.deadCenter ? '位于换向点，接下来' : '正在'}${state.nextMotion}。活塞杆推动十字头，连杆带动曲柄与飞轮，转轴把旋转运动送往机器。`
      : '先选择进汽侧；揭晓后，观察蒸汽作用于活塞、连杆带动飞轮的方向。';
    byId('engine-scene').setAttribute('aria-label', revealed
      ? `曲轴 ${format(state.degrees)}°，${side}侧进汽、${other}侧排汽，活塞行程位置 ${format(state.displacement)} / 130，接下来${state.nextMotion}`
      : `曲轴 ${format(state.degrees)}°，进汽侧待预测；活塞、十字头、连杆和飞轮的静态位置示意`);
    updateButtons();
  }

  function pause(message) {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastFrame = 0;
    playing = false;
    if (message) byId('runtime-status').textContent = message;
    updateButtons();
  }

  function resetPrediction() {
    pause();
    advance = 0;
    revealed = false;
    prediction.value = '';
    byId('prediction-feedback').textContent = '选好进汽侧，再揭晓动力路径。';
    byId('runtime-status').textContent = '动画初始暂停；揭晓后可单步或主动播放。';
    render();
  }

  function tick(timestamp) {
    if (!playing) return;
    if (lastFrame) advance = Math.min(model.maxAdvance, advance + Math.min((timestamp - lastFrame) / 1000, .1) * rpm * 6);
    lastFrame = timestamp;
    render();
    if (advance >= model.maxAdvance) {
      pause('两圈演示完成；可回到起始角重新观察。');
      return;
    }
    frame = requestAnimationFrame(tick);
  }

  rpmSelect.addEventListener('change', () => { rpm = Number(rpmSelect.value); resetPrediction(); });
  angleInput.addEventListener('input', () => { startAngle = Number(angleInput.value); resetPrediction(); });
  prediction.addEventListener('change', updateButtons);
  revealButton.addEventListener('click', () => {
    if (!prediction.value || revealed) return;
    const correct = prediction.value === model.at(startAngle, rpm).intake;
    revealed = true;
    byId('prediction-feedback').textContent = correct
      ? '预测正确。观察进汽侧与活塞接下来的运动。'
      : '预测与模型不符。看进汽侧高亮，再把曲轴移过 180° 比较。';
    byId('runtime-status').textContent = '已揭晓；可前进 45° 或主动播放两圈。';
    render();
  });
  stepButton.addEventListener('click', () => {
    if (!revealed || playing || advance >= model.maxAdvance) return;
    advance = Math.min(model.maxAdvance, advance + 45);
    render();
    if (advance >= model.maxAdvance) byId('runtime-status').textContent = '两圈演示完成；可回到起始角重新观察。';
  });
  playButton.addEventListener('click', () => {
    if (!revealed || playing || reducedMotion.matches || document.hidden || advance >= model.maxAdvance) return;
    playing = true;
    byId('runtime-status').textContent = '正在演示；随时可以暂停。';
    updateButtons();
    frame = requestAnimationFrame(tick);
  });
  pauseButton.addEventListener('click', () => pause('已暂停；可单步或继续演示。'));
  resetButton.addEventListener('click', () => {
    pause('已回到起始角；可以重新单步或演示。');
    advance = 0;
    render();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) pause('页面隐藏，演示已自动暂停。'); else updateButtons(); });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches && playing) pause('系统偏好减少动态，演示已自动暂停；仍可单步。');
    else updateButtons();
  });
  for (const control of document.querySelectorAll('[data-interactive]')) control.disabled = false;
  resetPrediction();
})();
