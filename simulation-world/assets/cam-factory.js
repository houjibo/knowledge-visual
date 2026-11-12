(() => {
  'use strict';
  const Model = window.CamFactoryModel;
  const byId = id => document.getElementById(id);
  const feedback = byId('prediction-feedback');
  if (!Model) {
    feedback.textContent = '凸轮模型未能加载，请检查本地脚本。';
    return;
  }

  const controls = {
    rpm: byId('cam-rpm'), dwell: byId('high-dwell'), feed: byId('feed-seconds'),
    prediction: byId('window-prediction'), reveal: byId('reveal-button'),
    step: byId('step-button'), cycle: byId('cycle-button'), play: byId('play-button'),
    pause: byId('pause-button'), reset: byId('reset-button'),
    start: byId('preset-start'), fast: byId('preset-fast'), long: byId('preset-long'),
  };
  const scene = byId('cam-scene');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compact = window.matchMedia('(max-width: 640px)');
  const phaseNames = {'rise': '上升', 'high-dwell': '高位停歇', 'fall': '下降', 'low-dwell': '低位停歇'};
  let sceneView = 'mechanism';
  let revealed = false;
  let running = false;
  let totalDegrees = 0;
  let frameHandle = null;
  let previousFrame = null;

  function config() {
    return {rpm: Number(controls.rpm.value), dwellDegrees: Number(controls.dwell.value),
      feedSeconds: Number(controls.feed.value)};
  }

  function arcPoint(degrees, radius) {
    const angle = degrees * Math.PI / 180;
    return {x: 255 + radius * Math.sin(angle), y: 314 - radius * Math.cos(angle)};
  }

  function renderArc(dwellDegrees) {
    const start = arcPoint(90, 94);
    const end = arcPoint(90 + dwellDegrees, 94);
    byId('high-arc').setAttribute('d', `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A 94 94 0 0 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`);
  }

  function renderCurve(values) {
    const points = [];
    for (let degrees = 0; degrees <= 360; degrees += 3) {
      const height = Model.at(values, degrees).height;
      points.push(`${degrees === 0 ? 'M' : 'L'} ${(510 + degrees / 360 * 398).toFixed(1)} ${(260 - height * 164).toFixed(1)}`);
    }
    byId('height-curve').setAttribute('d', points.join(' '));
  }

  function renderParts(completed) {
    const holder = byId('part-tokens');
    holder.replaceChildren();
    for (let index = 0; index < Model.batchSize; index++) {
      const x = 510 + index * 65;
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', 367);
      rect.setAttribute('width', 53);
      rect.setAttribute('height', 57);
      rect.setAttribute('rx', 9);
      rect.setAttribute('fill', index < completed ? '#88d9bb' : '#345b66');
      rect.setAttribute('stroke', index < completed ? '#dcf8e9' : '#82a4ab');
      rect.setAttribute('stroke-width', 2);
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', x + 26.5);
      label.setAttribute('y', 403);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', 22);
      label.setAttribute('font-weight', 800);
      label.setAttribute('fill', index < completed ? '#123d41' : '#e3f0ed');
      label.textContent = String(index + 1);
      holder.append(rect, label);
    }
  }

  function updateSceneView() {
    const viewBox = compact.matches
      ? sceneView === 'mechanism' ? '0 0 460 500' : '480 0 450 500'
      : '0 0 960 500';
    scene.setAttribute('viewBox', viewBox);
    byId('view-mechanism').setAttribute('aria-pressed', String(sceneView === 'mechanism'));
    byId('view-chart').setAttribute('aria-pressed', String(sceneView === 'chart'));
  }

  function render() {
    const values = config();
    const state = Model.at(values, totalDegrees);
    renderArc(values.dwellDegrees);
    renderCurve(values);
    renderParts(state.completedCount);
    byId('cam-rotor').setAttribute('transform', `rotate(${state.angle.toFixed(1)} 255 314)`);
    byId('follower').setAttribute('transform', `translate(0 ${(-65 * state.height).toFixed(1)})`);
    const cursorX = (510 + state.angle / 360 * 398).toFixed(1);
    byId('phase-cursor').setAttribute('x1', cursorX);
    byId('phase-cursor').setAttribute('x2', cursorX);
    const phaseText = `${Math.floor(state.angle + 1e-9)}° · ${phaseNames[state.phase]}`;
    byId('svg-phase-label').textContent = `${phaseText} · 已转${state.attemptedCycles}圈`;
    byId('phase-copy').textContent = phaseText;
    byId('height-copy').textContent = `归一化高度 ${Math.round(state.height * 100)}%`;
    byId('batch-copy').textContent = `${state.completedCount} / ${Model.batchSize} 完成（已转${state.attemptedCycles}圈）`;
    byId('feed-time').textContent = `${values.feedSeconds.toFixed(1)} s`;
    updateSceneView();
    const viewText = compact.matches ? sceneView === 'mechanism' ? '当前显示机构视角。' : '当前显示曲线与工件视角。' : '当前显示完整图示。';
    scene.setAttribute('aria-label', `${viewText}凸轮已转${state.attemptedCycles}圈，当前${phaseText}，从动件归一化高度${Math.round(state.height * 100)}%，${state.completedCount}件工件完成，剩余${state.remainingCount}件。旋转盘仅表示相位。`);
    if (revealed) {
      byId('cycle-seconds').textContent = `${state.cycleSeconds.toFixed(2)} s`;
      byId('dwell-seconds').textContent = `${state.dwellSeconds.toFixed(2)} s`;
      byId('window-result').textContent = state.windowEnough ? '够送料' : '窗口不足';
      byId('result-explanation').textContent = `高位停歇 ${values.dwellDegrees}° ÷ 360° × 每转 ${state.cycleSeconds.toFixed(2)} s ≈ ${state.dwellSeconds.toFixed(2)} s；送料需要 ${values.feedSeconds.toFixed(1)} s。${state.windowEnough ? '在本模型内，每完整转一圈最多处理一件。' : '在本模型内，单圈窗口不足，六件演示不会记为完成。'}低位停歇为 ${state.lowDwellDegrees}°。`;
    } else {
      byId('cycle-seconds').textContent = '—';
      byId('dwell-seconds').textContent = '—';
      byId('window-result').textContent = '待预测';
      byId('result-explanation').textContent = '可以先用30 rpm、90°与0.4 s预测，再尝试60 rpm，最后把停歇角延至150°。';
    }
    updateButtons();
  }

  function updateButtons() {
    const canAdvance = revealed && totalDegrees < Model.maxDegrees;
    controls.prediction.disabled = revealed;
    controls.reveal.disabled = revealed || !controls.prediction.value;
    controls.step.disabled = !canAdvance;
    controls.cycle.disabled = !canAdvance;
    controls.play.disabled = !canAdvance || running || motion.matches;
    controls.pause.disabled = !running;
    controls.reset.disabled = totalDegrees === 0 && !running;
  }

  function pause(reason) {
    if (frameHandle !== null) window.cancelAnimationFrame(frameHandle);
    frameHandle = null;
    previousFrame = null;
    running = false;
    updateButtons();
    if (reason) byId('runtime-status').textContent = reason;
  }

  function advance(degrees) {
    totalDegrees = Math.min(Model.maxDegrees, totalDegrees + degrees);
    render();
    const state = Model.at(config(), totalDegrees);
    byId('runtime-status').textContent = state.finished
      ? `六圈演示结束：${state.completedCount} / ${Model.batchSize} 件完成。${state.windowEnough ? '每圈最多一件。' : '每圈送料窗口都不足。'}可回到0°或改条件再试。`
      : `已转${state.attemptedCycles}圈；当前${phaseNames[state.phase]}，${state.completedCount} / ${Model.batchSize} 件完成。`;
    if (state.finished) pause();
  }

  function frame(timestamp) {
    if (!running) return;
    if (previousFrame !== null) {
      const elapsedSeconds = Math.min((timestamp - previousFrame) / 1000, 0.1);
      advance(elapsedSeconds * config().rpm * 6);
      if (!running) return;
    }
    previousFrame = timestamp;
    frameHandle = window.requestAnimationFrame(frame);
  }

  function resetConditions() {
    pause();
    totalDegrees = 0;
    revealed = false;
    controls.prediction.value = '';
    feedback.textContent = '先预测高位停歇是否够完成送料，再揭晓秒数。';
    byId('runtime-status').textContent = '条件已改变；相位与工件重置。请重新预测。';
    render();
  }

  for (const select of [controls.rpm, controls.dwell, controls.feed]) select.addEventListener('change', resetConditions);
  controls.prediction.addEventListener('change', updateButtons);
  const presets = {
    start: {rpm: 30, dwellDegrees: 90, feedSeconds: 0.4},
    fast: {rpm: 60, dwellDegrees: 90, feedSeconds: 0.4},
    long: {rpm: 60, dwellDegrees: 150, feedSeconds: 0.4},
  };
  for (const [name, values] of Object.entries(presets)) controls[name].addEventListener('click', () => {
    controls.rpm.value = String(values.rpm);
    controls.dwell.value = String(values.dwellDegrees);
    controls.feed.value = String(values.feedSeconds);
    resetConditions();
  });
  controls.reveal.addEventListener('click', () => {
    if (!controls.prediction.value) return;
    revealed = true;
    const result = Model.calculate(config());
    const guessedEnough = controls.prediction.value === 'enough';
    feedback.textContent = `${guessedEnough === result.windowEnough ? '预测正确。' : '预测与本模型不符。'}高位停歇 ${result.dwellSeconds.toFixed(2)} s，送料需要 ${result.feedSeconds.toFixed(1)} s；${result.windowEnough ? '窗口足够。' : '窗口不足。'}`;
    byId('runtime-status').textContent = '结果已揭晓；可用45°或整圈步进，也可主动播放。';
    render();
  });
  controls.step.addEventListener('click', () => { pause(); advance(45); });
  controls.cycle.addEventListener('click', () => { pause(); advance(360); });
  controls.play.addEventListener('click', () => {
    if (motion.matches || !revealed || totalDegrees >= Model.maxDegrees) return;
    running = true;
    previousFrame = null;
    byId('runtime-status').textContent = '正在连续演示；可随时暂停。';
    updateButtons();
    frameHandle = window.requestAnimationFrame(frame);
  });
  controls.pause.addEventListener('click', () => pause('演示已暂停；可继续播放或单步。'));
  controls.reset.addEventListener('click', () => { pause(); totalDegrees = 0; render(); byId('runtime-status').textContent = '已回到0°，保留本次预测，可再次步进。'; });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause('页面隐藏，演示已暂停。'); });
  motion.addEventListener('change', () => {
    if (motion.matches) pause('已启用减少动态；请用步进观察。');
    else updateButtons();
  });
  compact.addEventListener('change', render);
  for (const [name, view] of [['view-mechanism', 'mechanism'], ['view-chart', 'chart']]) {
    byId(name).addEventListener('click', () => { sceneView = view; render(); });
  }

  for (const control of [controls.rpm, controls.dwell, controls.feed, controls.prediction,
    controls.start, controls.fast, controls.long]) control.disabled = false;
  feedback.textContent = '先预测高位停歇是否够完成送料，再揭晓秒数。';
  render();
})();
