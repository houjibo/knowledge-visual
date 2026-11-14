/* Fixed teaching cases for comparing communication modes, not platform advice. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OnlineLearningModesModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MODES = Object.freeze({
    live: Object.freeze({label: '同步在线', rule: '需要联网，也需要同一时段；便于及时提问。'}),
    board: Object.freeze({label: '异步在线', rule: '需要联网，不要求同一时段；回复可能延后，并可留下文字记录。'}),
    face: Object.freeze({label: '当面交流', rule: '需要同地、同一时段；不依赖网络。'})
  });
  const REASONS = Object.freeze({
    immediate: '可在共同时间及时问答',
    flexible: '错时仍可留文字，等待后续回复',
    nearby: '同地可直接讨论且无需网络'
  });
  const CASES = Object.freeze({
    'remote-question': Object.freeze({
      title: '远程答疑 · 有共同时间', task: '两地同学今晚要讨论一道题，希望能及时追问。',
      place: '两地', internet: true, overlap: true, times: {a: '18:00', b: '18:00'},
      recommended: 'live', reason: 'immediate',
      explanation: '两地无法直接当面讨论；共同时间和网络都具备，同步在线更贴合及时追问。异步留言也能交流，但回复不保证立刻到达。'
    }),
    'remote-shifted': Object.freeze({
      title: '远程答疑 · B 改为错时', task: '仍是同一道题和两地同学，但 B 只能更晚查看消息；问题需要继续讨论。',
      place: '两地', internet: true, overlap: false, times: {a: '18:00', b: '20:00'},
      recommended: 'board', reason: 'flexible',
      explanation: '共同时间消失后，同步在线暂不可行；异步留言允许 B 晚些阅读和回复，但不能保证即时答疑。'
    }),
    'club-plan': Object.freeze({
      title: '社团活动 · 错时讨论', task: '两地社团成员明天前收集活动建议，希望保留可回看的文字意见。',
      place: '两地', internet: true, overlap: false, times: {a: '17:00', b: '20:00'},
      recommended: 'board', reason: 'flexible',
      explanation: '成员时间不重合，异步在线可先留下建议，其他人稍后阅读；这种方式有记录，但回应可能延后。'
    }),
    'classroom-offline': Object.freeze({
      title: '同地讨论 · 暂无网络', task: '两位同学在同一教室，要马上对照实验记录，网络暂时不可用。',
      place: '同一教室', internet: false, overlap: true, times: {a: '15:00', b: '15:00'},
      recommended: 'face', reason: 'nearby',
      explanation: '两人同地且同一时段，当面交流可立即讨论，也不依赖网络。此时两种在线方式都缺少连接条件。'
    })
  });

  function scenario(key) {
    if (!Object.hasOwn(CASES, key)) throw new Error('未知情境');
    return CASES[key];
  }

  function feasibleFor(key) {
    const current = scenario(key);
    return {
      live: current.internet && current.overlap,
      board: current.internet,
      face: current.place === '同一教室' && current.overlap
    };
  }

  function assess(key, mode, reason) {
    const current = scenario(key);
    if (!mode || !reason) return {status: 'incomplete', feedback: '先选择交流方式和主要依据。'};
    if (!Object.hasOwn(MODES, mode) || !Object.hasOwn(REASONS, reason)) throw new Error('未知选择');
    const feasible = feasibleFor(key);
    const modeCorrect = mode === current.recommended;
    const reasonCorrect = reason === current.reason;
    let feedback = '';
    if (!modeCorrect) {
      feedback += feasible[mode]
        ? `${MODES[mode].label}在当前条件下可行，但不优先满足这项任务。`
        : `${MODES[mode].label}在当前条件下不可行：${MODES[mode].rule}`;
    }
    if (!reasonCorrect) feedback += `主要依据应是“${REASONS[current.reason]}”。`;
    feedback += `本情境推荐${MODES[current.recommended].label}。${current.explanation}`;
    return {
      status: modeCorrect && reasonCorrect ? 'correct' : 'wrong',
      modeCorrect, reasonCorrect, feasible,
      expected: {mode: current.recommended, reason: current.reason}, feedback
    };
  }

  function checkConclusion(value) {
    if (!value) return {status: 'incomplete', feedback: '先选择一条结论。'};
    if (!['conditional', 'online-always', 'offline-always'].includes(value)) throw new Error('未知结论');
    return value === 'conditional'
      ? {status: 'correct', feedback: '对。距离、共同时间、网络和任务要求会改变合适的交流方式；现实选择还要核对平台、设备、隐私和使用规范。'}
      : {status: 'wrong', feedback: value === 'online-always'
        ? '在线并非总是更合适：同地断网时可以直接当面讨论。'
        : '线下也并非总是更合适：两地有网络和共同时间时，可用同步在线及时追问。'};
  }

  return {MODES, REASONS, CASES, scenario, feasibleFor, assess, checkConclusion};
});
