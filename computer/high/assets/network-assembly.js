(function () {
  'use strict';
  const Model = window.HighNetworkAssemblyModel;
  const byId = id => document.getElementById(id);
  const LINK_IDS = Model.LINK_IDS;
  const progressKey = 'computer/high/network-assembly';
  const stepNames = {network: '组好网络并核验连通', prediction: '正确预测 Wi-Fi 瓶颈', wifi: '运行 Wi-Fi 接入实验', wired: '运行有线接入实验', compare: '正确比较两种接入方式'};
  const done = {network: false, prediction: false, wifi: false, wired: false, compare: false};
  let wifiResult = null;
  let wiredResult = null;
  let canReadProgress = true;

  function readConfig() {
    const connected = {};
    const capacity = {};
    for (const id of LINK_IDS) {
      connected[id] = byId(`link-${id}`).checked;
      capacity[id] = Number(byId(`rate-${id}`).value);
    }
    return {connected, capacity, laptopAccess: byId('laptop-access').value};
  }

  function formatNumber(value, digits = 2) {
    return Number(value.toFixed(digits)).toString();
  }

  function showFeedback(id, message, kind = '') {
    const el = byId(id);
    el.textContent = message;
    el.classList.remove('success', 'error', 'warning');
    if (kind) el.classList.add(kind);
  }

  function renderTopology(config) {
    for (const id of LINK_IDS) {
      const label = Model.LINKS[id].label;
      const status = config.connected[id] ? '已连接' : '已断开';
      document.querySelectorAll(`[data-link-view="${id}"]`).forEach(el => {
        el.textContent = `${label} · ${status} · ${config.capacity[id]} Mbps`;
        el.classList.toggle('disconnected', !config.connected[id]);
      });
    }
    document.querySelector('[data-route="laptop-wifi"]').classList.toggle('inactive', config.laptopAccess !== 'wifi');
    document.querySelector('[data-route="laptop-wired"]').classList.toggle('inactive', config.laptopAccess !== 'wired');
  }

  function resetExperiments(message = '链路配置已变化；请重新预测并运行两种接入实验。') {
    done.prediction = false;
    done.wifi = false;
    done.wired = false;
    done.compare = false;
    wifiResult = null;
    wiredResult = null;
    byId('bottleneck-prediction').value = '';
    byId('faster-access').value = '';
    ['desktop-wifi-result', 'desktop-wired-result', 'laptop-wifi-result', 'laptop-wired-result'].forEach(id => byId(id).textContent = '尚未运行');
    byId('wifi-bottleneck').textContent = '—';
    byId('wired-bottleneck').textContent = '—';
    byId('wifi-active-flows').textContent = '尚无模拟结果';
    byId('wired-active-flows').textContent = '尚无模拟结果';
    showFeedback('prediction-status', message);
    showFeedback('experiment-status', '先预测并核对 Wi-Fi 笔记本的瓶颈，再运行第一组。');
    showFeedback('comparison-status', '完成 Wi-Fi 与有线两次模拟后再比较。');
    renderSteps();
  }

  function renderSteps() {
    for (const [id, name] of Object.entries(stepNames)) {
      const el = document.querySelector(`[data-step="${id}"]`);
      el.textContent = `${done[id] ? '✓ 已完成' : '○ 待完成'} · ${name}`;
    }
    byId('check-prediction').disabled = !done.network || done.prediction || byId('laptop-access').value !== 'wifi';
    byId('run-wifi').disabled = !done.prediction || done.wifi || byId('laptop-access').value !== 'wifi';
    byId('run-wired').disabled = !done.wifi || done.wired || byId('laptop-access').value !== 'wired';
    byId('check-comparison').disabled = !done.wifi || !done.wired || done.compare;
  }

  function saveCompletion() {
    if (!Object.values(done).every(Boolean)) return;
    canReadProgress = window.SubjectProgress.read('computer', 'high') !== null;
    if (!canReadProgress) {
      showFeedback('progress-status', '学习任务已完成，但本机进度无法读取或保存；修复浏览器存储后可重试。', 'warning');
      byId('retry-save').hidden = false;
      return;
    }
    const saved = window.SubjectProgress.markComplete('computer', 'high', 'network-assembly');
    if (saved) {
      showFeedback('progress-status', '本机已保存：高中网络组装与带宽实验室已完成。', 'success');
      byId('retry-save').hidden = true;
    } else {
      showFeedback('progress-status', '学习任务已完成，但本机进度未能保存；页面仍可学习，修复存储后可重试。', 'warning');
      byId('retry-save').hidden = false;
    }
  }

  function updateProgressStatus() {
    const progress = window.SubjectProgress.read('computer', 'high');
    canReadProgress = progress !== null;
    if (!canReadProgress) showFeedback('progress-status', '本机学习进度暂不可用；实验仍可正常进行。', 'warning');
    else if (progress['network-assembly']) showFeedback('progress-status', '本机已记录完成；你仍可继续调整参数探索。', 'success');
  }

  function renderResultCell(target, state) {
    if (!state.reachable) {
      byId(target).textContent = `不可达（${Model.LINKS[state.failedLink].label}断开）`;
      return;
    }
    byId(target).textContent = `${formatNumber(state.throughputMbps)} Mbps · ${formatNumber(state.seconds)} 秒`;
  }

  function bottleneckNames(state) {
    return state.bottlenecks.map(id => Model.LINKS[id].label).join('、');
  }

  function runExperiment(access) {
    if (!done.prediction) return;
    const config = readConfig();
    const expectedAccess = access === 'wifi' ? 'wifi' : 'wired';
    if (config.laptopAccess !== expectedAccess) {
      showFeedback('experiment-status', `请先将笔记本接入方式切换为${expectedAccess === 'wifi' ? ' Wi-Fi' : '有线'}，再运行对应组。`, 'warning');
      return;
    }
    const result = Model.simulate(config, 12);
    if (!result.allReachable) {
      showFeedback('experiment-status', '当前配置下至少一台终端不可达。请检查链路并重新核验网络。', 'error');
      return;
    }
    if (access === 'wifi') {
      wifiResult = result;
      done.wifi = true;
      renderResultCell('desktop-wifi-result', result.clients.desktop);
      renderResultCell('laptop-wifi-result', result.clients.laptop);
      byId('wifi-bottleneck').textContent = bottleneckNames(result.clients.laptop);
      byId('wifi-active-flows').textContent = `共享链路按 ${result.activeClients.length} 条活动流均分；文件 ${result.fileSizeMB} MB。`;
      showFeedback('experiment-status', `Wi-Fi 组完成：笔记本 ${formatNumber(result.clients.laptop.throughputMbps)} Mbps，瓶颈为 ${bottleneckNames(result.clients.laptop)}。切到有线后运行第二组。`, 'success');
    } else {
      wiredResult = result;
      done.wired = true;
      renderResultCell('desktop-wired-result', result.clients.desktop);
      renderResultCell('laptop-wired-result', result.clients.laptop);
      byId('wired-bottleneck').textContent = bottleneckNames(result.clients.laptop);
      byId('wired-active-flows').textContent = `共享链路按 ${result.activeClients.length} 条活动流均分；文件 ${result.fileSizeMB} MB。`;
      showFeedback('experiment-status', `有线组完成：笔记本 ${formatNumber(result.clients.laptop.throughputMbps)} Mbps。现在比较两次吞吐率。`, 'success');
    }
    renderSteps();
  }

  function checkNetwork() {
    const result = Model.inspect(readConfig());
    if (result.allReachable) {
      done.network = true;
      showFeedback('network-status', '两台终端都存在通往服务端的完整路径。继续预测 Wi-Fi 笔记本的瓶颈。', 'success');
    } else {
      done.network = false;
      const unreachable = Object.entries(result.clients).filter(([, state]) => !state.reachable)
        .map(([id, state]) => `${id === 'desktop' ? '台式机' : '笔记本'}（${Model.LINKS[state.failedLink].label}断开）`);
      showFeedback('network-status', `仍有终端不可达：${unreachable.join('；')}。接通缺失链路后重新核验。`, 'error');
    }
    renderSteps();
  }

  function checkPrediction() {
    if (!done.network) return;
    const result = Model.simulate(readConfig(), 12);
    const guessed = byId('bottleneck-prediction').value;
    const bottlenecks = result.clients.laptop.bottlenecks;
    if (bottlenecks.includes(guessed)) {
      done.prediction = true;
      showFeedback('prediction-status', `预测正确。${bottleneckNames(result.clients.laptop)} 的可分享容量最低；每个 12 MB 文件为 ${result.fileSizeMbit} Mbit。`, 'success');
    } else {
      showFeedback('prediction-status', `再看每条链路分给该流的容量。当前瓶颈是：${bottleneckNames(result.clients.laptop)}。`, 'error');
    }
    renderSteps();
  }

  function checkComparison() {
    if (!wifiResult || !wiredResult) return;
    const wifiRate = wifiResult.clients.laptop.throughputMbps;
    const wiredRate = wiredResult.clients.laptop.throughputMbps;
    const actual = Math.abs(wifiRate - wiredRate) < 1e-9 ? 'same' : wiredRate > wifiRate ? 'wired' : 'wifi';
    if (byId('faster-access').value === actual) {
      done.compare = true;
      showFeedback('comparison-status', `判断正确：Wi-Fi ${formatNumber(wifiRate)} Mbps，有线 ${formatNumber(wiredRate)} Mbps。这个结论只适用于本次教学参数。`, 'success');
      renderSteps();
      saveCompletion();
    } else {
      showFeedback('comparison-status', `请用两次模拟表格里的笔记本吞吐率比较：Wi-Fi ${formatNumber(wifiRate)} Mbps，有线 ${formatNumber(wiredRate)} Mbps。`, 'error');
    }
  }

  for (const id of LINK_IDS) {
    byId(`link-${id}`).addEventListener('change', () => {
      done.network = false;
      showFeedback('network-status', '链路状态已变化；请重新核验网络连通。');
      renderTopology(readConfig());
      resetExperiments();
    });
    byId(`rate-${id}`).addEventListener('change', () => {
      renderTopology(readConfig());
      resetExperiments();
    });
  }
  byId('laptop-access').addEventListener('change', () => {
    renderTopology(readConfig());
    if (done.wifi) {
      done.wired = false;
      done.compare = false;
      wiredResult = null;
      byId('desktop-wired-result').textContent = '尚未运行';
      byId('laptop-wired-result').textContent = '尚未运行';
      byId('wired-bottleneck').textContent = '—';
      byId('wired-active-flows').textContent = '尚无模拟结果';
      showFeedback('experiment-status', readConfig().laptopAccess === 'wired'
        ? 'Wi-Fi 组结果已保留。现在运行同一链路配置下的有线组。'
        : 'Wi-Fi 组结果已保留。可以重新运行有线组进行对照。');
      showFeedback('comparison-status', '完成 Wi-Fi 与有线两次模拟后再比较。');
    } else if (done.prediction && readConfig().laptopAccess === 'wired') {
      showFeedback('experiment-status', '瓶颈预测针对 Wi-Fi 接入；切回 Wi-Fi 后先运行第一组。');
    }
    renderSteps();
  });
  byId('check-network').addEventListener('click', checkNetwork);
  byId('check-prediction').addEventListener('click', checkPrediction);
  byId('run-wifi').addEventListener('click', () => runExperiment('wifi'));
  byId('run-wired').addEventListener('click', () => runExperiment('wired'));
  byId('check-comparison').addEventListener('click', checkComparison);
  byId('retry-save').addEventListener('click', saveCompletion);

  renderTopology(readConfig());
  updateProgressStatus();
  renderSteps();
})();
