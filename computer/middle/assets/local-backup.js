(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const model = window.KVLocalBackupModel;
  if (!model || !window.SubjectProgress) {
    $('workspace-feedback').textContent = '练习加载失败，请刷新页面。';
    $('progress-status').textContent = '本机进度暂不可用。';
    return;
  }
  const slug = 'local-backup-restore';
  const initialText = '观测记录：今天的云量比昨天少。';
  let workspace = model.snapshot(1, initialText);
  let preview = null;
  let prepared = null;
  let lost = false;
  let recovered = false;
  let conclusionCorrect = false;
  let saveAttempted = false;
  let readSerial = 0;
  function feedback(id, text, kind) { $(id).textContent = text; $(id).className = 'feedback' + (kind ? ` ${kind}` : ''); }
  function dirty() { return !!workspace && $('workspace-text').value !== workspace.text; }
  function renderProgress() {
    const record = SubjectProgress.read('computer','middle');
    const saved = record !== null && record[slug] === true;
    $('conclusion-options').disabled = !recovered;
    $('check-conclusion').disabled = !recovered;
    $('retry-save').hidden = !(recovered && conclusionCorrect && saveAttempted && !saved);
    $('progress-status').textContent = saved
      ? (recovered && conclusionCorrect ? '本机已记录本主题操作完成。' : '本机此前已记录完成；本轮需重新操作。')
      : recovered && conclusionCorrect && saveAttempted ? '本轮已完成，但本机记录未保存；可重试保存。'
      : record === null ? '本机进度暂不可用，仍可继续练习。' : '本轮匹配恢复并完成位置判断后尝试记录。';
  }
  function saveCompletion() {
    if (!recovered || !conclusionCorrect) return;
    const record = SubjectProgress.read('computer','middle');
    if (!(record && record[slug] === true)) { saveAttempted = true; SubjectProgress.markComplete('computer','middle',slug); }
    renderProgress();
  }
  function renderSnapshots() {
    $('workspace-revision').textContent = workspace ? `已保存的练习版本 ${workspace.revision}${dirty() ? '（有未保存草稿）' : ''}` : '练习区已模拟丢失';
    $('workspace-preview').textContent = workspace ? workspace.text : '当前没有工作版本。';
    $('file-revision').textContent = preview ? `文件中的练习版本 ${preview.revision}` : '尚未选择有效文件';
    $('file-preview').textContent = preview ? preview.text : '';
    $('restore-backup').disabled = !preview;
    $('comparison').textContent = !preview ? '选择有效文件后比较。' : !workspace ? '练习区当前没有工作版本；可以预览后选择恢复。' :
      `${model.same(workspace,preview) ? '文件与已保存工作版本的内容和版本一致。' : '文件与已保存工作版本的内容或版本不同。'}${dirty() ? '当前未保存草稿不参与比较。' : ''}`;
  }
  function clearPreview() {
    readSerial++;
    preview = null;
    $('backup-file').value = '';
    feedback('file-feedback','尚未选择文件。');
    renderSnapshots();
  }
  function resetLab() {
    workspace = model.snapshot(1,initialText); prepared = null; lost = false; recovered = false; conclusionCorrect = false; saveAttempted = false;
    $('workspace-text').disabled = false;
    $('workspace-text').value = workspace.text;
    $('conclusion-form').reset();
    clearPreview();
    feedback('workspace-feedback','练习版本 1 已在本页内存中；刷新不会保留练习文本。');
    feedback('backup-feedback','请先创建备份，再试着恢复。');
    feedback('conclusion-feedback','先完成本轮下载、模拟丢失及匹配文件恢复。');
    renderProgress();
  }
  $('workspace-text').addEventListener('input', () => {
    feedback('workspace-feedback', dirty() ? '草稿有未保存的修改；下载、模拟丢失或恢复前请先保存。' : '草稿与已保存工作版本一致。');
    renderSnapshots();
  });
  $('save-work').addEventListener('click', () => {
    if (!workspace) { feedback('workspace-feedback','练习区已模拟丢失，请选择文件恢复或重新开始。','try'); return; }
    const text = $('workspace-text').value;
    if (!model.validText(text)) { feedback('workspace-feedback','请输入非空练习文本，最多 500 个字符。','try'); return; }
    if (text === workspace.text) { feedback('workspace-feedback',`没有修改，仍为练习版本 ${workspace.revision}。`); return; }
    const next = model.snapshot(workspace.revision + 1,text);
    if (!next) { feedback('workspace-feedback','版本编号已到练习上限，请下载备份后重新开始。','try'); return; }
    workspace = next;
    feedback('workspace-feedback',`已保存到本页内存：练习版本 ${workspace.revision}。刷新后仍会丢失。`,'good');
    renderSnapshots();
  });
  $('download-backup').addEventListener('click', () => {
    if (!workspace) { feedback('backup-feedback','没有工作版本可下载；请恢复或重新开始。','try'); return; }
    if (dirty()) { feedback('backup-feedback','草稿尚未保存；请先保存工作版本。','try'); return; }
    try {
      const blob = new Blob([JSON.stringify(workspace, null, 2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = 'knowledge-visual-backup-practice.json';
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      prepared = model.snapshot(workspace.revision,workspace.text);
      feedback('backup-feedback',`已请求下载练习版本 ${workspace.revision}。请确认浏览器是否保存及文件位置；这不代表异地备份。`,'good');
    } catch (_) { feedback('backup-feedback','无法发起下载，请检查浏览器设置后重试。','try'); }
  });
  $('simulate-loss').addEventListener('click', () => {
    if (!workspace) { feedback('backup-feedback','练习区已经为空，请恢复或重新开始。','try'); return; }
    if (dirty()) { feedback('backup-feedback','草稿尚未保存；请先保存工作版本。','try'); return; }
    if (!prepared) { feedback('backup-feedback','请先请求下载练习备份，并确认浏览器保存了文件。','try'); return; }
    workspace = null; lost = true;
    $('workspace-text').value = ''; $('workspace-text').disabled = true;
    clearPreview();
    feedback('workspace-feedback','仅本页练习区已模拟丢失；电脑文件及本站其他进度没有删除。');
    feedback('backup-feedback','请在下方重新选择备份文件并核验；浏览器下载是否成功需要你确认。');
  });
  $('backup-file').addEventListener('change', async event => {
    const file = event.target.files && event.target.files[0];
    const serial = ++readSerial;
    preview = null;
    event.target.value = '';
    renderSnapshots();
    if (!file) { feedback('file-feedback','尚未选择文件。'); return; }
    if (file.size > model.MAX_BYTES) { feedback('file-feedback','文件超过 8 KiB，不予读取；练习区未改变。','try'); return; }
    feedback('file-feedback','正在读取所选文件…');
    try {
      const raw = await file.text();
      if (serial !== readSerial) return;
      preview = model.parse(raw);
      if (!preview) { feedback('file-feedback','文件格式、版本或内容无效；练习区未改变。','try'); renderSnapshots(); return; }
      feedback('file-feedback','文件格式有效；请检查内容和版本，预览不会自动覆盖练习区。','good');
      renderSnapshots();
    } catch (_) {
      if (serial !== readSerial) return;
      feedback('file-feedback','读取失败；练习区未改变。','try'); renderSnapshots();
    }
  });
  $('restore-backup').addEventListener('click', () => {
    if (!preview) return;
    if (dirty()) { feedback('file-feedback','草稿尚未保存；恢复前请先保存工作版本。','try'); return; }
    const matches = !!prepared && model.same(prepared,preview);
    workspace = model.snapshot(preview.revision,preview.text);
    $('workspace-text').disabled = false;
    $('workspace-text').value = workspace.text;
    if (lost && matches) recovered = true;
    lost = false;
    feedback('workspace-feedback',`已恢复练习版本 ${workspace.revision} 到本页内存。`,'good');
    feedback('file-feedback', matches ? '所选文件与本轮请求下载的内容和版本一致；不能据此确认文件来源或保存位置。' : '已恢复所选文件；它与本轮请求下载的内容或版本不一致。','good');
    feedback('conclusion-feedback', recovered ? '匹配恢复已完成，选择副本位置判断。' : '需先在本轮请求下载、模拟丢失，并恢复内容与版本匹配的文件。');
    renderSnapshots(); renderProgress();
  });
  $('conclusion-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!recovered) return;
    const selected = $('conclusion-options').querySelector('input[name="conclusion"]:checked');
    if (!selected) { feedback('conclusion-feedback','请先选择一个判断。','try'); return; }
    if (selected.value !== 'independent') { feedback('conclusion-feedback','同一设备损毁时，原件和同设备副本都可能丢失；再考虑副本位置。','try'); return; }
    conclusionCorrect = true;
    feedback('conclusion-feedback','判断正确：独立位置及定期验证恢复可以降低共同丢失风险，但不能保证绝对安全。','good');
    saveCompletion();
  });
  $('retry-save').addEventListener('click', saveCompletion);
  $('reset-lab').addEventListener('click', resetLab);
  for (const id of ['save-work','reset-lab','download-backup','simulate-loss','backup-file']) $(id).disabled = false;
  resetLab();
})();
