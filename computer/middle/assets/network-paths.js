(function () {
  'use strict';
  const Model = window.NetworkPathModel;
  const $ = id => document.getElementById(id);
  const positions = {S: [55, 210], A: [200, 80], B: [200, 345], C: [355, 315], D: [475, 210]};
  const challengeIds = ['normal-cost', 'normal-hops', 'bc-cost', 'exits-cost'];
  const earned = new Set();
  let revealed = false;
  let path = null;
  let stepIndex = 0;
  let predictedCorrectly = false;
  let saveFailed = false;

  function conditions() {
    return {scenario: $('scenario').value, rule: $('route-rule').value, disabled: Model.SCENARIOS[$('scenario').value]};
  }

  function challengeKey() {
    const {scenario, rule} = conditions();
    return `${scenario}-${rule}`;
  }

  function report(message, kind) {
    $('prediction-status').textContent = message;
    $('prediction-status').className = `feedback ${kind || ''}`;
  }

  function renderMap() {
    const {disabled} = conditions();
    const current = revealed && path ? path.nodes[stepIndex] : 'S';
    const used = revealed && path ? path.edges.slice(0, stepIndex) : [];
    document.querySelectorAll('[data-edge]').forEach(group => {
      const id = group.dataset.edge;
      group.classList.toggle('disabled', disabled.includes(id));
      group.classList.toggle('route', !!(revealed && path && path.edges.includes(id)));
      group.classList.toggle('traversed', used.includes(id));
    });
    document.querySelectorAll('[data-node]').forEach(group => {
      group.classList.toggle('current', group.dataset.node === current);
    });
    const [x, y] = positions[current];
    $('packet-ring').setAttribute('cx', String(x));
    $('packet-ring').setAttribute('cy', String(y));
    const broken = disabled.length ? `断开的连线：${disabled.map(id => `${id[0]}—${id[1]}`).join('、')}。` : '当前六条连线可用。';
    $('links-status').textContent = broken;
    const routeText = revealed ? path ? `所选路径 ${path.nodes.join('→')}，当前位置 ${current}。` : '终点 D 不可达。' : '路径尚未揭晓。';
    $('network-map').setAttribute('aria-label', `教学网络图。${broken}${routeText}`);
  }

  function renderProgress() {
    challengeIds.forEach(id => { $(`challenge-${id}`).textContent = earned.has(id) ? '✓ 本轮已完成' : '○ 待完成'; });
    const stored = window.SubjectProgress.read('computer', 'middle');
    const saved = stored !== null && stored['network-paths'] === true;
    if (saved) {
      $('progress-status').textContent = '本机已记录完成数据包路径主题。';
      $('retry-save').hidden = true;
    } else if (earned.size === challengeIds.length) {
      $('progress-status').textContent = saveFailed || stored === null
        ? '四项对照已完成，但本机进度未能保存；可重试保存。'
        : '四项对照已完成，正在保存本机进度…';
      $('retry-save').hidden = false;
    } else {
      $('progress-status').textContent = stored === null
        ? `本机进度暂不可用；仍可继续实验。本轮已完成 ${earned.size}/4 项。`
        : `本轮已完成 ${earned.size}/4 项；尚未记录本主题完成。`;
      $('retry-save').hidden = true;
    }
  }

  function saveCompletion() {
    if (earned.size !== challengeIds.length) return;
    saveFailed = !window.SubjectProgress.markComplete('computer', 'middle', 'network-paths');
    renderProgress();
  }

  function awardIfEligible() {
    const key = challengeKey();
    if (!predictedCorrectly || !challengeIds.includes(key) || earned.has(key)) return;
    earned.add(key);
    renderProgress();
    if (earned.size === challengeIds.length) saveCompletion();
  }

  function renderResult() {
    $('reveal-button').disabled = revealed;
    $('first-hop-prediction').disabled = revealed;
    $('step-button').disabled = !revealed || !path || stepIndex >= path.hops;
    if (!revealed) {
      $('path-result').textContent = '尚未揭晓';
      $('cost-result').textContent = '—';
      $('hops-result').textContent = '—';
      $('step-status').textContent = '数据包标记停在 S，等待预测。';
    } else if (!path) {
      $('path-result').textContent = 'D 不可达';
      $('cost-result').textContent = '无路径';
      $('hops-result').textContent = '无路径';
      $('step-status').textContent = '两条通向 D 的连线都已断开；本模型无法从 S 到达 D。';
    } else {
      $('path-result').textContent = path.nodes.join(' → ');
      $('cost-result').textContent = String(path.cost);
      $('hops-result').textContent = String(path.hops);
      $('step-status').textContent = stepIndex === path.hops
        ? `已走完 ${path.hops} 跳，数据包标记到达 D。`
        : `当前在 ${path.nodes[stepIndex]}；已走 ${stepIndex}/${path.hops} 跳，下一站是 ${path.nodes[stepIndex + 1]}。`;
    }
    renderMap();
  }

  function resetAttempt(message) {
    revealed = false;
    path = null;
    stepIndex = 0;
    predictedCorrectly = false;
    $('first-hop-prediction').value = '';
    report(message || '已回到 S。请重新预测第一跳。');
    renderResult();
  }

  $('scenario').addEventListener('change', () => resetAttempt('线路条件已改变；旧路径已清除，请重新预测。'));
  $('route-rule').addEventListener('change', () => resetAttempt('选择规则已改变；旧路径已清除，请重新预测。'));
  $('reset-button').addEventListener('click', () => resetAttempt());
  $('reveal-button').addEventListener('click', () => {
    const prediction = $('first-hop-prediction').value;
    if (!prediction) { report('先选 A、B 或不可达，再揭晓。', 'error'); return; }
    const {disabled, rule} = conditions();
    path = Model.findPath(disabled, rule);
    revealed = true;
    stepIndex = 0;
    const answer = path ? path.firstHop : 'none';
    predictedCorrectly = prediction === answer;
    const answerText = answer === 'none' ? '无法到达 D' : `先到 ${answer}`;
    const ruleText = rule === 'cost' ? '按指定代价之和' : '按经过的连线数';
    report(`${predictedCorrectly ? '预测正确。' : '这次预测未对。'}${ruleText}，模型会${answerText}。${path ? '请逐跳观察到 D。' : '已确认本图中没有可达路径。'}`, predictedCorrectly ? 'success' : 'error');
    renderResult();
    if (!path) awardIfEligible();
  });
  $('step-button').addEventListener('click', () => {
    if (!revealed || !path || stepIndex >= path.hops) return;
    stepIndex += 1;
    renderResult();
    if (stepIndex === path.hops) awardIfEligible();
  });
  $('retry-save').addEventListener('click', saveCompletion);
  window.addEventListener('pageshow', renderProgress);
  window.addEventListener('storage', renderProgress);
  ['scenario', 'route-rule', 'first-hop-prediction', 'reveal-button', 'reset-button'].forEach(id => { $(id).disabled = false; });
  renderResult();
  renderProgress();
})();
