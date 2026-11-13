(function () {
  'use strict';
  const Model = window.MessageTransferModel;
  const $ = id => document.getElementById(id);
  const challenges = ['ordered', 'reversed', 'missing'];
  const earned = new Set();
  let data;
  let order;
  let arrivals = [];
  let next = 0;
  let revealed = false;
  let predictionCorrect = false;
  let saveFailed = false;

  function hex(bytes) {
    return bytes.map(byte => byte.toString(16).toUpperCase().padStart(2, '0')).join(' ');
  }

  function item(number, bytes, state) {
    const li = document.createElement('li');
    li.className = state;
    const label = document.createElement('strong');
    label.textContent = `第 ${number} 块`;
    const detail = document.createElement('small');
    detail.className = 'hex';
    detail.textContent = bytes ? hex(bytes) : '尚未到达';
    li.append(label, detail);
    return li;
  }

  function renderProgress() {
    challenges.forEach(mode => { $(`challenge-${mode}`).textContent = earned.has(mode) ? '✓ 本轮已完成' : '○ 待完成'; });
    const stored = window.SubjectProgress.read('computer', 'middle');
    const saved = stored !== null && stored['message-transfer'] === true;
    if (saved) {
      $('progress-status').textContent = '本机已记录完成消息传输主题。';
      $('retry-save').hidden = true;
    } else if (earned.size === challenges.length) {
      $('progress-status').textContent = saveFailed || stored === null
        ? '三种条件已完成，但本机进度未能保存；可重试保存。'
        : '三种条件已完成，正在保存本机进度…';
      $('retry-save').hidden = false;
    } else {
      $('progress-status').textContent = stored === null
        ? `本机进度暂不可用；仍可继续实验。本轮已完成 ${earned.size}/3 项。`
        : `本轮已完成 ${earned.size}/3 项；尚未记录本主题完成。`;
      $('retry-save').hidden = true;
    }
  }

  function saveCompletion() {
    if (earned.size !== challenges.length) return;
    saveFailed = !window.SubjectProgress.markComplete('computer', 'middle', 'message-transfer');
    renderProgress();
  }

  function awardIfComplete() {
    if (!predictionCorrect || !Model.receive(data.packets, arrivals).complete) return;
    earned.add($('mode').value);
    renderProgress();
    if (earned.size === challenges.length) saveCompletion();
  }

  function render() {
    const received = Model.receive(data.packets, arrivals);
    $('sender-text').textContent = data.message;
    $('sender-bytes').textContent = hex(data.bytes);
    $('sender-blocks').replaceChildren(...data.packets.map(packet => item(packet.number, packet.bytes, '')));
    $('arrival-list').replaceChildren(...arrivals.map(number => item(number, data.packets[number - 1].bytes, 'received')));
    $('receiver-slots').replaceChildren(...data.packets.map(packet => item(
      packet.number, arrivals.includes(packet.number) ? packet.bytes : null,
      arrivals.includes(packet.number) ? 'received' : 'missing'
    )));
    $('receiver-text').textContent = received.complete ? received.text : '等待完整字节';
    $('prediction').disabled = revealed;
    $('reveal-button').disabled = revealed;
    $('step-button').disabled = !revealed || next >= order.length;
    $('retry-button').disabled = !revealed || $('mode').value !== 'missing' || next < order.length || !received.missing.includes(2);
    if (!revealed) $('step-status').textContent = '尚未开始传送。';
    else if (received.complete) $('step-status').textContent = `全部 ${data.packets.length} 块已齐，按编号重组后呈现“${received.text}”。`;
    else if (next >= order.length && $('mode').value === 'missing') $('step-status').textContent = '第 2 块缺失，不能呈现完整文字；请重发第 2 块。';
    else $('step-status').textContent = `已到达 ${arrivals.length}/${data.packets.length} 块；接收端仍等待完整字节。`;
  }

  function reset(message) {
    data = Model.encode($('message').value);
    order = Model.deliveryOrder($('mode').value, data.packets.length);
    arrivals = [];
    next = 0;
    revealed = false;
    predictionCorrect = false;
    $('prediction').value = '';
    $('prediction-status').textContent = message || '选择预测后才能传送。';
    $('prediction-status').className = 'feedback';
    render();
  }

  $('message').addEventListener('change', () => reset('消息已改变；请重新预测。'));
  $('mode').addEventListener('change', () => reset('到达条件已改变；请重新预测。'));
  $('reset-button').addEventListener('click', () => reset());
  $('reveal-button').addEventListener('click', () => {
    const prediction = $('prediction').value;
    if (!prediction) {
      $('prediction-status').textContent = '请先选择能否立即还原。';
      $('prediction-status').className = 'feedback error';
      return;
    }
    const expected = $('mode').value === 'missing' ? 'no' : 'yes';
    predictionCorrect = prediction === expected;
    revealed = true;
    $('prediction-status').textContent = `${predictionCorrect ? '预测正确。' : '这次预测未对。'}${expected === 'yes' ? '所有块会到达；乱序仍可按编号重组。' : '第 2 块暂缺，重发前不能还原。'}请逐块观察。`;
    $('prediction-status').className = `feedback ${predictionCorrect ? 'success' : 'error'}`;
    render();
  });
  $('step-button').addEventListener('click', () => {
    if (!revealed || next >= order.length) return;
    arrivals.push(order[next]);
    next += 1;
    render();
    if (next === order.length) awardIfComplete();
  });
  $('retry-button').addEventListener('click', () => {
    if (!revealed || $('mode').value !== 'missing' || next !== order.length || arrivals.includes(2)) return;
    arrivals.push(2);
    render();
    awardIfComplete();
  });
  $('retry-save').addEventListener('click', saveCompletion);
  window.addEventListener('pageshow', renderProgress);
  window.addEventListener('storage', renderProgress);
  ['message', 'mode', 'prediction', 'reveal-button', 'reset-button'].forEach(id => { $(id).disabled = false; });
  reset();
  renderProgress();
})();
