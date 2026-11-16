(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const model = window.KVIdentityEncryptionModel;
  if (!model || !window.SubjectProgress) {
    $('question-prompt').textContent = '练习加载失败，请刷新页面。';
    $('progress-status').textContent = '进度暂不可用。';
    return;
  }
  const earnedQuestions = new Set();
  const earnedChannels = new Set();
  const slug = 'identity-encryption';
  let saveAttempted = false;
  function feedback(id, text, kind) { $(id).textContent = text; $(id).className = 'feedback' + (kind ? ` ${kind}` : ''); }
  function isReady() { return earnedQuestions.size === model.questions.length && earnedChannels.size === model.channels.length; }
  function renderProgress() {
    $('challenge-status').textContent = `本轮账号判断 ${earnedQuestions.size}/3 · 传输预测 ${earnedChannels.size}/3`;
    const record = SubjectProgress.read('computer','middle');
    const saved = record !== null && record[slug] === true;
    $('retry-save').hidden = !(isReady() && saveAttempted && !saved);
    $('progress-status').textContent = saved
      ? (isReady() ? '本机已记录本主题完成。' : '本机此前已记录完成；本轮任务需重新操作。')
      : isReady() && saveAttempted ? '本轮六项已完成，但本机记录未保存；可重试保存。'
      : record === null ? '本机进度暂不可用；仍可继续练习。' : '本轮六项均正确后尝试记录本机进度。';
  }
  function maybeSave() {
    if (!isReady()) { renderProgress(); return; }
    const existing = SubjectProgress.read('computer','middle');
    if (!(existing && existing[slug] === true)) {
      saveAttempted = true;
      SubjectProgress.markComplete('computer','middle',slug);
    }
    renderProgress();
  }
  const qSelect = $('question-select');
  const cSelect = $('channel-select');
  model.questions.forEach(item => qSelect.add(new Option(item.title,item.id)));
  model.channels.forEach(item => cSelect.add(new Option(item.label,item.id)));
  function renderQuestion() {
    const item = model.question(qSelect.value);
    $('question-prompt').textContent = item.prompt;
    $('question-options').querySelectorAll('label').forEach(node => node.remove());
    item.choices.forEach(option => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio'; input.name = 'question-answer'; input.value = option.id;
      const text = document.createElement('span'); text.textContent = option.text;
      label.append(input, text); $('question-options').append(label);
    });
    feedback('question-feedback','先选择一个答案。');
  }
  function clearChannel() {
    $('sender-status').textContent = '等待预测';
    $('recipient-status').textContent = '核对后显示';
    $('observer-status').textContent = '核对后显示';
    for (const id of ['recipient-card','observer-card']) $(id).classList.remove('can-read','cannot-read');
  }
  function renderChannel() {
    $('recipient-choice').value = ''; $('observer-choice').value = '';
    clearChannel(); feedback('channel-feedback','先预测两方能否读懂。');
  }
  qSelect.addEventListener('change', renderQuestion);
  cSelect.addEventListener('change', renderChannel);
  $('question-options').addEventListener('change', () => feedback('question-feedback','答案已改变，请核对。'));
  $('question-form').addEventListener('submit', event => {
    event.preventDefault();
    const selected = $('question-options').querySelector('input[name="question-answer"]:checked');
    const result = model.assessQuestion(qSelect.value, selected?.value);
    if (!result) { feedback('question-feedback','请先选择一个答案。','try'); return; }
    if (!result.correct) { feedback('question-feedback','再想想身份、凭据和请求来源的作用；可以修改后重试。','try'); return; }
    earnedQuestions.add(qSelect.value);
    feedback('question-feedback',`判断正确。${result.explanation}`,'good');
    maybeSave();
  });
  for (const id of ['recipient-choice','observer-choice']) $(id).addEventListener('change', () => {
    clearChannel(); feedback('channel-feedback','预测已改变，请重新核对。');
  });
  $('check-channel').addEventListener('click', () => {
    const item = model.channel(cSelect.value);
    const result = model.assessChannel(cSelect.value, $('recipient-choice').value, $('observer-choice').value);
    if (!result) { feedback('channel-feedback','请分别预测接收者和观察者。','try'); return; }
    if (!result.correct) { clearChannel(); feedback('channel-feedback','至少一项预测不符；考虑传送的是明文还是密文，以及观察者是否取得密钥。','try'); return; }
    earnedChannels.add(cSelect.value);
    $('sender-status').textContent = `发出 ${item.symbol}`;
    $('recipient-status').textContent = result.recipient ? '可读示例信息' : '不能直接读懂';
    $('observer-status').textContent = result.observer ? '可读示例信息' : '不能直接读懂';
    $('recipient-card').classList.add(result.recipient ? 'can-read' : 'cannot-read');
    $('observer-card').classList.add(result.observer ? 'can-read' : 'cannot-read');
    feedback('channel-feedback',`预测正确。${result.explanation}`,'good');
    maybeSave();
  });
  $('retry-save').addEventListener('click', maybeSave);
  for (const id of ['question-select','channel-select','question-options','check-question','recipient-choice','observer-choice','check-channel']) $(id).disabled = false;
  renderQuestion(); renderChannel(); renderProgress();
})();
