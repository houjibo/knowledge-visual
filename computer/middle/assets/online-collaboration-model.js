/* A finite, single-browser model of independent copies and shared updates. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OnlineCollaborationModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const scenarioNames = Object.freeze({
    offline: '独立副本',
    online: '在线共享：两人连接',
    disconnected: '在线共享：C 暂时断线'
  });

  function validState(state) {
    if (!state || !Object.hasOwn(scenarioNames, state.scenario) ||
        !state.versions || !['a', 'b', 'c'].every(peer => [1, 2].includes(state.versions[peer])) ||
        !state.connected || typeof state.connected.b !== 'boolean' || typeof state.connected.c !== 'boolean' ||
        !Number.isInteger(state.steps) || state.steps < 0 || typeof state.edited !== 'boolean') {
      throw new Error('无效的资料传播状态');
    }
    if (state.scenario === 'offline' ? state.shared !== null : ![1, 2].includes(state.shared)) {
      throw new Error('共享版本与情境不符');
    }
    return state;
  }

  function initial(scenario) {
    if (!Object.hasOwn(scenarioNames, scenario)) throw new Error('未知情境');
    return {
      scenario, versions: {a: 1, b: 1, c: 1},
      shared: scenario === 'offline' ? null : 1,
      connected: {b: scenario !== 'offline', c: scenario === 'online'},
      edited: false, steps: 0
    };
  }

  function edit(state) {
    validState(state);
    if (state.edited) throw new Error('本轮已经修改资料');
    return {...state, versions: {...state.versions, a: 2},
      shared: state.scenario === 'offline' ? null : 2, edited: true};
  }

  function reconnectC(state) {
    validState(state);
    if (state.scenario !== 'disconnected' || !state.edited || state.steps < 1 || state.connected.c) {
      throw new Error('当前不能让 C 重连');
    }
    return {...state, connected: {...state.connected, c: true}};
  }

  function advance(state, manualTarget) {
    validState(state);
    if (!state.edited) throw new Error('请先让 A 修改资料');
    const versions = {...state.versions};
    if (state.scenario === 'offline') {
      if (!['b', 'c'].includes(manualTarget)) throw new Error('请选择手动递送目标');
      if (versions[manualTarget] === 2) throw new Error('该同伴已经拿到新版，请选另一位');
      versions[manualTarget] = 2;
    } else {
      if (manualTarget != null && manualTarget !== '') throw new Error('在线同步不选择手动递送目标');
      const peers = ['b', 'c'].filter(peer => state.connected[peer] && versions[peer] < state.shared);
      if (!peers.length) throw new Error(state.scenario === 'disconnected' && !state.connected.c
        ? '已连接者已同步；请先让 C 重连' : '两位同伴都已取得新版');
      peers.forEach(peer => { versions[peer] = state.shared; });
    }
    return {...state, versions, steps: state.steps + 1};
  }

  function assess(state, manualTarget, predictedB, predictedC) {
    if (predictedB == null || predictedB === '' || predictedC == null || predictedC === '') {
      return {status: 'incomplete', feedback: '先分别预测 B、C 在下一步之后看到的版本。'};
    }
    if (![1, 2].includes(predictedB) || ![1, 2].includes(predictedC)) throw new Error('未知预测版本');
    const next = advance(state, manualTarget);
    const correctB = predictedB === next.versions.b;
    const correctC = predictedC === next.versions.c;
    const delivered = ['b', 'c'].filter(peer => state.versions[peer] !== next.versions[peer]);
    const reason = state.scenario === 'offline'
      ? `本步把 A 的新版手动递送给 ${manualTarget.toUpperCase()}；其他副本不会自动变化。`
      : `本步模拟共享服务向已连接且尚未更新的 ${delivered.map(peer => peer.toUpperCase()).join('、')} 提供版本 2。${state.scenario === 'disconnected'
        ? state.connected.c ? 'C 已重连，本步取得新版。' : 'C 仍断线，保留旧版。'
        : ''}`;
    const result = `B 为版本 ${next.versions.b}，C 为版本 ${next.versions.c}。${reason}`;
    return {status: correctB && correctC ? 'correct' : 'wrong', correctB, correctC,
      expected: {b: next.versions.b, c: next.versions.c}, next, delivered,
      feedback: `${correctB && correctC ? '两位预测都正确。' : '预测需修正。'}${!correctB ? `B 应为版本 ${next.versions.b}。` : ''}${!correctC ? `C 应为版本 ${next.versions.c}。` : ''}${result}`};
  }

  function isComplete(state) {
    validState(state);
    return state.edited && state.versions.b === 2 && state.versions.c === 2;
  }

  function checkConclusion(value) {
    if (!value) return {status: 'incomplete', feedback: '先选择一条结论。'};
    if (!['conditional-sharing', 'always-instant', 'offline-impossible'].includes(value)) throw new Error('未知结论');
    return value === 'conditional-sharing'
      ? {status: 'correct', feedback: '对。共享服务让已连接成员取得同一更新；断线者仍需重连并完成后续同步。独立副本也能靠手动递送合作。'}
      : {status: 'wrong', feedback: value === 'always-instant'
        ? '联网不保证所有人立刻看到更新：断线者尚未收到，现实网络也可能有延迟。'
        : '独立副本也能通过手动递送共享，只是每次需要指定接收者。'};
  }

  return {scenarioNames, initial, edit, reconnectC, advance, assess, isComplete, checkConclusion};
});
