(function () {
  'use strict';

  const Model = window.HighIotFeedbackControlModel;
  const subject = 'computer';
  const stage = 'high';
  const slug = 'iot-feedback-control';
  const get = id => document.getElementById(id);
  const actionNames = {fan: '开风扇', heater: '开加热器', idle: '暂停动作'};
  const done = {comparison: false, deployment: false, autonomy: false};
  const deploymentCases = new Set();
  let comparison = null;
  let visibleRounds = 0;
  let predictionReady = false;
  let trial = null;
  let pendingSave = false;
  let historicalCompletion = false;
  let saveNotice = '';

  function feedback(id, message, kind = '') {
    const node = get(id);
    node.textContent = message;
    node.classList.remove('success', 'error', 'warning');
    if (kind) node.classList.add(kind);
  }

  function selectedRadio(name) {
    const item = document.querySelector(`input[name="${name}"]:checked`);
    return item ? item.value : '';
  }

  function currentTarget() { return Number(get('target-temperature').value); }

  function arrangeDeploymentPath(architecture) {
    const path = get('deployment-path');
    const order = architecture === 'cloud'
      ? ['path-sensor', 'path-network', 'path-controller', 'path-actuator']
      : ['path-sensor', 'path-controller', 'path-actuator', 'path-network'];
    for (const id of order) path.append(get(id));
  }

  function renderProgress() {
    const labels = {
      comparison: '预测并比较两种控制方案',
      deployment: '对照本地与云端断网路径',
      autonomy: '判断自主可控所需证据'
    };
    for (const [key, label] of Object.entries(labels)) {
      const item = document.querySelector(`[data-step="${key}"]`);
      item.textContent = `${done[key] ? '✓ 已完成' : '○ 待完成'} · ${label}`;
      item.dataset.done = String(done[key]);
    }

    if (pendingSave) {
      feedback('progress-status', '本轮任务已完成，但本机进度未能保存。修复浏览器存储后可重试；损坏的原始记录不会自动覆盖。', 'warning');
      get('retry-save').hidden = false;
    } else if (saveNotice) {
      feedback('progress-status', saveNotice, 'success');
      get('retry-save').hidden = true;
    } else if (historicalCompletion) {
      feedback('progress-status', '本机已有此主题的完成记录；仍可调整模型继续探索。', 'success');
      get('retry-save').hidden = true;
    } else {
      let progress;
      try { progress = window.SubjectProgress.read(subject, stage); }
      catch (_) { progress = null; }
      feedback('progress-status', progress === null
        ? '本机进度暂不可用；实验仍可继续，完成后可修复存储再试。'
        : '完成三项任务后保存本机进度。');
      get('retry-save').hidden = true;
    }
  }

  function saveCompletion() {
    if (!Object.values(done).every(Boolean)) return;
    let saved = false;
    try { saved = window.SubjectProgress.markComplete(subject, stage, slug) === true; }
    catch (_) { saved = false; }
    pendingSave = !saved;
    if (saved) {
      historicalCompletion = true;
      saveNotice = '三项任务已完成，已保存本机学习进度。';
    } else {
      saveNotice = '';
    }
    renderProgress();
  }

  function maybeComplete() {
    if (Object.values(done).every(Boolean) && !historicalCompletion) saveCompletion();
    else renderProgress();
  }

  function resetDeploymentResult({resetCases = false} = {}) {
    trial = null;
    done.deployment = resetCases ? false : done.deployment;
    if (resetCases) deploymentCases.clear();
    document.querySelectorAll('input[name="deployment-prediction"]').forEach(input => { input.checked = false; });
    get('path-sensor').dataset.state = '';
    get('path-controller').dataset.state = '';
    get('path-actuator').dataset.state = '';
    get('path-network').dataset.state = '';
    get('deployment-outcome').textContent = '等待预测并模拟。';
    const network = get('network-state').value;
    const architecture = get('architecture').value;
    arrangeDeploymentPath(architecture);
    get('deployment-path').dataset.architecture = architecture;
    get('deployment-path').setAttribute('aria-label', architecture === 'local'
      ? '本地控制路径：传感器到本地控制器再到执行器；网络连接为控制旁路。'
      : '云端控制路径：传感器经网络到云端控制器，再到执行器。');
    get('path-network').querySelector('span').textContent = architecture === 'local'
      ? `${network === 'online' ? '联网' : '断网'}（控制旁路）`
      : network === 'online' ? '联网，命令待模拟' : '断网，命令不可达';
    get('path-network').dataset.state = architecture === 'local' ? 'bypassed' : '';
    get('path-controller').querySelector('span').textContent = architecture === 'local' ? '本地规则' : '云端服务';
    get('deployment-boundary').textContent = '断网行为由此模型预先定义，不能推及所有物联网系统。';
    feedback('deployment-status', '选择架构与网络状态，再作预测。');
    renderProgress();
  }

  function resetComparison({clearDeploymentCases = true} = {}) {
    comparison = null;
    visibleRounds = 0;
    predictionReady = false;
    done.comparison = false;
    document.querySelectorAll('input[name="comparison-prediction"]').forEach(input => { input.checked = false; });
    get('scheduled-trace').replaceChildren();
    get('feedback-trace').replaceChildren();
    get('deviation-summary').hidden = true;
    get('next-round').disabled = true;
    get('run-rest').disabled = true;
    feedback('prediction-status', '先选择预测结果。');
    feedback('comparison-status', '正确预测后可逐轮查看两个系统。');
    if (clearDeploymentCases) resetDeploymentResult({resetCases: true});
    else renderProgress();
  }

  function expectedComparison(config) {
    if (config.scheduled.totalDeviation === config.feedback.totalDeviation) return 'tie';
    return config.scheduled.totalDeviation < config.feedback.totalDeviation ? 'scheduled' : 'feedback';
  }

  function checkPrediction() {
    const prediction = selectedRadio('comparison-prediction');
    if (!prediction) {
      feedback('prediction-status', '先选择固定时序、传感反馈或两者接近。', 'warning');
      return;
    }
    comparison = null;
    visibleRounds = 0;
    predictionReady = false;
    done.comparison = false;
    get('scheduled-trace').replaceChildren();
    get('feedback-trace').replaceChildren();
    get('deviation-summary').hidden = true;
    get('next-round').disabled = true;
    get('run-rest').disabled = true;
    feedback('comparison-status', '正确预测后可逐轮查看两个系统。');

    const candidate = Model.runComparison({target: currentTarget(), scenario: get('scenario').value});
    if (prediction !== expectedComparison(candidate)) {
      comparison = null;
      feedback('prediction-status', '预测不符。先检查扰动是否改变传感器读数，以及固定时序是否读取了这次变化。', 'error');
      renderProgress();
      return;
    }
    comparison = candidate;
    predictionReady = true;
    feedback('prediction-status', '预测符合这组模型输入。逐轮比较两个控制方案。', 'success');
    get('next-round').disabled = false;
    get('run-rest').disabled = false;
    renderComparison();
  }

  function renderTraceRow(step, strategy) {
    const item = document.createElement('li');
    const disturbance = step.disturbance === 0 ? '无额外扰动' : `环境增加 ${step.disturbance}`;
    const label = strategy === 'scheduled' ? '固定时序' : '传感反馈';
    item.textContent = `第 ${step.round} 轮：开始 ${step.before}，${disturbance}，传感读数 ${step.measured}；${label} ${actionNames[step.action]}；结果 ${step.after}，距目标 ${step.deviation}。`;
    return item;
  }

  function renderComparison() {
    if (!comparison || !predictionReady) return;
    const shown = visibleRounds;
    get('scheduled-trace').replaceChildren(...comparison.scheduled.trace.slice(0, shown).map(step => renderTraceRow(step, 'scheduled')));
    get('feedback-trace').replaceChildren(...comparison.feedback.trace.slice(0, shown).map(step => renderTraceRow(step, 'feedback')));
    if (shown < comparison.scheduled.trace.length) {
      get('next-round').disabled = false;
      get('run-rest').disabled = false;
      get('comparison-status').textContent = `已显示 ${shown}/${comparison.scheduled.trace.length} 轮。`;
      return;
    }

    const maximum = Math.max(1, comparison.scheduled.totalDeviation, comparison.feedback.totalDeviation);
    get('scheduled-score').textContent = `${comparison.scheduled.totalDeviation} 温度单位`;
    get('feedback-score').textContent = `${comparison.feedback.totalDeviation} 温度单位`;
    get('scheduled-fill').style.width = `${comparison.scheduled.totalDeviation / maximum * 100}%`;
    get('feedback-fill').style.width = `${comparison.feedback.totalDeviation / maximum * 100}%`;
    get('deviation-summary').hidden = false;
    get('next-round').disabled = true;
    get('run-rest').disabled = true;
    done.comparison = true;
    feedback('comparison-status', `五轮已完成。终值：固定时序 ${comparison.scheduled.finalTemperature}，传感反馈 ${comparison.feedback.finalTemperature}。偏差合计仅描述本组固定模型。`, 'success');
    maybeComplete();
  }

  function revealNext() {
    if (!predictionReady || !comparison) return;
    visibleRounds = Math.min(comparison.scheduled.trace.length, visibleRounds + 1);
    renderComparison();
  }

  function revealRest() {
    if (!predictionReady || !comparison) return;
    visibleRounds = comparison.scheduled.trace.length;
    renderComparison();
  }

  function renderDeployment() {
    if (!trial) return;
    const architecture = trial.architecture;
    const network = trial.networkAvailable;
    arrangeDeploymentPath(architecture);
    get('deployment-path').dataset.architecture = architecture;
    get('deployment-path').setAttribute('aria-label', architecture === 'local'
      ? '本地控制路径：传感器到本地控制器再到执行器；网络连接为控制旁路。'
      : '云端控制路径：传感器经网络到云端控制器，再到执行器。');
    get('path-sensor').dataset.state = 'active';
    get('path-sensor').querySelector('span').textContent = `当前读数 ${trial.temperature}`;
    get('path-network').querySelector('span').textContent = architecture === 'local'
      ? `${network ? '联网' : '断网'}（控制旁路）`
      : network ? '联网，命令可达' : '断网，命令不可达';
    get('path-controller').querySelector('span').textContent = trial.decisionSource === 'fallback'
      ? '云端不可达，进入静止回退'
      : architecture === 'local' ? '本地反馈规则' : '收到云端决定';
    get('path-controller').dataset.state = trial.decisionIssued ? 'active' : 'unavailable';
    get('path-network').dataset.state = architecture === 'local'
      ? 'bypassed' : network ? 'active' : 'unavailable';
    get('path-actuator').querySelector('span').textContent = `${actionNames[trial.action]}；温度 ${trial.temperature} → ${trial.after}`;
    get('path-actuator').dataset.state = trial.decisionIssued ? 'active' : 'unavailable';
    get('deployment-outcome').textContent = trial.decisionIssued
      ? `${architecture === 'local' ? '本地' : '云端'}控制器作出${actionNames[trial.action]}决定，模型温度变化为 ${trial.temperature} → ${trial.after}。`
      : `云端命令路径不可达；本例按预设回退暂停动作，温度保持 ${trial.after}。`;
    get('deployment-boundary').textContent = architecture === 'local'
      ? '本例本地规则无需网络即可决策；是否另行上传数据、设备供电与软件更新均未建模。'
      : network
        ? '本例需要网络传递云端决策；实际系统可能增加缓存或本地冗余。'
        : '本例把云端失联后的动作设为暂停；这是本例的回退设计，现实系统策略可能不同。';
  }

  function checkDeployment() {
    const prediction = selectedRadio('deployment-prediction');
    if (!prediction) {
      feedback('deployment-status', '先预测是否会作出新的控制决定。', 'warning');
      return;
    }
    const architecture = get('architecture').value;
    const networkAvailable = get('network-state').value === 'online';
    trial = Model.runDeploymentTrial({architecture, networkAvailable, temperature: Model.INITIAL_TEMPERATURE, target: currentTarget()});
    const expected = trial.decisionIssued ? 'yes' : 'no';
    if (prediction !== expected) {
      resetDeploymentResult();
      feedback('deployment-status', '预测不符。区分本地决策、网络往返和断网回退后再试。', 'error');
      return;
    }
    renderDeployment();
    if (!networkAvailable && (architecture === 'local' || architecture === 'cloud')) {
      deploymentCases.add(`${architecture}-offline`);
    }
    done.deployment = deploymentCases.has('local-offline') && deploymentCases.has('cloud-offline');
    feedback('deployment-status', done.deployment
      ? '本地与云端断网路径均已对照。可以比较：本例的本地回路仍决策，云端路径使用静止回退。'
      : `已验证${architecture === 'local' ? '本地控制器' : '云端控制器'}在${networkAvailable ? '联网' : '断网'}时的本例路径；还需分别验证本地和云端断网。`, 'success');
    maybeComplete();
  }

  function checkAutonomy() {
    const judgement = selectedRadio('autonomy-judgement');
    if (!judgement) {
      feedback('autonomy-status', '先选择一项判断。', 'warning');
      return;
    }
    done.autonomy = judgement === 'evidence';
    if (done.autonomy) {
      feedback('autonomy-status', '判断正确。离线行为只是一个运行证据；设备、软件、更新、数据、权限和维护仍需分别核查。', 'success');
      maybeComplete();
    } else {
      feedback('autonomy-status', '这个说法把本例或一种部署方式推广成普遍结论。请依据具体组件和失效策略判断。', 'error');
      renderProgress();
    }
  }

  get('check-prediction').addEventListener('click', checkPrediction);
  get('next-round').addEventListener('click', revealNext);
  get('run-rest').addEventListener('click', revealRest);
  get('scenario').addEventListener('change', () => resetComparison());
  get('target-temperature').addEventListener('change', () => resetComparison());
  get('architecture').addEventListener('change', () => resetDeploymentResult());
  get('network-state').addEventListener('change', () => resetDeploymentResult());
  get('run-deployment').addEventListener('click', checkDeployment);
  get('check-autonomy').addEventListener('click', checkAutonomy);
  get('retry-save').addEventListener('click', saveCompletion);

  const stored = window.SubjectProgress.read(subject, stage);
  historicalCompletion = stored !== null && stored[slug] === true;
  get('deployment-path').dataset.architecture = 'local';
  get('deployment-path').setAttribute('aria-label', '本地控制路径：传感器到本地控制器再到执行器；网络连接为控制旁路。');
  get('path-network').dataset.state = 'bypassed';
  get('path-network').querySelector('span').textContent = '断网（控制旁路）';
  get('path-controller').querySelector('span').textContent = '本地规则';
  renderProgress();
})();
