(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.KVIrrationalRootBoundsModel = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function radicand(raw) {
    const text = String(raw).trim();
    if (!/^(?:[2-9]|[1-9]\d)$/.test(text)) throw new RangeError('请输入 2—99 的整数。');
    const n = Number(text);
    if (n < 2 || n > 99 || Number.isInteger(Math.sqrt(n))) {
      throw new RangeError('请选择 2—99 的非完全平方整数。');
    }
    return n;
  }
  function bounds(value) {
    const n = radicand(value);
    let whole = 0;
    while ((whole + 1) ** 2 < n) whole++;
    let tenth = 0;
    while ((tenth + 1) ** 2 < 100 * n) tenth++;
    return {n, whole, wholeUpper: whole + 1, tenth, tenthUpper: tenth + 1};
  }
  function group(value) {
    const n = radicand(value);
    return n < 25 ? 'low' : n < 64 ? 'middle' : 'high';
  }
  function decimal(tenth) { return (tenth / 10).toFixed(1); }
  function squareDecimal(tenth) { return (tenth * tenth / 100).toFixed(2); }
  function candidate(value, raw) {
    const n = radicand(value);
    if (!/^(?:10(?:\.0)?|[0-9](?:\.[0-9])?)$/.test(String(raw))) {
      throw new RangeError('候选边长须为 0.0—10.0 的十分位数。');
    }
    const number = Number(raw);
    const tenth = Math.round(number * 10);
    if (!Number.isFinite(number) || tenth < 0 || tenth > 100 || Math.abs(number * 10 - tenth) > 1e-8) {
      throw new RangeError('候选边长须为 0.0—10.0 的十分位数。');
    }
    const square = tenth * tenth;
    const comparison = square < 100 * n ? 'less' : square > 100 * n ? 'greater' : 'equal';
    return {n, tenth, text: decimal(tenth), area: squareDecimal(tenth), comparison};
  }
  function result(status, feedback) { return {status, feedback}; }
  function checkWhole(value, raw) {
    const {n, whole} = bounds(value);
    const text = String(raw ?? '').trim();
    if (!/^[0-9]$/.test(text)) return result('empty', '请输入 0—9 的一个整数下界。');
    const guess = Number(text);
    if (guess === whole) return result('correct', `${guess}²=${guess * guess}<${n}<${(guess + 1) ** 2}=${guess + 1}²，所以 ${guess}<√${n}<${guess + 1}。`);
    const left = guess * guess, right = (guess + 1) ** 2;
    return result('incorrect', `你选的相邻平方数是 ${left} 和 ${right}；它们没有严格夹住 ${n}。再找一对。`);
  }
  function checkTenth(value, raw) {
    const {n, tenth} = bounds(value);
    const text = String(raw ?? '').trim();
    if (!/^[0-9]\.[0-9]$/.test(text)) return result('empty', '请输入一位小数下界，例如 1.4。');
    const guess = Number(text.replace('.', ''));
    if (guess === tenth) return result('correct', `${decimal(guess)}²=${squareDecimal(guess)}<${n}<${squareDecimal(guess + 1)}=${decimal(guess + 1)}²，所以 ${decimal(guess)}<√${n}<${decimal(guess + 1)}。`);
    return result('incorrect', `你选的两侧平方是 ${squareDecimal(guess)} 和 ${squareDecimal(guess + 1)}；它们没有严格夹住 ${n}。把边长调整 0.1 再试。`);
  }
  function reasonOptions(value) {
    const {n, tenth, tenthUpper} = bounds(value);
    return [
      {id: 'square-monotone', text: `${squareDecimal(tenth)}<${n}<${squareDecimal(tenthUpper)}；非负边长平方越大，边长也越大。`},
      {id: 'reverse', text: `${squareDecimal(tenth)}<${n}<${squareDecimal(tenthUpper)}，因此平方根的大小顺序要反过来。`},
      {id: 'cubes', text: `只要比较两侧边长的立方，就能确定 √${n} 的位置。`},
    ];
  }
  function checkReason(choice) {
    if (!choice) return result('empty', '选一条能从平方比较推出边长比较的理由。');
    if (choice === 'square-monotone') return result('correct', '非负数平方严格递增，所以平方界与边长界的大小顺序相同。');
    if (choice === 'reverse') return result('incorrect', '非负数越大，平方也越大；这里的大小顺序不会倒过来。');
    return result('incorrect', '本题要求的是平方根，应比较两侧边长的平方。');
  }
  function checkCalculatorInput(value, raw) {
    const n = radicand(value);
    const text = String(raw ?? '').trim();
    if (!/^(?:[2-9]|[1-9]\d)$/.test(text)) return result('empty', `请在计算器键入本题的被开方整数 ${n}。`);
    if (Number(text) !== n) return result('incorrect', `当前题是 √${n}，请键入同一个被开方数。`);
    return result('correct', '被开方数正确，按 √ 键得到近似值。');
  }
  function calculator(value) {
    const {n, tenth, tenthUpper} = bounds(value);
    const approximation = Math.sqrt(n).toFixed(6);
    return {approximation, lower: decimal(tenth), upper: decimal(tenthUpper),
      explanation: `√${n}≈${approximation}，位于 ${decimal(tenth)} 与 ${decimal(tenthUpper)} 之间；小数是近似值，平方不等式给出严格界限。`};
  }
  return {radicand, bounds, group, candidate, checkWhole, checkTenth, reasonOptions,
    checkReason, checkCalculatorInput, calculator};
});
