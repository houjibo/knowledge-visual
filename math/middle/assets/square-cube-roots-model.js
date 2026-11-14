(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.KVSquareCubeRootsModel = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function integer(value, min, max, label) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < min || n > max || String(value).trim() !== String(n)) {
      throw new RangeError(`${label}须为 ${min}—${max} 的整数`);
    }
    return n;
  }
  function power(side, exponent) {
    const n = integer(side, 1, 10, '边长');
    if (exponent !== 2 && exponent !== 3) throw new RangeError('幂次只可选 2 或 3');
    return {side: n, exponent, count: n ** exponent, layerSize: n * n, layers: exponent === 3 ? n : 1};
  }
  function cases() {
    const result = [];
    for (let n = 1; n <= 10; n++) result.push({id: `sq-${n * n}`, kind: 'square-positive', exponent: 2, radicand: n * n, root: n});
    result.push({id: 'sq-0', kind: 'square-zero', exponent: 2, radicand: 0, root: 0});
    for (let n = 1; n <= 10; n++) result.push({id: `cb-${n ** 3}`, kind: 'cube-positive', exponent: 3, radicand: n ** 3, root: n});
    result.push({id: 'cb-0', kind: 'cube-zero', exponent: 3, radicand: 0, root: 0});
    for (let n = 1; n <= 10; n++) result.push({id: `cb-${-(n ** 3)}`, kind: 'cube-negative', exponent: 3, radicand: -(n ** 3), root: -n});
    for (const n of [9, 16]) result.push({id: `sq-${-n}`, kind: 'square-negative', exponent: 2, radicand: -n, root: null});
    return result;
  }
  const ITEMS = cases();
  const BY_ID = new Map(ITEMS.map(item => [item.id, item]));
  function item(id) {
    const found = BY_ID.get(id);
    if (!found) throw new RangeError('未知开方案例');
    return found;
  }
  function notation(current) {
    return `${current.exponent === 2 ? '√' : '∛'}(${current.radicand})`;
  }
  function result(status, feedback) { return {status, feedback}; }
  function checkPrediction(current, answer) {
    if (current.root === null) {
      if (answer === 'none') return result('correct', '判断正确。继续解释：为什么实数的平方不能得到这个负数？');
      if (answer === '' || answer === null || answer === undefined) return result('empty', '写一个整数，或选择“实数内无解”。');
      return result('incorrect', '任何实数的平方都不小于 0。再判断是否存在实数结果。');
    }
    const raw = String(answer ?? '').trim();
    if (!/^-?(0|[1-9]\d?)$/.test(raw)) return result('empty', '请只写一个整数；负数用半角减号。');
    if (Number(raw) === current.root) return result('correct', '预测正确。现在用乘方的逆关系解释。');
    if (current.exponent === 2) return result('incorrect', '先找哪个非负整数的平方等于根号内的数；√ 表示非负的算术平方根。');
    return result('incorrect', '想一想哪个整数自乘三次能得到根号内的数，注意奇数次乘方保留负号。');
  }
  function reasonOptions(current) {
    if (current.kind === 'square-negative') return [
      {id: 'nonnegative', text: '任意实数 x 的 x²≥0，因此得不到负数。'},
      {id: 'negative-root', text: '负数总有一个负的实数平方根。'},
      {id: 'imaginary', text: '在实数范围里，平方后可以是负数。'},
    ];
    const n = current.root;
    if (current.exponent === 2) return [
      {id: 'inverse', text: `${n}²=${current.radicand}，而 √ 记号只取非负的 ${n}。`},
      {id: 'both', text: `√(${current.radicand}) 同时等于 ${n} 和 ${-n}。`},
      {id: 'cube', text: `因为 ${n}³=${current.radicand}，所以算术平方根是 ${n}。`},
    ];
    return [
      {id: 'inverse', text: `${n}³=${current.radicand}，所以 ∛(${current.radicand})=${n}。`},
      {id: 'square', text: `因为 ${n}²=${current.radicand}，所以立方根是 ${n}。`},
      {id: 'absolute', text: '立方根必须非负，所以负号应该去掉。'},
    ];
  }
  function checkReason(current, choice) {
    if (!choice) return result('empty', '请选择一条可回代的理由。');
    if (choice === (current.kind === 'square-negative' ? 'nonnegative' : 'inverse')) {
      return result('correct', '逆运算依据正确。现在打开本页计算器核验。');
    }
    if (choice === 'both') return result('incorrect', '正数的平方根有正负两个，但 √ 记号只代表非负的算术平方根。');
    if (choice === 'imaginary' || choice === 'negative-root') return result('incorrect', '在实数范围内，平方结果不可能是负数。');
    if (choice === 'absolute') return result('incorrect', '负数的立方根仍是负数：负数自乘三次还是负数。');
    return result('incorrect', '回代时要用与根号一致的幂次。');
  }
  function calculator(current) {
    if (current.root === null) return `√(${current.radicand})：实数范围无结果，因为 x²≥0。`;
    const computed = current.exponent === 2 ? Math.sqrt(current.radicand) : Math.cbrt(current.radicand);
    const expression = `${current.root < 0 ? `(${current.root})` : current.root}${current.exponent === 2 ? '²' : '³'}=${current.radicand}`;
    const distinction = current.exponent === 2 && current.root > 0
      ? `方程 x²=${current.radicand} 有 ±${current.root} 两个平方根；√ 记号只取非负的 ${current.root}。`
      : current.exponent === 2 ? '0 的平方根只有 0。'
        : current.root < 0 ? '负数立方根是代数关系；真实立方体的体积不会是负数。' : '';
    return `${notation(current)} = ${Number(computed.toFixed(9))}；回代 ${expression}。${distinction}`;
  }
  return {power, cases, item, notation, checkPrediction, reasonOptions, checkReason, calculator};
});
