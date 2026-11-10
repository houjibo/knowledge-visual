(function () {
  'use strict';
  const stagesBySubject = {
    computer: new Set(['primary', 'middle']),
    ai: new Set(['primary', 'middle', 'high', 'uni'])
  };
  const legacyStagesBySubject = {
    computer: new Set(['primary', 'middle']),
    ai: new Set(['primary', 'high', 'uni'])
  };

  function readRecord(key) {
    const raw = localStorage.getItem(key);
    if (raw === null) return {raw: null, value: {}, valid: true};
    try {
      const value = JSON.parse(raw);
      return {raw, value, valid: !!value && typeof value === 'object' && !Array.isArray(value)};
    } catch (_) { return {raw, value: {}, valid: false}; }
  }

  function read(subject, stage) {
    if (!stagesBySubject[subject] || !stagesBySubject[subject].has(stage)) return null;
    try {
      const current = readRecord(`kv-${subject}-${stage}-progress`);
      const canReadLegacy = legacyStagesBySubject[subject].has(stage);
      const legacy = canReadLegacy
        ? readRecord(`kv-computer-ai-${stage}-progress`)
        : {raw: null, value: {}, valid: true};
      if (!current.valid) return null;

      const previous = legacy.valid ? legacy.value : {};
      const value = Object.assign(Object.create(null), previous, current.value);
      const missingLegacyEntries = Object.keys(previous).some(name =>
        !Object.prototype.hasOwnProperty.call(current.value, name));
      if (legacy.raw !== null && missingLegacyEntries) {
        try {
          localStorage.setItem(`kv-${subject}-${stage}-progress`, JSON.stringify(value));
        } catch (_) { /* Keep the merged legacy view usable when migration is blocked. */ }
      }
      return value;
    } catch (_) { return null; }
  }

  function markComplete(subject, stage, slug) {
    if (!stagesBySubject[subject] || !stagesBySubject[subject].has(stage) ||
        !/^[a-z0-9-]+$/.test(slug)) return false;
    try {
      const value = read(subject, stage);
      if (!value) return false;
      value[slug] = true;
      localStorage.setItem(`kv-${subject}-${stage}-progress`, JSON.stringify(value));
      window.dispatchEvent(new Event('kv-progress-changed'));
      return true;
    } catch (_) { return false; }
  }

  window.SubjectProgress = {read, markComplete};
})();
