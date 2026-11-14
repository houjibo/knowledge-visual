/* Exact decimal checks for finite rational-number context problems. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.KVRationalContextModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const scenarios = [
    {
      id: 'warming', label: '温度上升 · 跨过零',
      story: '某地清晨气温为 −6°C，午后升高 9°C。午后的气温是多少？',
      start: '-6', change: '9', unit: '°C', move: '向右移动 9 个单位',
      startMeaning: '清晨在零下 6°C', resultMeaning: '午后在零上 3°C',
      expressions: [
        { id: 'warm-start', text: '6 + 9', reason: '清晨是零下 6°C，起点应写成 −6。' },
        { id: 'warm-right', text: '(−6) + 9', correct: true },
        { id: 'warm-direction', text: '(−6) − 9', reason: '升高表示从 −6 向右移动 9，不是继续下降。' }
      ],
      interpretations: [
        { id: 'warm-below', text: '午后仍在零下 3°C', reason: '算得正数，终点在零的右侧。' },
        { id: 'warm-above', text: '午后在零上 3°C', correct: true },
        { id: 'warm-unit', text: '午后在零上 3m', reason: '题目是温度，结果应使用 °C。' }
      ]
    },
    {
      id: 'height', label: '相对高度 · 穿过基准面',
      story: '一个测量点原来高于基准面 2m，随后下降 7m。末位置相对基准面是多少？',
      start: '2', change: '-7', unit: 'm', move: '向左移动 7 个单位',
      startMeaning: '起点高于基准面 2m', resultMeaning: '末位置低于基准面 5m',
      expressions: [
        { id: 'height-add', text: '2 + 7', reason: '下降应向数轴左侧移动，不能把 7 当成上升。' },
        { id: 'height-reverse', text: '7 − 2', reason: '先写起点 +2，再减去下降的 7。' },
        { id: 'height-left', text: '2 − 7', correct: true }
      ],
      interpretations: [
        { id: 'height-above', text: '末位置高于基准面 5m', reason: '结果是负数，应位于基准面下方。' },
        { id: 'height-below', text: '末位置低于基准面 5m', correct: true },
        { id: 'height-unit', text: '末位置低于基准面 5°C', reason: '题目是相对高度，结果应使用 m。' }
      ]
    },
    {
      id: 'robot', label: '机器人位移 · 小数',
      story: '机器人位于原点左侧 2.5m，向右移动 1.75m。现在位于原点哪一侧、多远？',
      start: '-2.5', change: '1.75', unit: 'm', move: '向右移动 1.75 个单位',
      startMeaning: '起点在原点左侧 2.5m', resultMeaning: '终点在原点左侧 0.75m',
      expressions: [
        { id: 'robot-distance', text: '2.5 + 1.75', reason: '起点在原点左侧，应以 −2.5 表示。' },
        { id: 'robot-left', text: '(−2.5) − 1.75', reason: '向右移动表示加上正的 1.75。' },
        { id: 'robot-right', text: '(−2.5) + 1.75', correct: true }
      ],
      interpretations: [
        { id: 'robot-right-side', text: '终点在原点右侧 0.75m', reason: '−0.75 在原点左侧。' },
        { id: 'robot-left-side', text: '终点在原点左侧 0.75m', correct: true },
        { id: 'robot-unit', text: '终点在原点左侧 0.75°C', reason: '题目是位移，结果应使用 m。' }
      ]
    },
    {
      id: 'cooling', label: '温度下降 · 小数',
      story: '某地白天气温为 +4°C，夜间降低 1.5°C。夜间气温是多少？',
      start: '4', change: '-1.5', unit: '°C', move: '向左移动 1.5 个单位',
      startMeaning: '白天在零上 4°C', resultMeaning: '夜间在零上 2.5°C',
      expressions: [
        { id: 'cool-start', text: '(−4) − 1.5', reason: '白天气温是零上 4°C，起点应写成 +4。' },
        { id: 'cool-down', text: '4 − 1.5', correct: true },
        { id: 'cool-up', text: '4 + 1.5', reason: '降低应从 +4 向左移动 1.5。' }
      ],
      interpretations: [
        { id: 'cool-below', text: '夜间在零下 2.5°C', reason: '结果为正数，仍在零的右侧。' },
        { id: 'cool-unit', text: '夜间在零上 2.5m', reason: '气温应使用 °C。' },
        { id: 'cool-above', text: '夜间在零上 2.5°C', correct: true }
      ]
    }
  ];

  function scenario(id) {
    const found = scenarios.find(item => item.id === id);
    if (!found) throw new Error('未知情境');
    return found;
  }

  function parseDecimal(input) {
    if (typeof input !== 'string') throw new Error('请输入十进制数');
    const text = input.trim().replace(/−/g, '-');
    if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(text)) throw new Error('只接受十进制数字，不含单位或算式');
    const sign = text.startsWith('-') ? -1n : 1n;
    const unsigned = text.replace(/^[+-]/, '');
    const [whole, fraction = ''] = unsigned.split('.');
    if ((whole + fraction).length > 14 || fraction.length > 6) throw new Error('数字超出本题范围');
    let value = sign * BigInt((whole || '0') + fraction);
    let scale = fraction.length;
    while (scale > 0 && value % 10n === 0n) { value /= 10n; scale--; }
    return { value, scale };
  }

  function formatDecimal(parsed) {
    const negative = parsed.value < 0n;
    const digits = (negative ? -parsed.value : parsed.value).toString();
    if (parsed.scale === 0) return (negative ? '-' : '') + digits;
    const padded = digits.padStart(parsed.scale + 1, '0');
    return (negative ? '-' : '') + padded.slice(0, -parsed.scale) + '.' + padded.slice(-parsed.scale);
  }

  function addDecimal(left, right) {
    const a = parseDecimal(left);
    const b = parseDecimal(right);
    const scale = Math.max(a.scale, b.scale);
    let value = a.value * 10n ** BigInt(scale - a.scale) + b.value * 10n ** BigInt(scale - b.scale);
    let reducedScale = scale;
    while (reducedScale > 0 && value % 10n === 0n) { value /= 10n; reducedScale--; }
    return formatDecimal({ value, scale: reducedScale });
  }

  function resultFor(id) {
    const item = scenario(id);
    return addDecimal(item.start, item.change);
  }

  function checkExpression(id, choiceId) {
    const item = scenario(id);
    const choice = item.expressions.find(option => option.id === choiceId);
    if (!choice) return { status: 'invalid', feedback: '先选择一个算式。' };
    return choice.correct
      ? { status: 'correct', feedback: `起点是 ${item.start}${item.unit}；${item.move}。现在独立算出末值。` }
      : { status: 'wrong', feedback: choice.reason };
  }

  function checkResult(id, answer) {
    const expected = resultFor(id);
    let parsed;
    try { parsed = parseDecimal(answer); }
    catch (error) { return { status: 'invalid', feedback: error.message, expected }; }
    const given = formatDecimal(parsed);
    if (given === expected) return { status: 'correct', feedback: `计算正确，末值为 ${expected}${scenario(id).unit}。再解释它在情境中的意思。`, expected };
    if (given.replace(/^-/, '') === expected.replace(/^-/, '')) {
      return { status: 'wrong-sign', feedback: '绝对大小相同，但正负号决定终点在零的哪一侧。', expected };
    }
    return { status: 'wrong', feedback: '结果还不对。沿数轴从起点按算式移动，检查是否跨过零。', expected };
  }

  function checkInterpretation(id, choiceId) {
    const choice = scenario(id).interpretations.find(option => option.id === choiceId);
    if (!choice) return { status: 'invalid', feedback: '先选择一句情境解释。' };
    return choice.correct
      ? { status: 'correct', feedback: `解释正确：${scenario(id).resultMeaning}。` }
      : { status: 'wrong', feedback: choice.reason };
  }

  return { scenarios, scenario, parseDecimal, addDecimal, resultFor, checkExpression, checkResult, checkInterpretation };
});
