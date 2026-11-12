(function () {
  'use strict';
  const Model = window.SliderCrankModel;
  const origin = {x: 80, y: 120};
  const fields = {radius: document.getElementById('crank-radius'), rodLength: document.getElementById('rod-length'), rpm: document.getElementById('input-rpm'), angle: document.getElementById('crank-angle')};
  const svg = document.getElementById('mechanism-svg');
  const status = document.getElementById('motion-status');
  const startButton = document.getElementById('start-motion');
  const pauseButton = document.getElementById('pause-motion');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let parameters = {...Model.defaults};
  let running = false, frameId = null, lastTimestamp = null, generation = 0;

  function put(id, value) {
    const node = document.getElementById(id), text = String(value);
    if (node.textContent !== text) node.textContent = text;
  }
  function fixed(value) { return (Math.abs(value) < .000001 ? 0 : value).toFixed(2); }
  function attributes(id, values) {
    const node = document.getElementById(id);
    for (const [name, value] of Object.entries(values)) node.setAttribute(name, String(value));
  }
  function renderButtons() {
    if (startButton.disabled !== running) startButton.disabled = running;
    if (pauseButton.disabled !== !running) pauseButton.disabled = !running;
    if (svg.dataset.running !== String(running)) svg.dataset.running = String(running);
    if (status.dataset.running !== String(running)) status.dataset.running = String(running);
  }

  function render() {
    const pose = Model.position(parameters);
    const a = {x: origin.x + pose.crankX, y: origin.y - pose.crankY};
    const b = {x: origin.x + pose.x, y: origin.y};
    const outer = origin.x + parameters.radius + parameters.rodLength;
    const inner = outer - pose.stroke;
    svg.dataset.angle = String(parameters.angle); svg.dataset.radius = String(parameters.radius); svg.dataset.rodLength = String(parameters.rodLength);
    attributes('crank-arm', {x1: origin.x, y1: origin.y, x2: a.x, y2: a.y});
    attributes('connecting-rod', {x1: a.x, y1: a.y, x2: b.x, y2: b.y});
    attributes('crank-pin', {cx: a.x, cy: a.y}); attributes('slider-pin', {cx: b.x, cy: b.y});
    attributes('crank-orbit', {r: parameters.radius}); attributes('slider-block', {x: b.x - 13});
    attributes('slider-groove', {d: `M${b.x - 9} 109V131M${b.x + 9} 109V131`});
    attributes('crank-pin-label', {x: a.x + 6, y: a.y - 8}); attributes('slider-pin-label', {x: b.x + 14, y: b.y + 5});
    attributes('radius-label', {x: (origin.x + a.x) / 2 - 7, y: (origin.y + a.y) / 2 - 11});
    attributes('rod-label', {x: (a.x + b.x) / 2, y: 54});
    attributes('rod-label-leader', {x1: (a.x + b.x) / 2, y1: 60, x2: (a.x + b.x) / 2, y2: (a.y + b.y) / 2});
    put('radius-label', `r = ${parameters.radius}`); put('rod-label', `l = ${parameters.rodLength}`);
    attributes('inner-stop', {x1: inner, x2: inner}); attributes('outer-stop', {x1: outer, x2: outer});
    attributes('inner-stop-label', {x: inner}); attributes('outer-stop-label', {x: outer});
    attributes('stroke-dimension', {x1: inner, x2: outer}); attributes('stroke-extensions', {d: `M${inner} 145V204M${outer} 145V204`});
    attributes('stroke-label', {x: (inner + outer) / 2}); put('stroke-label', `一程 ${pose.stroke} mm`);
    const phase = parameters.angle % 360, radians = phase * Math.PI / 180;
    const arc = phase === 0 ? '' : `M${origin.x + 19} ${origin.y}A19 19 0 ${phase > 180 ? 1 : 0} 0 ${origin.x + 19 * Math.cos(radians)} ${origin.y - 19 * Math.sin(radians)}`;
    attributes('angle-arc', {d: arc}); put('theta-label', `θ = ${fixed(parameters.angle)}°`);
    put('position-value', fixed(pose.x)); put('displacement-value', fixed(pose.displacement));
    put('stroke-value', pose.stroke); put('travel-value', pose.travel);
    put('radius-control-value', parameters.radius); put('rod-control-value', parameters.rodLength); put('rpm-control-value', parameters.rpm); put('angle-value', fixed(parameters.angle));
    for (const [key, input] of Object.entries(fields)) {
      const controlValue = key === 'angle' ? Math.round(parameters.angle) : parameters[key];
      if (Number(input.value) !== controlValue) input.value = String(controlValue);
    }
    fields.radius.setAttribute('aria-valuetext', `${parameters.radius} 毫米`);
    fields.rodLength.setAttribute('aria-valuetext', `${parameters.rodLength} 毫米`);
    fields.rpm.setAttribute('aria-valuetext', `${parameters.rpm} 转每分钟`);
    fields.angle.setAttribute('aria-valuetext', `${fixed(parameters.angle)} 度`);
    put('mechanism-description', `固定铰点 O，曲柄端 A，滑块铰点 B。半径 ${parameters.radius} 毫米，连杆 ${parameters.rodLength} 毫米；当前角度 ${fixed(parameters.angle)} 度。A 的数学坐标为 ${fixed(pose.crankX)}、${fixed(pose.crankY)} 毫米；B 沿导轨，距 O ${fixed(pose.x)} 毫米，从外止点向内位移 ${fixed(pose.displacement)} 毫米。一程 ${pose.stroke} 毫米，整圈往返 ${pose.travel} 毫米。`);
    renderButtons();
  }

  function announce(message) {
    if (running) { put('motion-status', message); return; }
    const pose = Model.position(parameters);
    put('motion-status', `${message} 当前角度 ${fixed(parameters.angle)}°，从外止点位移 ${fixed(pose.displacement)} mm。`);
  }
  function stop() {
    generation++; running = false;
    if (frameId !== null) window.cancelAnimationFrame(frameId);
    frameId = null; lastTimestamp = null;
    renderButtons();
  }
  function pauseForEvent(reason) {
    const wasRunning = running;
    stop();
    if (wasRunning) announce(`${reason}，已暂停；不会自动恢复。`);
  }
  function frame(timestamp, token) {
    if (!running || token !== generation) return;
    frameId = null;
    if (document.hidden) { pauseForEvent('页面已进入后台'); return; }
    if (lastTimestamp !== null) {
      const seconds = Math.max(0, (timestamp - lastTimestamp) / 1000);
      parameters.angle = Model.advanceAngle(parameters.angle, parameters.rpm, seconds);
      render();
    }
    lastTimestamp = timestamp;
    frameId = window.requestAnimationFrame(next => frame(next, token));
  }

  startButton.addEventListener('click', () => {
    if (running) return;
    if (document.hidden) { announce('页面在后台，保持暂停；返回页面后可主动开始。'); return; }
    running = true; lastTimestamp = window.performance.now(); const token = ++generation;
    renderButtons(); announce(`已开始运动，以 ${parameters.rpm} rpm 匀速驱动曲柄。暂停后可逐项读取当前位置。`);
    frameId = window.requestAnimationFrame(timestamp => frame(timestamp, token));
  });
  pauseButton.addEventListener('click', () => { stop(); announce('已手动暂停。'); });
  document.getElementById('step-motion').addEventListener('click', () => {
    stop(); parameters.angle = Model.advanceAngle(parameters.angle, parameters.rpm, 15 / (6 * parameters.rpm)); render(); announce('已步进 15°，保持暂停。');
  });
  document.getElementById('reset-motion').addEventListener('click', () => {
    stop(); parameters = {...Model.defaults}; render(); announce('已恢复默认 40 / 140 mm、30 rpm、0°，保持暂停。');
  });
  function editParameter(key) {
    stop();
    parameters = Model.validateParameters({...parameters, [key]: Number(fields[key].value)});
    render(); announce('参数已更新，保持暂停。');
  }
  for (const [key, input] of Object.entries(fields)) {
    input.addEventListener('input', () => editParameter(key));
    input.addEventListener('change', () => editParameter(key));
  }
  for (const [id, length] of [['preset-short-rod', 100], ['preset-long-rod', 200]]) {
    document.getElementById(id).addEventListener('click', () => {
      stop(); parameters.rodLength = length; render(); announce(`已将连杆设为 ${length} mm，保留半径、角度和转速，保持暂停。`);
    });
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseForEvent('页面已进入后台'); });
  window.addEventListener('pagehide', () => pauseForEvent('离开页面时自动停止'));
  window.addEventListener('beforeunload', () => pauseForEvent('离开页面时自动停止'));
  preference.addEventListener('change', () => pauseForEvent('减少动态效果偏好已变化'));
  render();
})();
