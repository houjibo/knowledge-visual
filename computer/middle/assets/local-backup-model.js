(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  if (root) root.KVLocalBackupModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAX_BYTES = 8192;
  const MAX_TEXT = 500;
  function validText(text) { return typeof text === 'string' && text.trim().length > 0 && text.length <= MAX_TEXT; }
  function validSnapshot(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value) && value.kind === 'kv-backup-practice' &&
      value.schema_version === 1 && Number.isSafeInteger(value.revision) && value.revision >= 1 && value.revision <= 1000000 && validText(value.text);
  }
  function snapshot(revision, text) {
    const value = {kind:'kv-backup-practice', schema_version:1, revision, text};
    return validSnapshot(value) ? value : null;
  }
  function parse(raw) {
    if (typeof raw !== 'string' || raw.length > MAX_BYTES) return null;
    try { const value = JSON.parse(raw); return validSnapshot(value) ? snapshot(value.revision, value.text) : null; }
    catch (_) { return null; }
  }
  function same(a,b) { return validSnapshot(a) && validSnapshot(b) && a.revision === b.revision && a.text === b.text; }
  return {MAX_BYTES, MAX_TEXT, validText, validSnapshot, snapshot, parse, same};
});
