(function () {
  'use strict';
  const stages = new Set(['primary', 'middle', 'high', 'uni']);

  function read(stage) {
    if (!stages.has(stage)) return null;
    try {
      const raw = localStorage.getItem(`kv-computer-ai-${stage}-progress`);
      if (raw === null) return {};
      const value = JSON.parse(raw);
      return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
    } catch (_) { return null; }
  }

  function markComplete(stage, slug) {
    if (!stages.has(stage) || !/^[a-z0-9-]+$/.test(slug)) return false;
    try {
      const raw = localStorage.getItem(`kv-computer-ai-${stage}-progress`);
      const value = raw === null ? {} : JSON.parse(raw);
      if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
      value[slug] = true;
      localStorage.setItem(`kv-computer-ai-${stage}-progress`, JSON.stringify(value));
      window.dispatchEvent(new Event('kv-progress-changed'));
      return true;
    } catch (_) { return false; }
  }

  window.ComputerAIProgress = {read, markComplete};
})();
