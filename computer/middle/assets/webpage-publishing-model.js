(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.WebpagePublishingModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const TARGETS = Object.freeze({
    'message-transfer.html': '消息传输实验室',
    'network-paths.html': '数据包路径实验室'
  });
  const INITIAL = Object.freeze({
    title: '校园科学展',
    body: '用一张网页介绍科学展的活动与参观方式。',
    imageAlt: '展台上有天文与机械模型',
    linkTarget: 'message-transfer.html'
  });
  const LIMITS = Object.freeze({title: 60, body: 240, imageAlt: 100});

  function normalize(draft) {
    if (!draft || typeof draft !== 'object') throw new Error('invalid draft');
    const clean = {};
    for (const key of ['title', 'body', 'imageAlt']) {
      if (typeof draft[key] !== 'string') throw new Error(`invalid ${key}`);
      clean[key] = draft[key].trim();
    }
    clean.linkTarget = draft.linkTarget;
    return clean;
  }

  function validate(draft) {
    let clean;
    try { clean = normalize(draft); }
    catch (_) { return {ok: false, field: 'title', message: '网页数据格式不正确，请重新填写。'}; }
    for (const [field, label] of [['title', '标题'], ['body', '正文'], ['imageAlt', '图像说明']]) {
      if (!clean[field]) return {ok: false, field, message: `请填写${label}，再模拟发布。`};
      if (Array.from(clean[field]).length > LIMITS[field]) {
        return {ok: false, field, message: `${label}不能超过 ${LIMITS[field]} 个字符。`};
      }
    }
    if (!Object.prototype.hasOwnProperty.call(TARGETS, clean.linkTarget)) {
      return {ok: false, field: 'linkTarget', message: '请选择本站提供的内部链接目标。'};
    }
    return {ok: true, data: Object.freeze({...clean})};
  }

  function differs(a, b) {
    if (!a || !b) return true;
    return ['title', 'body', 'imageAlt', 'linkTarget'].some(key => a[key] !== b[key]);
  }

  function publish(draft, version) {
    const checked = validate(draft);
    if (!checked.ok) throw new Error(checked.message);
    if (!Number.isInteger(version) || version < 1) throw new Error('invalid version');
    return Object.freeze({...checked.data, version});
  }

  return {TARGETS, INITIAL, LIMITS, normalize, validate, differs, publish};
});
