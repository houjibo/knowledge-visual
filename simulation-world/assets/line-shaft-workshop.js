(function () {
  'use strict';
  const model = window.LineShaftModel;
  const byId = id => document.getElementById(id);
  const fields = {
    shaftRpm: byId('shaft-rpm'),
    aDiameter: byId('machine-a-diameter'),
    bDiameter: byId('machine-b-diameter'),
    aEngaged: byId('machine-a-engaged'),
    bEngaged: byId('machine-b-engaged'),
  };
  const scene = byId('line-shaft-scene');
  const prediction = byId('b-prediction');
  const feedback = byId('prediction-feedback');
  const runtime = byId('runtime-status');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const relationLabel = {stopped: '停转', slower: '较慢', same: '一样快', faster: '较快'};
  let elapsed = 0;
  let revealed = false;
  let playing = false;
  let frameId = null;
  let lastStamp = null;
  let view = 'a';

  if (!model) {
    feedback.textContent = '传动模型未加载，暂时只能阅读静态说明。';
    return;
  }

  function config() {
    return {
      shaftRpm: Number(fields.shaftRpm.value),
      aDiameter: Number(fields.aDiameter.value),
      bDiameter: Number(fields.bDiameter.value),
      aEngaged: fields.aEngaged.checked,
      bEngaged: fields.bEngaged.checked,
    };
  }

  function stopPlaying() {
    if (frameId !== null) window.cancelAnimationFrame(frameId);
    frameId = null;
    lastStamp = null;
    playing = false;
  }

  function setView(next) {
    view = next;
    const narrow = window.innerWidth <= 640;
    scene.setAttribute('viewBox', narrow ? view === 'a' ? '0 0 470 430' : '420 0 440 430' : '0 0 860 430');
    byId('view-a').setAttribute('aria-pressed', String(view === 'a'));
    byId('view-b').setAttribute('aria-pressed', String(view === 'b'));
  }

  function setBranch(letter, diameter, engaged) {
    const center = letter === 'a' ? 360 : 650;
    const radius = {10: 22, 20: 34, 40: 54}[diameter];
    const wheel = byId(`machine-${letter}-wheel`);
    const spoke = byId(`machine-${letter}-spoke`);
    wheel.setAttribute('r', String(radius));
    wheel.setAttribute('fill', engaged ? '#326b74' : '#405a62');
    wheel.setAttribute('stroke', engaged ? '#b2ded7' : '#8fa5a8');
    spoke.setAttribute('y2', String(7 - radius));
    spoke.setAttribute('stroke', engaged ? '#ffdc91' : '#9baaa8');
    for (const side of ['left', 'right']) {
      const belt = byId(`belt-${letter}-${side}`);
      belt.setAttribute('x2', String(center + (side === 'left' ? -radius : radius)));
      belt.setAttribute('stroke', engaged ? '#7ee0c7' : '#8197a0');
      if (engaged) belt.removeAttribute('stroke-dasharray');
      else belt.setAttribute('stroke-dasharray', '9 10');
    }
    const label = byId(`branch-${letter}-label`);
    label.textContent = `${letter.toUpperCase()} · ${engaged ? '接合' : '未接合'}`;
    label.setAttribute('fill', engaged ? '#bdf0df' : '#f4d3ad');
  }

  function angleText(value) { return `${Number(value.toFixed(1))}°`; }

  function render() {
    const state = model.at(config(), elapsed);
    setBranch('a', state.aDiameter, state.aEngaged);
    setBranch('b', state.bDiameter, state.bEngaged);
    const shaftAngle = Number(state.shaftAngle.toFixed(1));
    const aAngle = Number(state.aAngle.toFixed(1));
    const bAngle = Number(state.bAngle.toFixed(1));
    byId('source-rotor').setAttribute('transform', `translate(95 142) rotate(${shaftAngle})`);
    byId('driver-a-rotor').setAttribute('transform', `translate(360 142) rotate(${shaftAngle})`);
    byId('driver-b-rotor').setAttribute('transform', `translate(650 142) rotate(${shaftAngle})`);
    byId('machine-a-rotor').setAttribute('transform', `translate(360 328) rotate(${aAngle})`);
    byId('machine-b-rotor').setAttribute('transform', `translate(650 328) rotate(${bAngle})`);
    scene.setAttribute('aria-label', `传动关系图：主轴 ${state.shaftRpm} rpm、累计角度 ${angleText(state.shaftAngle)}；机器 A ${state.aEngaged ? '接合' : '未接合'}、角度 ${angleText(state.aAngle)}；机器 B ${state.bEngaged ? '接合' : '未接合'}、角度 ${angleText(state.bAngle)}。`);
    byId('shaft-speed').textContent = revealed ? `${state.shaftRpm} rpm` : '—';
    byId('machine-a-speed').textContent = revealed ? `${state.aRpm} rpm` : '—';
    byId('machine-b-speed').textContent = revealed ? `${state.bRpm} rpm` : '—';
    byId('elapsed-time').textContent = `${elapsed.toFixed(2)} s`;
    byId('angle-readout').textContent = `角度：主轴 ${angleText(state.shaftAngle)}；机器 A ${angleText(state.aAngle)}；机器 B ${angleText(state.bAngle)}。`;
    if (revealed) {
      const aCopy = state.aEngaged ? `A = ${state.shaftRpm} × 20 ÷ ${state.aDiameter} = ${state.aRpm} rpm` : 'A 未接合，因此停转';
      const bCopy = state.bEngaged ? `B = ${state.shaftRpm} × 20 ÷ ${state.bDiameter} = ${state.bRpm} rpm` : 'B 未接合，因此停转';
      byId('path-explanation').textContent = `${aCopy}；${bCopy}。主轴维持 ${state.shaftRpm} rpm 是本模型的固定条件，接合第二台机器不会改变 A 的理想读数。`;
    } else {
      byId('path-explanation').textContent = '先接合机器 B，再比较 40 cm 与 10 cm 从动轮的结果；A 的转速在本模型中保持不变。';
    }
    byId('reveal-button').disabled = !prediction.value || revealed;
    byId('step-button').disabled = !revealed || state.finished;
    byId('play-button').disabled = !revealed || state.finished || playing || reducedMotion.matches || document.hidden;
    byId('pause-button').disabled = !playing;
    byId('reset-button').disabled = !revealed || (elapsed === 0 && !playing);
    if (state.finished && playing) {
      stopPlaying();
      runtime.textContent = '12 秒有限演示已结束；可复位或改变条件。';
      byId('play-button').disabled = true;
      byId('pause-button').disabled = true;
    }
  }

  function resetConditions() {
    stopPlaying();
    elapsed = 0;
    revealed = false;
    prediction.value = '';
    feedback.textContent = '条件已改变，请重新预测机器 B。';
    runtime.textContent = '模型初始暂停；揭晓后可单步或主动播放。';
    render();
  }

  function preset(values) {
    fields.shaftRpm.value = String(values.shaftRpm);
    fields.aDiameter.value = String(values.aDiameter);
    fields.bDiameter.value = String(values.bDiameter);
    fields.aEngaged.checked = values.aEngaged;
    fields.bEngaged.checked = values.bEngaged;
    resetConditions();
  }

  function frame(stamp) {
    if (!playing) return;
    if (document.hidden || reducedMotion.matches) {
      stopPlaying();
      runtime.textContent = document.hidden ? '页面已隐藏，演示自动暂停；返回后需手动继续。' : '已按减少动态偏好暂停；仍可单步观察。';
      render();
      return;
    }
    if (lastStamp !== null) elapsed = Math.min(model.maxSeconds, elapsed + Math.min((stamp - lastStamp) / 1000, 0.25));
    lastStamp = stamp;
    frameId = null;
    render();
    if (playing) frameId = window.requestAnimationFrame(frame);
  }

  for (const element of Object.values(fields)) element.addEventListener('change', resetConditions);
  prediction.addEventListener('change', () => { feedback.textContent = '预测已选择，可以揭晓传动关系。'; render(); });
  byId('preset-one').addEventListener('click', () => preset(model.defaults));
  byId('preset-two').addEventListener('click', () => preset({...model.defaults, bEngaged: true}));
  byId('preset-small').addEventListener('click', () => preset({...model.defaults, bEngaged: true, bDiameter: 10}));
  byId('reveal-button').addEventListener('click', () => {
    if (!prediction.value || revealed) return;
    const state = model.calculate(config());
    revealed = true;
    feedback.textContent = `${prediction.value === state.bRelation ? '预测正确' : '预测与理想模型不符'}：机器 B ${relationLabel[state.bRelation]}。`;
    runtime.textContent = '已揭晓；可单步或主动播放。';
    render();
  });
  byId('step-button').addEventListener('click', () => {
    if (!revealed) return;
    stopPlaying();
    elapsed = Math.min(model.maxSeconds, elapsed + model.stepSeconds);
    runtime.textContent = elapsed === model.maxSeconds ? '12 秒有限演示已结束；可复位或改变条件。' : `已单步到 ${elapsed.toFixed(2)} s。`;
    render();
  });
  byId('play-button').addEventListener('click', () => {
    if (!revealed || reducedMotion.matches || document.hidden || elapsed >= model.maxSeconds || playing) return;
    playing = true;
    lastStamp = null;
    runtime.textContent = '正在连续演示；可随时暂停。';
    frameId = window.requestAnimationFrame(frame);
    render();
  });
  byId('pause-button').addEventListener('click', () => { stopPlaying(); runtime.textContent = '已暂停；可单步或继续。'; render(); });
  byId('reset-button').addEventListener('click', () => { stopPlaying(); elapsed = 0; runtime.textContent = '已回到 0 s，可单步或主动播放。'; render(); });
  byId('view-a').addEventListener('click', () => setView('a'));
  byId('view-b').addEventListener('click', () => setView('b'));
  window.addEventListener('resize', () => setView(view));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && playing) { stopPlaying(); runtime.textContent = '页面已隐藏，演示自动暂停；返回后需手动继续。'; }
    render();
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches && playing) { stopPlaying(); runtime.textContent = '已按减少动态偏好暂停；仍可单步观察。'; }
    render();
  });

  document.querySelectorAll('[data-interactive]').forEach(element => { element.disabled = false; });
  feedback.textContent = '先预测机器 B 与主轴的转速关系，再揭晓。';
  runtime.textContent = '模型初始暂停；揭晓后可单步或主动播放。';
  setView('a');
  render();
})();
