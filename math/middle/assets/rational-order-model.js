(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  if (root) root.KVRationalOrderModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Every target lies on the quarter-unit grid. Integer arithmetic also makes
  // −1/2 and −0.5 the same point without floating-point comparison rules.
  const cases = Object.freeze([
    { id: 'negative-integers', label: '两个负整数', a: '−3', b: '−1', aUnits: -12, bUnits: -4, group: 'negative' },
    { id: 'negative-decimals', label: '两个负小数', a: '−1.5', b: '−0.5', aUnits: -6, bUnits: -2, group: 'negative' },
    { id: 'cross-zero', label: '跨过零的分数', a: '−3/4', b: '1/2', aUnits: -3, bUnits: 2, group: 'cross' },
    { id: 'reverse-sign', label: '反过来的正负数', a: '1.25', b: '−0.25', aUnits: 5, bUnits: -1, group: 'cross' },
    { id: 'equal-negative', label: '同一点的两种写法', a: '−1/2', b: '−0.5', aUnits: -2, bUnits: -2, group: 'equal' },
    { id: 'equal-positive', label: '另一组等值分数', a: '0.5', b: '2/4', aUnits: 2, bUnits: 2, group: 'equal' }
  ]);
  const caseMap = new Map(cases.map(item => [item.id, item]));

  function getCase(id) { return caseMap.get(id) || null; }
  function unitsFromSlider(value) {
    if (typeof value !== 'string' || !/^-?(?:\d+)(?:\.\d+)?$/.test(value)) return null;
    const scaled = Number(value) * 4;
    return Number.isInteger(scaled) && scaled >= -16 && scaled <= 16 ? scaled : null;
  }
  function displayUnits(units) {
    if (!Number.isInteger(units) || units < -16 || units > 16) return null;
    const value = units / 4;
    return value < 0 ? '−' + Math.abs(value) : String(value);
  }
  function percent(units) {
    return Number.isInteger(units) && units >= -16 && units <= 16 ? (units + 16) * 100 / 32 : null;
  }
  function relation(item) {
    if (!item) return null;
    return item.aUnits < item.bUnits ? 'less' : item.aUnits > item.bUnits ? 'greater' : 'equal';
  }
  function checkPositions(item, aUnits, bUnits) {
    if (!item) return { valid: false, a: false, b: false };
    return {
      valid: aUnits === item.aUnits && bUnits === item.bUnits,
      a: aUnits === item.aUnits,
      b: bUnits === item.bUnits
    };
  }
  function checkComparison(item, selectedRelation, selectedReason) {
    if (!item) return { valid: false, relation: false, reason: false };
    const expected = relation(item);
    const reason = expected === 'less' ? 'left' : expected === 'greater' ? 'right' : 'same';
    return {
      valid: selectedRelation === expected && selectedReason === reason,
      relation: selectedRelation === expected,
      reason: selectedReason === reason
    };
  }
  function relationText(item) {
    const symbol = relation(item) === 'less' ? '<' : relation(item) === 'greater' ? '>' : '=';
    return `${item.a} ${symbol} ${item.b}`;
  }
  return { cases, getCase, unitsFromSlider, displayUnits, percent, relation, checkPositions, checkComparison, relationText };
});
