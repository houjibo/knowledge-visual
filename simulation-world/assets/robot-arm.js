(function () {
  'use strict';
  const Model = window.RobotArmModel;
  const svg = document.getElementById('arm-svg');
  const input = {
    l1: document.getElementById('first-length'),
    l2: document.getElementById('second-length'),
    shoulder: document.getElementById('shoulder-angle'),
    elbow: document.getElementById('elbow-angle'),
    targetX: document.getElementById('target-x'),
    targetY: document.getElementById('target-y')
  };
  const predictionInput = document.getElementById('prediction-select');
  const predictionStatus = document.getElementById('prediction-status');
  const actionStatus = document.getElementById('action-status');
  const showButton = document.getElementById('show-pose');
  const flipButton = document.getElementById('flip-pose');
  let parameters = {...Model.defaults};
  let predictionChecked = false;
  let poseShown = false;
  let branch = 1;
  let pointerId = null;

  function fixed(value) {
    return (Math.abs(value) < .05 ? 0 : value).toFixed(1);
  }
  function setText(id, value) {
    const node = document.getElementById(id), next = String(value);
    if (node.textContent !== next) node.textContent = next;
  }
  function setAttributes(id, attributes) {
    const node = document.getElementById(id);
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, String(value));
  }
  function clearPrediction() {
    predictionChecked = false;
    poseShown = false;
    branch = 1;
    predictionInput.value = '';
  }
  function render() {
    const pose = Model.pose(parameters);
    const reach = Model.reachability(parameters);
    const point = (x, y) => ({x: 220 + x, y: 220 - y});
    const a = point(pose.elbowX, pose.elbowY), b = point(pose.x, pose.y);
    const target = point(parameters.targetX, parameters.targetY);
    svg.dataset.tipX = fixed(pose.x);
    svg.dataset.tipY = fixed(pose.y);
    svg.dataset.targetX = String(parameters.targetX);
    svg.dataset.targetY = String(parameters.targetY);
    setAttributes('first-link', {x2: a.x, y2: a.y});
    setAttributes('second-link', {x1: a.x, y1: a.y, x2: b.x, y2: b.y});
    setAttributes('elbow-joint', {cx: a.x, cy: a.y});
    setAttributes('tip-joint', {cx: b.x, cy: b.y});
    setAttributes('target-ring', {cx: target.x, cy: target.y});
    setAttributes('target-cross', {d: `M${target.x - 7} ${target.y}H${target.x + 7}M${target.x} ${target.y - 7}V${target.y + 7}`});
    setAttributes('elbow-label', {x: a.x + 11, y: a.y - 9});
    setAttributes('tip-label', {x: b.x + 11, y: b.y - 9});
    setAttributes('target-label', {x: target.x + 15, y: target.y - 8});
    setAttributes('outer-disc', {r: reach.outer});
    setAttributes('inner-hole', {r: reach.inner});
    setText('elbow-position', `(${fixed(pose.elbowX)}, ${fixed(pose.elbowY)})`);
    setText('tip-position', `(${fixed(pose.x)}, ${fixed(pose.y)})`);
    setText('tip-distance', fixed(Math.hypot(pose.x - parameters.targetX, pose.y - parameters.targetY)));
    setText('inner-radius', `${fixed(reach.inner)} mm`);
    setText('outer-radius', `${fixed(reach.outer)} mm`);
    setText('target-radius', `${fixed(reach.distance)} mm`);
    setText('arm-description', `二维两连杆机械臂。基座 O 在(0,0)毫米，肘点 A 在(${fixed(pose.elbowX)},${fixed(pose.elbowY)})毫米，末端 B 在(${fixed(pose.x)},${fixed(pose.y)})毫米。目标 T 在(${parameters.targetX},${parameters.targetY})毫米，距基座${fixed(reach.distance)}毫米。当前可达环带内边界${fixed(reach.inner)}毫米、外边界${fixed(reach.outer)}毫米。`);
    for (const [key, control] of Object.entries(input)) {
      if (Number(control.value) !== parameters[key]) control.value = String(parameters[key]);
    }
    setText('first-length-value', `${parameters.l1} mm`);
    setText('second-length-value', `${parameters.l2} mm`);
    setText('shoulder-value', `${fixed(parameters.shoulder)}°`);
    setText('elbow-value', `${fixed(parameters.elbow)}°`);
    for (const key of ['l1', 'l2', 'shoulder', 'elbow']) {
      const label = key === 'l1' || key === 'l2' ? `${fixed(parameters[key])} 毫米` : `${fixed(parameters[key])} 度`;
      input[key].setAttribute('aria-valuetext', label);
    }
    if (predictionChecked) {
      const correct = predictionInput.value === (reach.reachable ? 'reachable' : 'unreachable');
      predictionStatus.dataset.result = correct ? 'correct' : 'wrong';
      predictionStatus.textContent = `${correct ? '预测正确。' : '这次未猜对。'}目标距基座 ${fixed(reach.distance)} mm；可达范围从 ${fixed(reach.inner)} 到 ${fixed(reach.outer)} mm，${reach.reachable ? '目标在环带内' : '目标在环带外'}。`;
    } else {
      predictionStatus.dataset.result = 'idle';
      predictionStatus.textContent = '选择目标和判断，再检验。';
    }
    showButton.disabled = !predictionChecked || !reach.reachable;
    flipButton.disabled = !poseShown || reach.distance <= reach.inner + 1e-6 || reach.distance >= reach.outer - 1e-6;
  }
  function update(key, raw) {
    if (String(raw).trim() === '') {
      render();
      actionStatus.textContent = '请输入控件范围内的有限数值。';
      return;
    }
    const next = {...parameters, [key]: Number(raw)};
    try {
      parameters = Model.validate(next);
    } catch (_) {
      render();
      actionStatus.textContent = '请输入控件范围内的有限数值。';
      return;
    }
    if (key === 'l1' || key === 'l2' || key === 'targetX' || key === 'targetY') clearPrediction();
    else poseShown = false;
    render();
    actionStatus.textContent = key === 'targetX' || key === 'targetY'
      ? '目标已移动；请重新预测是否可达。' : '机械臂已更新；观察肘点、末端与环带。';
  }
  for (const key of ['l1', 'l2', 'shoulder', 'elbow']) {
    input[key].addEventListener('input', () => update(key, input[key].value));
  }
  for (const key of ['targetX', 'targetY']) {
    input[key].addEventListener('change', () => update(key, input[key].value));
  }
  predictionInput.addEventListener('change', () => {
    predictionChecked = false;
    poseShown = false;
    render();
    actionStatus.textContent = '判断已更改；请重新检验预测。';
  });
  for (const [id, x, y] of [['target-near', 120, 40], ['target-far', 180, 0], ['target-inner', 0, 10]]) {
    document.getElementById(id).addEventListener('click', () => {
      parameters = {...parameters, targetX: x, targetY: y};
      clearPrediction(); render();
      actionStatus.textContent = `目标已设为 (${x}, ${y}) mm；请重新预测。`;
    });
  }
  document.getElementById('check-prediction').addEventListener('click', () => {
    if (!predictionInput.value) {
      actionStatus.textContent = '请先选择“可达”或“不可达”。';
      predictionInput.focus();
      return;
    }
    predictionChecked = true;
    render();
    actionStatus.textContent = Model.reachability(parameters).reachable
      ? '可以查看一组关节姿态，再试另一种肘向。' : '当前长度无法到达这个目标；试着改变杆长。';
  });
  function showPose(nextBranch) {
    if (!predictionChecked) return;
    const solution = Model.solve(parameters, nextBranch);
    if (!solution) return;
    branch = nextBranch;
    parameters = {...parameters, shoulder: Math.round(solution.shoulder * 10) / 10,
      elbow: Math.round(solution.elbow * 10) / 10};
    poseShown = true;
    render();
    actionStatus.textContent = `已转到目标附近：肘向${branch === 1 ? '一' : '二'}；取 0.1° 刻度，末端到目标 ${fixed(Math.hypot(Model.pose(parameters).x - parameters.targetX, Model.pose(parameters).y - parameters.targetY))} mm。`;
  }
  showButton.addEventListener('click', () => showPose(1));
  flipButton.addEventListener('click', () => showPose(-branch));
  document.getElementById('reset-arm').addEventListener('click', () => {
    parameters = {...Model.defaults};
    clearPrediction(); render();
    actionStatus.textContent = '已恢复默认杆长、角度和目标。';
  });
  function updatePointerTarget(event) {
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const point = svg.createSVGPoint();
    point.x = event.clientX; point.y = event.clientY;
    const local = point.matrixTransform(matrix.inverse());
    parameters = {...parameters, targetX: Math.max(-200, Math.min(200, Math.round(local.x - 220))),
      targetY: Math.max(-200, Math.min(200, Math.round(220 - local.y)))};
    clearPrediction();
    render();
  }
  svg.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    pointerId = event.pointerId;
    svg.setPointerCapture(pointerId);
    updatePointerTarget(event);
    event.preventDefault();
  });
  svg.addEventListener('pointermove', event => {
    if (pointerId === event.pointerId) updatePointerTarget(event);
  });
  function endPointer(event) {
    if (pointerId !== event.pointerId) return;
    pointerId = null;
    if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
    actionStatus.textContent = `目标已放在 (${parameters.targetX}, ${parameters.targetY}) mm；请重新预测。`;
  }
  svg.addEventListener('pointerup', endPointer);
  svg.addEventListener('pointercancel', endPointer);
  render();
})();
