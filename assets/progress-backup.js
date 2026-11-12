(() => {
  document.getElementById('progress-backup').hidden = false;
  const KEYS = [
    'kv-math-progress', 'kv-math-progress-v2',
    'kv-physics-middle-progress', 'kv-physics-high-progress', 'kv-physics-uni-progress',
    'kv-chemistry-middle-progress', 'kv-chemistry-high-progress', 'kv-chemistry-uni-progress',
    'kv-science-progress',
    'kv-computer-primary-progress', 'kv-computer-middle-progress', 'kv-computer-high-progress',
    'kv-ai-high-progress', 'kv-ai-uni-progress',
    'kv-computer-ai-primary-progress', 'kv-computer-ai-middle-progress',
    'kv-computer-ai-high-progress', 'kv-computer-ai-uni-progress'
  ];
  const exportButton = document.getElementById('progress-export');
  const input = document.getElementById('progress-import-file');
  const applyButton = document.getElementById('progress-import-apply');
  const status = document.getElementById('progress-backup-status');
  let pending = null;
  let selection = 0;

  function record(raw) {
    if (typeof raw !== 'string') throw new Error('记录格式不正确');
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('进度记录必须是对象');
    for (const [name, item] of Object.entries(value)) {
      if (['__proto__', 'constructor', 'prototype'].includes(name) || name.length > 200 ||
          (item !== null && !['string', 'boolean', 'number'].includes(typeof item))) throw new Error('进度记录包含不受支持的数据');
    }
    return value;
  }
  function snapshot() {
    const data = Object.create(null);
    for (const key of KEYS) {
      const raw = localStorage.getItem(key);
      if (raw !== null) data[key] = raw;
    }
    return data;
  }
  function validate(file) {
    if (!file || typeof file !== 'object' || Array.isArray(file) || file.format !== 'knowledge-visual-progress' || file.version !== 1 ||
        !file.records || typeof file.records !== 'object' || Array.isArray(file.records)) throw new Error('不是受支持的学习进度备份');
    for (const [key, raw] of Object.entries(file.records)) {
      if (!KEYS.includes(key)) throw new Error('备份包含不支持的数据项');
      record(raw);
    }
    return file.records;
  }
  function plan(records) {
    const writes = [];
    let added = 0, retained = 0;
    for (const key of KEYS) {
      if (!Object.prototype.hasOwnProperty.call(records, key)) continue;
      const incoming = record(records[key]);
      const oldRaw = localStorage.getItem(key);
      const existing = oldRaw === null ? {} : record(oldRaw);
      const merged = Object.assign(Object.create(null), incoming, existing);
      for (const name of Object.keys(incoming)) {
        if (Object.prototype.hasOwnProperty.call(existing, name)) retained++;
        else added++;
      }
      if (Object.keys(incoming).some(name => !Object.prototype.hasOwnProperty.call(existing, name)))
        writes.push({key, oldRaw, newRaw: JSON.stringify(merged)});
    }
    return {writes, added, retained};
  }
  exportButton.addEventListener('click', () => {
    try {
      const records = snapshot();
      const blob = new Blob([JSON.stringify({format: 'knowledge-visual-progress', version: 1, records}, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'knowledge-visual-progress.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      status.textContent = `已导出 ${Object.keys(records).length} 类完成记录；请妥善保管文件。`;
    } catch (error) { status.textContent = '无法读取本地进度，未导出文件。'; }
  });
  input.addEventListener('change', async () => {
    pending = null;
    const currentSelection = ++selection;
    applyButton.disabled = true;
    const file = input.files[0];
    if (!file) { status.textContent = ''; return; }
    try {
      if (file.size > 1024 * 1024) throw new Error('备份文件超过 1 MB');
      const records = validate(JSON.parse(await file.text()));
      if (currentSelection !== selection) return;
      const result = plan(records);
      pending = records;
      applyButton.disabled = false;
      status.textContent = `预览：将新增 ${result.added} 条记录，保留本机已有的 ${result.retained} 条同名记录。确认后才会写入。`;
    } catch (error) { if (currentSelection === selection) status.textContent = `无法预览：${error.message}。本机数据未修改。`; }
  });
  applyButton.addEventListener('click', () => {
    if (!pending) return;
    let result;
    try { result = plan(pending); }
    catch (error) { status.textContent = `无法导入：${error.message}。本机数据未修改。`; return; }
    const written = [];
    try {
      for (const item of result.writes) {
        if (localStorage.getItem(item.key) !== item.oldRaw) throw new Error('本机记录已变化，请重新预览');
        localStorage.setItem(item.key, item.newRaw);
        written.push(item);
      }
      status.textContent = `合并完成：新增 ${result.added} 条，保留本机已有的 ${result.retained} 条同名记录。`;
      pending = null; applyButton.disabled = true; input.value = '';
      window.dispatchEvent(new Event('kv-progress-changed'));
    } catch (error) {
      let rollbackFailed = false;
      for (const item of written.reverse()) {
        try {
          if (localStorage.getItem(item.key) !== item.newRaw) { rollbackFailed = true; continue; }
          if (item.oldRaw === null) localStorage.removeItem(item.key);
          else localStorage.setItem(item.key, item.oldRaw);
        } catch (e) { rollbackFailed = true; }
      }
      status.textContent = rollbackFailed
        ? '导入失败，部分记录可能已变更且无法自动恢复；请检查浏览器存储并保留备份。'
        : '导入失败，已恢复本次写入前的记录；请检查浏览器存储后重试。';
      pending = null; applyButton.disabled = true;
      window.dispatchEvent(new Event('kv-progress-changed'));
    }
  });
})();
