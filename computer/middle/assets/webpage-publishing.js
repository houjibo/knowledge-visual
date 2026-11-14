(function () {
  'use strict';
  const Model = window.WebpagePublishingModel;
  const $ = id => document.getElementById(id);
  const fieldIds = {title: 'draft-title', body: 'draft-body', imageAlt: 'draft-image-alt', linkTarget: 'draft-link'};
  const quizCorrect = {data: false, timing: false};
  const versions = [];
  let saveFailed = false;

  function draft() {
    return Object.fromEntries(Object.entries(fieldIds).map(([key, id]) => [key, $(id).value]));
  }

  function renderPage(article, data) {
    article.querySelector('.preview-title').textContent = data.title;
    article.querySelector('.preview-body').textContent = data.body;
    article.querySelector('.art').setAttribute('aria-label', data.imageAlt || '图像说明尚未填写');
    article.querySelector('.preview-alt').textContent = `图像说明：${data.imageAlt || '尚未填写'}`;
    const link = article.querySelector('.preview-link');
    link.href = Object.prototype.hasOwnProperty.call(Model.TARGETS, data.linkTarget)
      ? data.linkTarget : 'index.html';
    link.textContent = Object.prototype.hasOwnProperty.call(Model.TARGETS, data.linkTarget)
      ? `继续学习：${Model.TARGETS[data.linkTarget]}` : '请选择内部链接';
  }

  function renderDraft() {
    const data = Model.normalize(draft());
    $('draft-data').textContent = JSON.stringify({
      '标题 title': data.title,
      '正文 body': data.body,
      '图像说明 imageAlt': data.imageAlt,
      '链接目标 href': data.linkTarget
    }, null, 2);
    renderPage($('draft-preview'), data);
    const published = versions.at(-1);
    if (published) {
      $('published-meta').textContent = Model.differs(data, published)
        ? `模拟版本 ${published.version} 已发布；草稿有未发布更改，已发布视图仍显示旧版本。`
        : `模拟版本 ${published.version} 已发布；草稿与已发布版本相同。`;
    }
    return data;
  }

  function earned() {
    return versions.length >= 2 && quizCorrect.data && quizCorrect.timing;
  }

  function renderProgress() {
    const correct = Number(quizCorrect.data) + Number(quizCorrect.timing);
    $('round-status').textContent = `已模拟发布 ${versions.length} 个不同版本；理解检查 ${correct}/2。`;
    const stored = window.SubjectProgress.read('computer', 'middle');
    const saved = stored !== null && stored['webpage-publishing'] === true;
    if (saved && earned()) {
      $('progress-status').textContent = '本轮已完成两个不同版本及两题理解检查；本机已记录完成。';
      $('retry-save').hidden = true;
    } else if (earned()) {
      $('progress-status').textContent = '本轮已完成任务，但本机进度未能保存；可重试保存。';
      $('retry-save').hidden = false;
    } else if (saved) {
      $('progress-status').textContent = '本机此前已记录完成；本轮还需编辑、发布两个不同版本并答对两题。';
      $('retry-save').hidden = true;
    } else {
      $('progress-status').textContent = stored === null
        ? '本机进度暂不可用；仍可继续操作。完成本轮任务后可重试保存。'
        : '本轮尚未达成完成条件；请编辑、发布两个不同版本并答对两题。';
      $('retry-save').hidden = true;
    }
  }

  function saveCompletion() {
    if (!earned()) return;
    saveFailed = !window.SubjectProgress.markComplete('computer', 'middle', 'webpage-publishing');
    renderProgress();
  }

  function maybeSave() {
    renderProgress();
    if (earned() && !saveFailed) saveCompletion();
  }

  function publish() {
    Object.values(fieldIds).forEach(id => $(id).removeAttribute('aria-invalid'));
    const checked = Model.validate(draft());
    if (!checked.ok) {
      $(fieldIds[checked.field]).setAttribute('aria-invalid', 'true');
      $('publish-status').textContent = checked.message;
      $('publish-status').className = 'feedback error';
      $(fieldIds[checked.field]).focus();
      return;
    }
    const previous = versions.at(-1);
    if (!previous && !Model.differs(checked.data, Model.INITIAL)) {
      $('publish-status').textContent = '先编辑至少一个草稿字段，再模拟发布第一个版本。';
      $('publish-status').className = 'feedback error';
      return;
    }
    if (previous && !Model.differs(checked.data, previous)) {
      $('publish-status').textContent = `草稿与模拟版本 ${previous.version} 相同；先修改数据，再发布新版本。`;
      $('publish-status').className = 'feedback error';
      return;
    }
    const snapshot = Model.publish(checked.data, versions.length + 1);
    versions.push(snapshot);
    $('published-empty').hidden = true;
    $('published-preview').hidden = false;
    renderPage($('published-preview'), snapshot);
    renderDraft();
    $('publish-status').textContent = `已在本页模拟发布版本 ${snapshot.version}；这份快照不会上传。现在修改草稿，比较已发布视图，再重新发布。`;
    $('publish-status').className = 'feedback success';
    maybeSave();
  }

  function checkQuestion(kind, answer, feedbackId, name) {
    const chosen = document.querySelector(`input[name="${name}"]:checked`);
    if (!chosen) {
      $(feedbackId).textContent = '请先选择一个答案。';
      $(feedbackId).className = 'feedback error';
      return;
    }
    quizCorrect[kind] = chosen.value === answer;
    $(feedbackId).textContent = quizCorrect[kind]
      ? kind === 'data' ? '正确：这些可编辑字段组成了本页呈现的部分数据。' : '正确：草稿修改不会自动替换已发布快照，需再次模拟发布。'
      : kind === 'data' ? '再看编辑区：哪些字段会进入标题、正文、图形说明或链接？' : '再比较草稿和已发布版本：修改草稿后，已发布视图是否立即变化？';
    $(feedbackId).className = `feedback ${quizCorrect[kind] ? 'success' : 'error'}`;
    maybeSave();
  }

  Object.values(fieldIds).forEach(id => {
    const field = $(id);
    field.addEventListener(id === 'draft-link' ? 'change' : 'input', () => {
      field.removeAttribute('aria-invalid');
      renderDraft();
      $('publish-status').textContent = versions.length
        ? '草稿已修改；已发布的模拟快照仍保持不变。'
        : '草稿预览已更新；检查后可模拟发布第一个版本。';
      $('publish-status').className = 'feedback';
    });
  });
  for (const [name, kind, feedbackId] of [
    ['data-question', 'data', 'data-feedback'],
    ['timing-question', 'timing', 'timing-feedback']
  ]) {
    document.querySelectorAll(`input[name="${name}"]`).forEach(input => input.addEventListener('change', () => {
      quizCorrect[kind] = false;
      $(feedbackId).textContent = '选项已更改；请重新检验。';
      $(feedbackId).className = 'feedback';
      renderProgress();
    }));
  }
  $('publish-button').addEventListener('click', publish);
  $('check-data').addEventListener('click', () => checkQuestion('data', 'fields', 'data-feedback', 'data-question'));
  $('check-timing').addEventListener('click', () => checkQuestion('timing', 'republish', 'timing-feedback', 'timing-question'));
  $('retry-save').addEventListener('click', () => { saveFailed = false; saveCompletion(); });
  window.addEventListener('pageshow', renderProgress);
  window.addEventListener('storage', renderProgress);
  $('editor-fields').disabled = false;
  document.querySelectorAll('#quiz-fields fieldset').forEach(fieldset => { fieldset.disabled = false; });
  ['publish-button', 'check-data', 'check-timing'].forEach(id => { $(id).disabled = false; });
  renderDraft();
  $('publish-status').textContent = '草稿已准备；先编辑至少一个字段。';
  renderProgress();
})();
