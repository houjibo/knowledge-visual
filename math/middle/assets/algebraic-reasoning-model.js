(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.KVAlgebraicReasoningModel = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function digit(value, min, label) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < min || n > 9 || String(value).trim() !== String(n)) {
      throw new RangeError(`${label}只能是 ${min}—9 的整数。`);
    }
    return n;
  }

  function fourDigit(a, b, c, d) {
    const digits = [digit(a, 1, '千位'), digit(b, 0, '百位'), digit(c, 0, '十位'), digit(d, 0, '个位')];
    const [thousands, hundreds, tens, units] = digits;
    const number = thousands * 1000 + hundreds * 100 + tens * 10 + units;
    const sum = digits.reduce((total, value) => total + value, 0);
    const group = 999 * thousands + 99 * hundreds + 9 * tens;
    return {
      digits, number, sum, group,
      rows: [
        {place: '千位', whole: 1000 * thousands, grouped: 999 * thousands, remainder: thousands},
        {place: '百位', whole: 100 * hundreds, grouped: 99 * hundreds, remainder: hundreds},
        {place: '十位', whole: 10 * tens, grouped: 9 * tens, remainder: tens},
        {place: '个位', whole: units, grouped: 0, remainder: units},
      ],
      divisible: sum % 3 === 0,
    };
  }

  function endingFive(a) {
    const tens = digit(a, 1, '十位');
    const side = tens * 10 + 5;
    return {
      tens, side, square: side * side,
      big: 100 * tens * tens,
      strip: 50 * tens,
      small: 25,
      hundreds: tens * (tens + 1),
    };
  }

  function result(status, feedback) { return {status, feedback}; }

  function checkDivPrediction(item, choice) {
    if (choice !== 'yes' && choice !== 'no') return result('empty', '先根据各位数字和预测是否能被 3 整除。');
    const correct = (choice === 'yes') === item.divisible;
    if (correct) return result('correct', `${item.digits.join('+')}=${item.sum}；${item.number}${item.divisible ? '能' : '不能'}被 3 整除。继续寻找对任意四位数都成立的依据。`);
    return result('incorrect', `先算各位和 ${item.digits.join('+')}=${item.sum}，再看它除以 3 的余数；此时不要只凭末位判断。`);
  }

  function checkDivSplit(choice) {
    if (!choice) return result('empty', '先选一个与原四位数恒相等的拆解。');
    if (choice === 'correct') return result('correct', '每个高位项拆成一个 3 的倍数和原来那一位；四个余项正好是各位数字和。');
    if (choice === 'omit') return result('incorrect', '这个式子丢掉了千、百、十位各自剩下的 a、b、c，不能等于原数。');
    if (choice === 'triple') return result('incorrect', '各位数字只各剩下一次，不能把整个各位和再乘 3。');
    return result('incorrect', '请选择给出正确位值拆解的式子。');
  }

  function checkDivReason(choice) {
    if (!choice) return result('empty', '选出从拆解式推出一般结论的依据。');
    if (choice === 'multiple') return result('correct', '999a、99b、9c 都是 3 的倍数；因此原数与各位数字和除以 3 的余数相同。这个理由对所有合法数字都成立。');
    if (choice === 'digits') return result('incorrect', '数字在 0—9 的范围，并不保证各位数字和能被 3 整除。');
    if (choice === 'first-only') return result('incorrect', '只知道前一部分可被 3 整除还不够；必须说明剩下的正是各位数字和。');
    return result('incorrect', '检查拆解式中哪一部分总是 3 的倍数、剩余部分是什么。');
  }

  function checkSquarePrediction(item, text) {
    const raw = String(text).trim();
    if (!/^\d{1,5}$/.test(raw)) return result('empty', '请输入平方的非负整数结果，不要写单位或其他符号。');
    const value = Number(raw);
    if (value === item.square) return result('correct', `${item.side}²=${item.square}。现在用四块面积解释这个结果。`);
    return result('incorrect', `先把边长 ${item.side} 看成 ${item.tens * 10}+5；平方有一块大正方形、两个长条和一块小正方形。`);
  }

  function checkSquareSplit(choice) {
    if (!choice) return result('empty', '先选出四块面积之和。');
    if (choice === 'correct') return result('correct', '四块面积是 100a²、50a、50a、25，合计 100a²+100a+25。');
    if (choice === 'no-strips') return result('incorrect', '少算了两块 10a×5 的长条。');
    if (choice === 'one-strip') return result('incorrect', '只算了一块 10a×5；上方和右侧各有一块。');
    return result('incorrect', '请把两块长条都计入面积。');
  }

  function checkSquareReason(choice) {
    if (!choice) return result('empty', '选出把一般式写成整百加 25 的依据。');
    if (choice === 'factor') return result('correct', '100a²+100a=100a(a+1)，所以 (10a+5)²=a(a+1)×100+25；a 是 1—9 的任意整数。');
    if (choice === 'wrong-factor') return result('incorrect', 'a(a+1)=a²+a，没有额外的 1；展开式必须与四块面积相等。');
    if (choice === 'last-five') return result('incorrect', '5×5=25 只解释最后一块，还需要解释前面的整百数为何是 a(a+1)。');
    return result('incorrect', '想一想 100a² 和 100a 的公因式。');
  }

  return {fourDigit, endingFive, checkDivPrediction, checkDivSplit, checkDivReason,
    checkSquarePrediction, checkSquareSplit, checkSquareReason};
});
