// 数学学段目录：只在两种进度记录均可读取时展示徽章。
(() => {
  const keys = ['kv-math-progress', 'kv-math-progress-v2'];
  function canReadProgress() {
    try {
      for (const key of keys) {
        const raw = localStorage.getItem(key);
        if (raw === null) continue;
        const value = JSON.parse(raw);
        if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
      }
      return true;
    } catch (_) { return false; }
  }
  function refresh() {
    const readable = canReadProgress();
    document.querySelectorAll('.topic-card .progress-badge').forEach(badge => badge.remove());
    document.getElementById('mathProgressNotice').hidden = readable;
    if (readable) PageProgress.renderBadges('.topic-card');
  }
  document.addEventListener('DOMContentLoaded', refresh);
  window.addEventListener('pageshow', refresh);
  window.addEventListener('storage', event => {
    if (event.key === null || keys.includes(event.key)) refresh();
  });
})();
