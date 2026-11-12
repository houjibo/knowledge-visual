(() => {
  'use strict';
  const Model = window.BeltPulleyModel;
  const byId = id => document.getElementById(id);
  const feedback = byId('prediction-feedback');
  if (!Model) {
    feedback.textContent = '传动模型未能加载，请检查本地脚本。';
    return;
  }

  const controls = {
    driverDiameter: byId('driver-diameter'), drivenDiameter: byId('driven-diameter'),
    inputRpm: byId('input-rpm'), layout: byId('layout-select'),
    speedPrediction: byId('speed-prediction'), directionPrediction: byId('direction-prediction'),
    slip: byId('slip-observed'), reveal: byId('reveal-button'), step: byId('step-button'),
    run: byId('run-button'), pause: byId('pause-button'),
  };
  const scene = byId('belt-scene');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let revealed = false;
  let running = false;
  let frameHandle = null;
  let previousFrame = null;
  let driverAngle = 0;

  function config() {
    return {
      driverDiameter: Number(controls.driverDiameter.value),
      drivenDiameter: Number(controls.drivenDiameter.value),
      inputRpm: Number(controls.inputRpm.value),
      layout: controls.layout.value,
      slipObserved: controls.slip.checked,
    };
  }

  const oneDecimal = value => value.toFixed(1);
  const threeDecimals = value => value.toFixed(3);

  function spokePath(radius) {
    const outer = Number((radius * .66).toFixed(2));
    const side = Number((radius * .52).toFixed(2));
    return `M 0 ${-outer} L 0 ${outer} M ${-side} 0 L ${side} 0`;
  }

  function renderScene() {
    const values = config();
    const result = Model.calculate(values);
    const geometry = Model.geometry(values);
    byId('belt-shadow').setAttribute('d', geometry.path);
    byId('belt-path').setAttribute('d', geometry.path);
    for (const [name, radius, center, angle] of [
      ['driver', geometry.r1, geometry.centers.driver, driverAngle],
      ['driven', geometry.r2, geometry.centers.driven,
        driverAngle * result.ratio * (result.direction === 'same' ? 1 : -1)],
    ]) {
      byId(`${name}-rotor`).setAttribute('transform',
        `translate(${center.x} ${center.y}) rotate(${oneDecimal(angle % 360)})`);
      byId(`${name}-disc`).setAttribute('r', radius);
      byId(`${name}-spokes`).setAttribute('d', spokePath(radius));
      byId(`${name}-marker`).setAttribute('cy', -Number((radius * .74).toFixed(2)));
    }
    byId('driver-caption').textContent = `${values.driverDiameter} mm · ${values.inputRpm} rpm`;
    byId('driven-caption').textContent = `${values.drivenDiameter} mm · ${revealed && !values.slipObserved ? `${oneDecimal(result.idealOutputRpm)} rpm` : values.slipObserved ? '实际需测' : '待揭晓'}`;
    const layoutName = values.layout === 'open' ? '开口' : '交叉';
    const directionName = result.direction === 'same' ? '同向 ↻' : '反向 ↺';
    byId('driven-svg-label').textContent = values.slipObserved ? '从动轮 · 实际需测' :
      revealed ? `从动轮 · ${directionName}` : '从动轮 · 等待预测';
    byId('scene-text').textContent = values.slipObserved
      ? `${layoutName}连接的静止示意。已观察到打滑，无法仅凭轮径推断实际转速；需测量从动轮。`
      : `${layoutName}连接的${revealed ? `理想运动学示意；从动轮${directionName}。` : '静止示意；先预测再揭晓。'}轮间距离不代表实机设计值。`;
    scene.setAttribute('aria-label', `${values.driverDiameter}毫米主动轮与${values.drivenDiameter}毫米从动轮由${layoutName}皮带相连。${values.slipObserved ? '已观察到打滑，实际从动轮转速需要测量。' : revealed ? `无打滑参考输出${oneDecimal(result.idealOutputRpm)}转每分钟，${result.direction === 'same' ? '同向' : '反向'}。` : '静止示意，等待预测。'}`);
  }

  function updateButtons() {
    const canMove = revealed && !controls.slip.checked;
    controls.reveal.disabled = revealed;
    controls.step.disabled = !canMove;
    controls.run.disabled = !canMove || running;
    controls.pause.disabled = !running;
    controls.slip.disabled = !revealed;
  }

  function pause(reason) {
    if (frameHandle !== null) window.cancelAnimationFrame(frameHandle);
    frameHandle = null;
    previousFrame = null;
    const wasRunning = running;
    running = false;
    updateButtons();
    if (reason && (wasRunning || reason === 'slip')) byId('runtime-status').textContent = reason;
  }

  function resetReveal() {
    pause();
    revealed = false;
    driverAngle = 0;
    controls.slip.checked = false;
    controls.speedPrediction.value = '';
    controls.directionPrediction.value = '';
    controls.speedPrediction.disabled = false;
    controls.directionPrediction.disabled = false;
    feedback.textContent = '请先选择速度关系和旋向，再揭晓。';
    byId('ideal-output').textContent = '—';
    byId('actual-output').textContent = '—';
    byId('direction-output').textContent = '—';
    byId('belt-speed').textContent = '—';
    byId('formula-text').textContent = '揭晓后查看：两轮边缘与皮带不打滑时，线速度相等。';
    byId('boundary-message').textContent = '先完成理想条件预测，再切换这一观察。这里只识别模型失效，不设定任意“打滑率”。';
    byId('runtime-status').textContent = '运动示意已暂停。揭晓后可单步或主动播放。';
    updateButtons();
    renderScene();
  }

  function updateResults() {
    const values = config();
    const result = Model.calculate(values);
    byId('ideal-output').textContent = `${oneDecimal(result.idealOutputRpm)} rpm`;
    byId('actual-output').textContent = result.actualOutputRpm === null ? '需要测量' :
      `${oneDecimal(result.actualOutputRpm)} rpm`;
    byId('direction-output').textContent = result.actualDirection === null ? '需要观察' :
      result.actualDirection === 'same' ? '同向 ↻' : '反向 ↺';
    byId('belt-speed').textContent = `${threeDecimals(result.beltSpeedMps)} m/s`;
    byId('formula-text').textContent = values.slipObserved
      ? `无打滑参考：${values.inputRpm} × ${values.driverDiameter} ÷ ${values.drivenDiameter} = ${oneDecimal(result.idealOutputRpm)} rpm。已观察到打滑，不能把参考值当作实际输出。`
      : `无打滑：两轮边缘的皮带线速度相等；输出 ${values.inputRpm} × ${values.driverDiameter} ÷ ${values.drivenDiameter} = ${oneDecimal(result.idealOutputRpm)} rpm。`;
    byId('boundary-message').textContent = values.slipObserved
      ? '无打滑等式不再给出实际转速；需测量输出。演示不假定打滑率，也不模拟张力、弹性和磨损。'
      : '当前仅为无打滑理想关系。勾选“观察到皮带打滑”可看到实际输出为何需要测量。';
    renderScene();
  }

  function reveal() {
    if (!controls.speedPrediction.value || !controls.directionPrediction.value) {
      feedback.textContent = '请先完成两项预测。';
      return;
    }
    const result = Model.calculate(config());
    const speedNames = {faster: '更快', slower: '更慢', same: '一样快'};
    const directionNames = {same: '同向', opposite: '反向'};
    const speedCorrect = controls.speedPrediction.value === result.speedTrend;
    const directionCorrect = controls.directionPrediction.value === result.direction;
    feedback.textContent = `${speedCorrect && directionCorrect ? '两项预测都正确。' : '已揭晓，可对照修正预测。'}从动轮${speedNames[result.speedTrend]}、${directionNames[result.direction]}；${speedCorrect ? '速度判断正确' : '速度判断需修正'}，${directionCorrect ? '方向判断正确' : '方向判断需修正'}。`;
    revealed = true;
    controls.speedPrediction.disabled = true;
    controls.directionPrediction.disabled = true;
    byId('runtime-status').textContent = motion.matches
      ? '已启用减少动态效果，运动示意保持暂停；可主动单步或播放。'
      : '理想结果已揭晓；可单步或主动播放。';
    updateButtons();
    updateResults();
  }

  function frame(time) {
    if (!running) return;
    if (previousFrame !== null) {
      const elapsed = Math.min((time - previousFrame) / 1000, .08);
      driverAngle += 360 * config().inputRpm / 60 * Math.max(0, elapsed);
      renderScene();
    }
    previousFrame = time;
    frameHandle = window.requestAnimationFrame(frame);
  }

  for (const control of [controls.driverDiameter, controls.drivenDiameter, controls.inputRpm,
    controls.layout, controls.speedPrediction, controls.directionPrediction]) control.disabled = false;
  controls.driverDiameter.value = String(Model.defaults.driverDiameter);
  controls.drivenDiameter.value = String(Model.defaults.drivenDiameter);
  controls.inputRpm.value = String(Model.defaults.inputRpm);
  controls.layout.value = Model.defaults.layout;
  controls.reveal.disabled = false;
  for (const name of ['reduction', 'speedup', 'equal', 'crossed']) byId(`preset-${name}`).disabled = false;
  for (const control of [controls.driverDiameter, controls.drivenDiameter, controls.inputRpm,
    controls.layout]) control.addEventListener('change', resetReveal);
  const presets = {
    reduction: {driverDiameter: 80, drivenDiameter: 160, inputRpm: 60, layout: 'open'},
    speedup: {driverDiameter: 160, drivenDiameter: 80, inputRpm: 60, layout: 'open'},
    equal: {driverDiameter: 100, drivenDiameter: 100, inputRpm: 60, layout: 'open'},
    crossed: {driverDiameter: 160, drivenDiameter: 80, inputRpm: 60, layout: 'crossed'},
  };
  for (const [name, values] of Object.entries(presets)) {
    byId(`preset-${name}`).addEventListener('click', () => {
      controls.driverDiameter.value = String(values.driverDiameter);
      controls.drivenDiameter.value = String(values.drivenDiameter);
      controls.inputRpm.value = String(values.inputRpm);
      controls.layout.value = values.layout;
      resetReveal();
    });
  }
  controls.reveal.addEventListener('click', reveal);
  controls.step.addEventListener('click', () => {
    if (!revealed || controls.slip.checked) return;
    pause();
    driverAngle += 90;
    const result = Model.calculate(config());
    byId('runtime-status').textContent = `主动轮累计前进 ${oneDecimal(driverAngle)}°；从动轮按无打滑关系累计 ${oneDecimal(Math.abs(driverAngle * result.ratio))}°，${result.direction === 'same' ? '同向' : '反向'}。`;
    renderScene();
  });
  controls.run.addEventListener('click', () => {
    if (!revealed || controls.slip.checked || running) return;
    running = true;
    previousFrame = null;
    updateButtons();
    byId('runtime-status').textContent = '理想运动示意正在播放；可随时暂停。';
    frameHandle = window.requestAnimationFrame(frame);
  });
  controls.pause.addEventListener('click', () => pause('理想运动示意已暂停。'));
  controls.slip.addEventListener('change', () => {
    pause(controls.slip.checked ? '观察到打滑，理想运动示意已停止。' : '已返回无打滑理想条件，运动示意保持暂停。');
    updateResults();
    updateButtons();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause('页面隐藏，运动示意已暂停。');
  });
  window.addEventListener('pagehide', () => pause('页面离开，运动示意已暂停。'));
  motion.addEventListener('change', () => pause('动态偏好变化，运动示意已暂停。'));
  resetReveal();
})();
