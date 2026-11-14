(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DataWorkbenchModel = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const SYMBOLS = Object.freeze({A: 'A', han: '中', seedling: '🌱'});
  const DEFAULT_READINGS = Object.freeze({monday: 18, tuesday: 21, wednesdayMl: 21000, friday: 23});
  const CORRECT_PLAN = Object.freeze({unit: 'divide-1000', missing: 'exclude', duplicate: 'single'});

  function encodeSymbol(key) {
    const symbol = SYMBOLS[key];
    if (!symbol) throw new RangeError('unknown symbol');
    const bytes = Array.from(new TextEncoder().encode(symbol));
    return {
      key, symbol, codePoint: `U+${symbol.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`,
      count: bytes.length,
      bytes: bytes.map(value => ({decimal: value, hex: value.toString(16).toUpperCase().padStart(2, '0'),
        binary: value.toString(2).padStart(8, '0')}))
    };
  }

  function checkPlan(choice) {
    const checks = {
      unit: choice && choice.unit === CORRECT_PLAN.unit,
      missing: choice && choice.missing === CORRECT_PLAN.missing,
      duplicate: choice && choice.duplicate === CORRECT_PLAN.duplicate
    };
    return {...checks, ready: checks.unit && checks.missing && checks.duplicate};
  }

  function parseReading(value, maximum, step) {
    if ((typeof value !== 'string' && typeof value !== 'number') ||
        (typeof value === 'string' && value.trim() === '')) return null;
    const number = Number(value);
    return Number.isSafeInteger(number) && number >= 0 && number <= maximum && number % step === 0
      ? number : null;
  }

  function analyzeReadings(raw) {
    if (!raw || typeof raw !== 'object') return {ok: false, error: '需要四个有效日的读数。'};
    const monday = parseReading(raw.monday, 50, 1);
    const tuesday = parseReading(raw.tuesday, 50, 1);
    const wednesdayMl = parseReading(raw.wednesdayMl, 50000, 1000);
    const friday = parseReading(raw.friday, 50, 1);
    if ([monday, tuesday, wednesdayMl, friday].some(value => value === null)) {
      return {ok: false, error: '四个有效读数须填整数；升为 0–50 L，周三为 0–50000 mL 且是 1000 的倍数。空白不等于 0。'};
    }
    const observed = [
      {day: '周一', liters: monday}, {day: '周二', liters: tuesday},
      {day: '周三', liters: wednesdayMl / 1000}, {day: '周五', liters: friday}
    ];
    const total = observed.reduce((sum, item) => sum + item.liters, 0);
    const mean = total / observed.length;
    const axisMaximum = Math.max(5, Math.ceil(Math.max(...observed.map(item => item.liters)) / 5) * 5);
    return {ok: true, observed, total, mean, axisMaximum, missingDay: '周四', rawCount: 6,
      observedCount: observed.length, duplicateCount: 1};
  }

  function checkMean(raw, mean) {
    if ((typeof raw !== 'string' && typeof raw !== 'number') ||
        (typeof raw === 'string' && raw.trim() === '') || !Number.isFinite(mean)) return false;
    const value = Number(raw);
    return Number.isFinite(value) && value === mean;
  }

  return {SYMBOLS, DEFAULT_READINGS, CORRECT_PLAN, encodeSymbol, checkPlan, analyzeReadings, checkMean};
});
