(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.KVScientificApproxModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function parseDecimal(value) {
    if (typeof value !== 'string') throw new Error('请输入十进制数');
    const text = value.trim();
    const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(text);
    if (!match || (match[2] + (match[3] || '')).length > 18) throw new Error('请输入不超过 18 位的十进制数');
    const digits = BigInt(match[2] + (match[3] || ''));
    return { sign: match[1] === '-' && digits !== 0n ? -1n : 1n, digits, scale: (match[3] || '').length };
  }

  function canonical(sign, digits, scale) {
    if (digits === 0n) return { sign: 1n, digits: 0n, scale: 0 };
    while (scale > 0 && digits % 10n === 0n) {
      digits /= 10n;
      scale--;
    }
    return { sign, digits, scale };
  }

  function scaledDecimal(parsed, exponent) {
    const power = exponent - parsed.scale;
    if (power >= 0) return canonical(parsed.sign, parsed.digits * 10n ** BigInt(power), 0);
    return canonical(parsed.sign, parsed.digits, -power);
  }

  function equalDecimal(left, right) {
    return left.sign === right.sign && left.digits === right.digits && left.scale === right.scale;
  }

  function formatDecimal(parsed) {
    const digits = parsed.digits.toString();
    const sign = parsed.sign < 0n && parsed.digits !== 0n ? '-' : '';
    if (parsed.scale === 0) return sign + digits;
    if (digits.length <= parsed.scale) return sign + '0.' + '0'.repeat(parsed.scale - digits.length) + digits;
    return sign + digits.slice(0, -parsed.scale) + '.' + digits.slice(-parsed.scale);
  }

  function scientificForm(value) {
    const parsed = parseDecimal(value);
    if (parsed.digits === 0n) return { coefficient: '0', exponent: null };
    const raw = value.trim().replace(/^[+-]/, '');
    const parts = raw.split('.');
    const joined = parts.join('');
    const first = joined.search(/[1-9]/);
    const significant = joined.slice(first).replace(/0+$/, '');
    const coefficient = (parsed.sign < 0n ? '-' : '') + significant[0] +
      (significant.length > 1 ? '.' + significant.slice(1) : '');
    return { coefficient, exponent: parts[0].length - first - 1 };
  }

  function expandScientific(coefficient, exponent) {
    if (!Number.isInteger(exponent) || exponent < -12 || exponent > 12) throw new Error('指数须为 -12 到 12 的整数');
    return formatDecimal(scaledDecimal(parseDecimal(coefficient), exponent));
  }

  function checkScientific(target, coefficient, exponentText) {
    const expected = scientificForm(target);
    if (expected.exponent === null) throw new Error('零不使用非零系数的规范形式');
    if (typeof exponentText !== 'string' || !/^[+-]?\d+$/.test(exponentText.trim())) {
      return { status: 'invalid', expected, explanation: '指数须为整数。' };
    }
    const exponent = Number(exponentText.trim());
    if (!Number.isInteger(exponent) || exponent < -12 || exponent > 12) {
      return { status: 'invalid', expected, explanation: '指数限于 -12 到 12。' };
    }
    let parsed;
    try { parsed = parseDecimal(coefficient); }
    catch (error) { return { status: 'invalid', expected, explanation: error.message }; }
    if (parsed.digits === 0n) return { status: 'wrong', expected, expanded: '0', explanation: '系数为零，不能表示题中的非零数。' };
    const expandedValue = scaledDecimal(parsed, exponent);
    const expanded = formatDecimal(expandedValue);
    const targetValue = scaledDecimal(parseDecimal(target), 0);
    const equivalent = equalDecimal(expandedValue, targetValue);
    const unit = 10n ** BigInt(parsed.scale);
    const normalized = parsed.digits >= unit && parsed.digits < 10n * unit;
    const status = !equivalent ? 'wrong' : normalized ? 'correct' : 'equivalent-not-normalized';
    return { status, expected, expanded, equivalent, normalized };
  }

  function formatRoundedUnits(units, place) {
    if (place >= 0) return (units * 10n ** BigInt(place)).toString();
    const decimals = -place;
    const raw = units.toString().padStart(decimals + 1, '0');
    return raw.slice(0, -decimals) + '.' + raw.slice(-decimals);
  }

  function roundAt(value, place) {
    if (!Number.isInteger(place) || place < -6 || place > 9) throw new Error('目标精度不在练习范围内');
    const parsed = parseDecimal(value);
    if (parsed.sign < 0n) throw new Error('本练习只使用非负的测量或统计数');
    const shift = parsed.scale + place;
    const divisor = shift > 0 ? 10n ** BigInt(shift) : 1n;
    const numerator = shift < 0 ? parsed.digits * 10n ** BigInt(-shift) : parsed.digits;
    const lower = numerator / divisor;
    const remainder = numerator % divisor;
    const up = remainder !== 0n && remainder * 2n >= divisor;
    const rounded = lower + (up ? 1n : 0n);
    const nextDigit = shift > 0 ? Number(remainder / 10n ** BigInt(shift - 1)) : 0;
    return {
      expected: formatRoundedUnits(rounded, place),
      lower: formatRoundedUnits(lower, place),
      upper: formatRoundedUnits(lower + 1n, place),
      position: Number(remainder) / Number(divisor),
      direction: remainder === 0n ? 'exact' : up ? 'up' : 'down',
      nextDigit
    };
  }

  function checkApprox(value, place, answer) {
    const result = roundAt(value, place);
    if (typeof answer !== 'string') return { ...result, status: 'invalid' };
    const text = answer.trim();
    let parsed;
    try { parsed = parseDecimal(text); }
    catch (error) { return { ...result, status: 'invalid' }; }
    if (parsed.sign < 0n) return { ...result, status: 'wrong' };
    if (text === result.expected) return { ...result, status: 'correct' };
    const sameValue = equalDecimal(
      scaledDecimal(parsed, 0),
      scaledDecimal(parseDecimal(result.expected), 0)
    );
    return { ...result, status: sameValue ? 'precision' : 'wrong' };
  }

  return { scientificForm, expandScientific, checkScientific, roundAt, checkApprox };
});
