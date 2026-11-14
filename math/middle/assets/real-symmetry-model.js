(function (root, factory) {
  const realNumbers = typeof module === 'object' && module.exports
    ? require('./real-number-model.js') : root.KVRealNumberModel;
  const model = factory(realNumbers);
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.KVRealSymmetryModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (realNumbers) {
  'use strict';

  if (!realNumbers || typeof realNumbers.parseNumber !== 'function') {
    throw new Error('实数解析模型不可用');
  }
  const sources = [
    {id: 'root-positive', base: '√2', sign: 1, hint: '1.4 < √2 < 1.5'},
    {id: 'root-negative', base: '√2', sign: -1, hint: '−1.5 < −√2 < −1.4'},
    {id: 'pi-positive', base: 'π', sign: 1, hint: '3.1 < π < 3.2'},
    {id: 'pi-negative', base: 'π', sign: -1, hint: '−3.2 < −π < −3.1'},
    {id: 'e-positive', base: 'e', sign: 1, hint: '2.7 < e < 2.8'},
    {id: 'e-negative', base: 'e', sign: -1, hint: '−2.8 < −e < −2.7'},
    {id: 'rational-positive', base: '3/2', sign: 1, hint: '3/2 = 1.5'},
    {id: 'rational-negative', base: '3/2', sign: -1, hint: '−3/2 = −1.5'},
    {id: 'zero', base: '0', sign: 0, hint: '0 恰好位于原点'},
    {id: 'root-zero', base: '√0', sign: 0, hint: '√0 = 0，恰好位于原点'}
  ];
  const cases = Object.freeze(sources.map(source => {
    const label = source.sign < 0 ? `−${source.base}` : source.base;
    const parsed = realNumbers.parseNumber(label);
    if (!parsed || Math.abs(parsed.value) > 4) throw new Error(`无效案例：${label}`);
    const group = source.sign === 0 ? 'zero' : parsed.kind === 'rational' ? 'rational'
      : source.sign < 0 ? 'negative-irrational' : 'positive-irrational';
    return Object.freeze({...source, label, value: parsed.value, kind: parsed.kind, group,
      opposite: source.sign === 0 ? '0' : source.sign < 0 ? source.base : `−${source.base}`,
      absolute: source.sign === 0 ? '0' : source.base});
  }));
  const caseMap = new Map(cases.map(item => [item.id, item]));
  const groups = Object.freeze([
    {id: 'positive-irrational', label: '正无理数'},
    {id: 'negative-irrational', label: '负无理数'},
    {id: 'rational', label: '非零有理数'},
    {id: 'zero', label: '零'}
  ]);
  function getCase(id) { return caseMap.get(id) || null; }
  function point(raw) {
    const text = String(raw ?? '').trim();
    if (!/^-?(?:[0-3](?:\.[0-9])?|4(?:\.0)?)$/.test(text)) return null;
    const value = Number(text);
    return Number.isFinite(value) && Math.abs(value * 10 - Math.round(value * 10)) < 1e-8 ? value : null;
  }
  function displayPoint(value) {
    return Number(value) === 0 ? '0.0' : Number(value).toFixed(1).replace('-', '−');
  }
  function percent(value) {
    return Number.isFinite(value) && value >= -4 && value <= 4 ? (value + 4) * 100 / 8 : null;
  }
  function checkPosition(item, side, raw) {
    if (!item || !['original', 'opposite'].includes(side)) return {valid: false, feedback: '请选择有效题目。'};
    const guess = point(raw);
    if (guess === null) return {valid: false, feedback: '位置须是 −4 到 4 之间的一位小数刻度。'};
    const target = side === 'original' ? item.value : -item.value;
    const valid = Math.abs(guess - target) <= (item.kind === 'irrational' ? 0.100000001 : 0.000000001);
    if (valid) return {valid: true, feedback: side === 'original'
      ? `${item.label} 的位置${item.kind === 'irrational' ? '估计' : ''}正确。现在找关于零点对称的点。`
      : `对称点位置正确：两点到零的距离相同、方向相反。`};
    return {valid: false, feedback: side === 'original'
      ? `原数位置还不合适。参考 ${item.hint}，沿数轴再移动。`
      : '相反数应与原数到零距离相同、方向相反。再试一次。'};
  }
  function options(item) {
    if (!item) return [];
    const values = item.sign === 0 ? ['0', '1', '−1'] : [item.base, `−${item.base}`, '0'];
    const offset = cases.indexOf(item) % values.length;
    return values.slice(offset).concat(values.slice(0, offset));
  }
  function checkConclusion(item, opposite, absolute, reason) {
    if (!item) return {valid: false, opposite: false, absolute: false, reason: false};
    const result = {opposite: opposite === item.opposite,
      absolute: absolute === item.absolute, reason: reason === 'distance'};
    return {valid: result.opposite && result.absolute && result.reason, ...result};
  }
  function solution(item) {
    if (!item) return null;
    const expression = `${item.label} 的相反数是 ${item.opposite}；|${item.label}|=${item.absolute}`;
    const distance = item.kind === 'irrational' ? `≈${Math.abs(item.value).toFixed(3)}`
      : `=${Math.abs(item.value).toFixed(1)}`;
    return {expression, distance, text: `${expression}。到原点的距离 ${distance}，总是非负的。${item.sign === 0 ? '零的相反数和绝对值都等于零。' : '两点关于零点对称。'}`};
  }
  return {cases, groups, getCase, point, displayPoint, percent, checkPosition, options, checkConclusion, solution};
});
