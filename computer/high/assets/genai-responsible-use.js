(function () {
  'use strict';

  const Model = window.HighGenaiResponsibleUseModel;
  const subject = 'computer';
  const stage = 'high';
  const slug = 'genai-responsible-use';
  const get = id => document.getElementById(id);
  const done = {input: false, verify: false, snapshot: false};
  let evidenceOpened = false;
  let pendingSave = false;
  let historicalCompletion = false;
  let saveNotice = '';

  function feedback(id, message, kind = '') {
    const node = get(id);
    node.textContent = message;
    node.classList.remove('success', 'error', 'warning');
    if (kind) node.classList.add(kind);
  }

  function selectedValue(name) {
    const item = document.querySelector(`input[name="${name}"]:checked`);
    return item ? item.value : '';
  }

  function renderCandidates() {
    const grid = get('candidate-grid');
    for (const candidate of Model.getInputCandidates()) {
      const card = document.createElement('article');
      card.className = 'candidate-card';

      const heading = document.createElement('h3');
      heading.textContent = candidate.label;
      card.appendChild(heading);

      const detail = document.createElement('p');
      detail.className = 'candidate-detail';
      detail.textContent = candidate.detail;
      card.appendChild(detail);

      const options = document.createElement('div');
      options.className = 'inline-options';
      for (const [value, text] of [['true', '可以输入'], ['false', '不宜输入']]) {
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `input-${candidate.id}`;
        radio.value = value;
        label.appendChild(radio);
        label.append(` ${text}`);
        options.appendChild(label);
      }
      card.appendChild(options);

      const basis = document.createElement('p');
      basis.className = 'source-note';
      basis.textContent = `提示：${candidate.basis}`;
      card.appendChild(basis);

      grid.appendChild(card);
    }
  }

  function renderSourcesAndOutputs() {
    const sourceGrid = get('source-grid');
    for (const source of Model.getSources()) {
      const card = document.createElement('article');
      card.className = 'source-card';
      const heading = document.createElement('h3');
      heading.textContent = source.title;
      card.appendChild(heading);
      const text = document.createElement('p');
      text.textContent = source.text;
      card.appendChild(text);
      const facts = document.createElement('ul');
      for (const fact of source.facts) {
        const item = document.createElement('li');
        item.textContent = fact;
        facts.appendChild(item);
      }
      card.appendChild(facts);
      sourceGrid.appendChild(card);
    }

    const outputGrid = get('output-grid');
    for (const output of Model.getGeneratedOutputs()) {
      const card = document.createElement('article');
      card.className = 'output-card';

      const heading = document.createElement('h3');
      heading.textContent = output.id === 'out-a' ? '生成结果 A' : '生成结果 B';
      card.appendChild(heading);

      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble';
      const paragraph = document.createElement('p');
      paragraph.textContent = output.text;
      bubble.appendChild(paragraph);
      card.appendChild(bubble);

      const verdict = document.createElement('div');
      verdict.className = 'verdict-line inline-options';
      for (const [value, text] of [['cite', '可采用，但须标注来源'], ['reject', '不可直接采用']]) {
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `verdict-${output.id}`;
        radio.value = value;
        label.appendChild(radio);
        label.append(` ${text}`);
        verdict.appendChild(label);
      }
      card.appendChild(verdict);

      outputGrid.appendChild(card);
    }
  }

  function readProgress() {
    try { return window.SubjectProgress.read(subject, stage); }
    catch (_) { return null; }
  }

  function renderProgress() {
    const labels = {
      input: '区分可输入与不宜输入的信息',
      verify: '依据来源卡核验生成结果',
      snapshot: '只把已核验且标注来源的内容纳入协作快照'
    };
    for (const [key, label] of Object.entries(labels)) {
      const item = document.querySelector(`[data-step="${key}"]`);
      item.textContent = `${done[key] ? '✓ 已完成' : '○ 待完成'} · ${label}`;
      item.dataset.done = String(done[key]);
    }

    if (!Object.values(done).every(Boolean)) {
      pendingSave = false;
      saveNotice = '';
    }

    if (pendingSave) {
      feedback('save-status', '三项判断已完成，但本机进度未能保存。修复浏览器存储后可以重试；损坏的旧记录不会自动覆盖。', 'warning');
      get('retry-save').hidden = false;
      return;
    }
    if (saveNotice) {
      feedback('save-status', saveNotice, 'success');
      get('retry-save').hidden = true;
      return;
    }
    if (historicalCompletion || readProgress()?.[slug] === true) {
      historicalCompletion = true;
      feedback('save-status', '本机已有此主题的完成记录；仍可重新操作本实验。', 'success');
      get('retry-save').hidden = true;
      return;
    }
    feedback('save-status', readProgress() === null
      ? '本机进度暂不可用；学习交互仍可继续。'
      : '完成三项判断后保存本机进度。');
    get('retry-save').hidden = true;
  }

  function saveCompletion() {
    if (!Object.values(done).every(Boolean)) return;
    let saved = false;
    try { saved = window.SubjectProgress.markComplete(subject, stage, slug) === true; }
    catch (_) { saved = false; }
    pendingSave = !saved;
    if (saved) {
      historicalCompletion = true;
      saveNotice = '三项判断已完成，已保存本机学习进度。';
    } else saveNotice = '';
    renderProgress();
  }

  function maybeComplete() {
    if (Object.values(done).every(Boolean) && !historicalCompletion) saveCompletion();
    else renderProgress();
  }

  function resetDownstream(level) {
    if (level === 'input') {
      done.verify = false;
      done.snapshot = false;
      evidenceOpened = false;
      get('sources-panel').hidden = true;
      get('snapshot-panel').hidden = true;
      document.querySelectorAll('input[name^="verdict-"], input[name="snapshot-decision"]')
        .forEach(input => { input.checked = false; });
    }
  }

  function checkInputs() {
    const selection = {};
    const missing = [];
    for (const candidate of Model.getInputCandidates()) {
      const value = selectedValue(`input-${candidate.id}`);
      if (value === '') missing.push(candidate.id);
      else selection[candidate.id] = value === 'true';
    }
    if (missing.length) {
      feedback('input-status', `还有 ${missing.length} 类材料没有分类，请逐项选择后再检查。`, 'warning');
      return;
    }
    let result;
    try { result = Model.checkInputClassification(selection); }
    catch (error) {
      feedback('input-status', `分类数据异常：${error.message}`, 'error');
      return;
    }
    if (!result.correct) {
      done.input = false;
      get('reveal-sources').disabled = true;
      resetDownstream('input');
      const names = result.mismatches.map(item => {
        const candidate = Model.getInputCandidates().find(candidate => candidate.id === item.id);
        return candidate ? candidate.label : item.id;
      }).join('、');
      feedback('input-status', `“${names}”的分类不合适：个人敏感信息或未公开内部资料不应输入外部工具，公开或去标识化材料才可在本例使用。请重新分类。`, 'error');
      renderProgress();
      return;
    }
    done.input = true;
    get('reveal-sources').disabled = false;
    feedback('input-status', '正确：本例只把公开或去标识化材料输入工具，个人敏感信息与内部文件保持在工具之外。真实场景还需结合用途与授权。', 'success');
    feedback('prediction-status', '先记录你对两段生成结果的预测。');
    renderProgress();
  }

  function revealSources() {
    if (!done.input) {
      feedback('prediction-status', '先完成第 1 步的输入分类。', 'warning');
      return;
    }
    const prediction = selectedValue('genai-prediction');
    if (!prediction) {
      feedback('prediction-status', '先选择你当前的判断，再查看来源卡。', 'warning');
      return;
    }
    evidenceOpened = true;
    get('sources-panel').hidden = false;
    feedback('prediction-status', prediction === 'trust-all'
      ? '已记录预测。现在对照来源卡，检查两段结果是否都有依据。'
      : '已记录预测。下面把每段结果与来源卡逐项核对。', 'success');
    feedback('verdict-status', '来源已显示；请分别判断两段结果是否可采用。');
    get('sources-title').focus();
  }

  function checkVerdicts() {
    if (!evidenceOpened) {
      feedback('verdict-status', '先查看来源卡，再作核验判断。', 'warning');
      return;
    }
    const verdicts = {};
    const outputs = Model.getGeneratedOutputs();
    for (const output of outputs) {
      const value = selectedValue(`verdict-${output.id}`);
      if (!value) {
        feedback('verdict-status', '请为两段生成结果分别选择采用判断。', 'warning');
        return;
      }
      verdicts[output.id] = value;
    }
    let result;
    try { result = Model.verifyOutputs({evidenceOpened, verdicts}); }
    catch (error) {
      feedback('verdict-status', `核验数据异常：${error.message}`, 'error');
      return;
    }
    if (!result.correct) {
      done.verify = false;
      done.snapshot = false;
      get('snapshot-panel').hidden = true;
      document.querySelectorAll('input[name="snapshot-decision"]').forEach(input => { input.checked = false; });
      const detail = result.conflicts.length
        ? result.conflicts.map(conflict => {
            const output = outputs.find(item => item.id === conflict.id);
            const label = conflict.id === 'out-a' ? '结果 A' : '结果 B';
            if (conflict.reason === 'fabricated-reference-not-in-sources') {
              return `${label} 引用的“白皮书”统计在来源卡中不存在，不能直接采用`;
            }
            return `${label} 的结论可由来源卡核对，应标注来源后采用`;
          }).join('；')
        : '请先打开来源卡再核验。';
      feedback('verdict-status', `${detail}。请重新判断。`, 'error');
      renderProgress();
      return;
    }
    done.verify = true;
    const snapshot = Model.getCollaborationSnapshot();
    get('snapshot-state').textContent =
      `协作快照仅保存在本机、不对外发布；当前快照含 ${snapshot.entries.length} 条已核验并标注来源的内容，网络请求数为 ${snapshot.networkRequests}。`;
    get('snapshot-panel').hidden = false;
    feedback('verdict-status', '正确：结果 A 可标注来源后采用；结果 B 的“白皮书”引用在来源卡中不存在，不可直接采用。', 'success');
    feedback('snapshot-status', '现在判断协作快照应纳入哪些内容。');
    get('snapshot-title').focus();
    renderProgress();
  }

  function checkSnapshot() {
    if (!done.verify) {
      feedback('snapshot-status', '先完成来源核验。', 'warning');
      return;
    }
    const decision = selectedValue('snapshot-decision');
    if (!decision) {
      feedback('snapshot-status', '请选择协作快照的纳入规则。', 'warning');
      return;
    }
    let result;
    try { result = Model.checkSnapshotDecision(decision); }
    catch (error) {
      feedback('snapshot-status', `决策数据异常：${error.message}`, 'error');
      return;
    }
    if (!result.correct) {
      done.snapshot = false;
      feedback('snapshot-status', decision === 'include-b'
        ? '含虚构引用的结果 B 不能进入协作快照，否则可能把无依据内容传播给组员。请重新选择。'
        : '协作内容必须标注来源，且仍要排除含虚构引用的结果 B。请重新选择。', 'error');
      renderProgress();
      return;
    }
    done.snapshot = true;
    feedback('snapshot-status', '正确：快照只纳入已核验且标注来源的内容；本页没有真实发布，也没有任何网络请求。', 'success');
    maybeComplete();
  }

  renderCandidates();
  renderSourcesAndOutputs();
  get('check-inputs').addEventListener('click', checkInputs);
  get('reveal-sources').addEventListener('click', revealSources);
  get('check-verdicts').addEventListener('click', checkVerdicts);
  get('check-snapshot').addEventListener('click', checkSnapshot);
  get('retry-save').addEventListener('click', saveCompletion);
  renderProgress();
})();
