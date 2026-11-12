(function () {
  'use strict';
  const Model = window.StackQueueModel;
  const $ = id => document.getElementById(id);
  let state = Model.create();
  let saveFailed = false;

  function renderList(id, items, activeIndex, activeName, otherIndex, otherName) {
    const list = $(id);
    list.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('li');
      empty.className = 'empty-item';
      empty.textContent = '空：没有可取出的物件';
      list.append(empty);
      return;
    }
    items.forEach((token, index) => {
      const item = document.createElement('li');
      item.className = 'data-item';
      if (index === activeIndex) item.classList.add('active-item');
      const letter = document.createElement('strong');
      letter.textContent = token;
      const label = document.createElement('span');
      label.textContent = index === activeIndex ? activeName : index === otherIndex ? otherName : '等待';
      item.append(letter, label);
      list.append(item);
    });
  }

  function renderProgress() {
    const saved = window.SubjectProgress.read('computer', 'uni');
    const done = saved !== null && saved['stack-queue'] === true;
    if (done) {
      $('progress-status').textContent = '本机已记录完成栈与队列主题。';
      $('retry-save').hidden = true;
    } else if (state.complete) {
      $('progress-status').textContent = saveFailed || saved === null
        ? '两轮预测已完成，但本机进度未能保存；可重试保存。'
        : '两轮预测已完成，正在保存本机进度…';
      $('retry-save').hidden = false;
    } else {
      $('progress-status').textContent = saved === null
        ? '本机进度暂不可用；仍可完成本页实验。'
        : '尚未完成两轮正确预测；本机未记录。';
      $('retry-save').hidden = true;
    }
    $('challenge-first').textContent = state.firstCorrect ? '✓ 已完成' : '○ 待完成';
    $('challenge-add').textContent = state.addedAfterFirst ? '✓ 已完成' : '○ 待完成';
    $('challenge-second').textContent = state.complete ? '✓ 已完成' : '○ 待完成';
  }

  function render() {
    const stackEnd = state.stack.length - 1;
    const queueEnd = state.queue.length - 1;
    renderList('stack-list', state.stack, stackEnd, '栈顶 · 下一件', 0, '栈底');
    renderList('queue-list', state.queue, 0, '队首 · 下一件', queueEnd, '队尾');
    $('stack-summary').textContent = state.stack.length
      ? `栈底到栈顶：${state.stack.join(' → ')}；栈顶 ${state.stack[stackEnd]}`
      : '栈为空。';
    $('queue-summary').textContent = state.queue.length
      ? `队首到队尾：${state.queue.join(' → ')}；队首 ${state.queue[0]}`
      : '队列为空。';
    $('add-button').disabled = state.nextIndex >= Model.TOKENS.length;
    $('add-button').textContent = state.nextIndex < Model.TOKENS.length
      ? `同时加入 ${Model.TOKENS[state.nextIndex]}` : '六件已全部加入';
    $('remove-button').disabled = !state.stack.length;
    $('item-count').textContent = `已加入 ${state.nextIndex}/6 件；两侧当前各 ${state.stack.length} 件。`;
    renderProgress();
  }

  function announce(message, kind) {
    $('action-status').textContent = message;
    $('action-status').className = `status-box ${kind || ''}`;
  }

  function saveCompletion() {
    if (!state.complete) return;
    saveFailed = !window.SubjectProgress.markComplete('computer', 'uni', 'stack-queue');
    renderProgress();
  }

  $('add-button').addEventListener('click', () => {
    const result = Model.add(state);
    if (result.error) {
      announce('六件物品都已加入。可以继续取出，或重置实验。', 'error');
      return;
    }
    state = result.state;
    $('stack-prediction').value = '';
    $('queue-prediction').value = '';
    announce(`已将 ${result.token} 同时压入栈顶、加入队尾。先看两侧的下一件，再分别预测。`);
    render();
  });

  $('remove-button').addEventListener('click', () => {
    const result = Model.remove(state, $('stack-prediction').value, $('queue-prediction').value);
    if (result.error === 'prediction') {
      announce('请先分别预测栈顶和队首将取出哪一件。', 'error');
      return;
    }
    if (result.error === 'empty') {
      announce('两侧都是空的，请先加入一件物品。', 'error');
      return;
    }
    state = result.state;
    $('stack-prediction').value = '';
    $('queue-prediction').value = '';
    const details = `栈取出 ${result.stackToken}（最近加入的栈顶）；队列取出 ${result.queueToken}（最早仍在队列的队首）。`;
    if (result.correct) announce(`两侧预测正确。${details}`, 'success');
    else announce(`这次预测未全对。${details}可以继续观察或重置重试。`, 'error');
    const row = document.createElement('li');
    row.textContent = `${result.correct ? '预测正确' : '预测有误'}：${details}`;
    $('history').prepend(row);
    render();
    if (state.complete) saveCompletion();
  });

  $('reset-button').addEventListener('click', () => {
    state = Model.create();
    $('stack-prediction').value = '';
    $('queue-prediction').value = '';
    $('history').replaceChildren();
    announce('本次实验已重置。依次加入至少三件，预测后取出。');
    render();
  });
  $('retry-save').addEventListener('click', saveCompletion);
  window.addEventListener('pageshow', renderProgress);
  window.addEventListener('storage', renderProgress);
  render();
})();
