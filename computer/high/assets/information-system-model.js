(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.InformationSystemModel = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const ACTORS = Object.freeze({
    'S-01': Object.freeze({label: '学生 S-01', role: 'student'}),
    'S-02': Object.freeze({label: '学生 S-02', role: 'student'}),
    'L-01': Object.freeze({label: '馆员 L-01', role: 'librarian'})
  });
  const ELEMENT_ANSWERS = Object.freeze({input: 'request', rule: 'policy', data: 'inventory', output: 'decision'});
  const OUTCOME_LABELS = Object.freeze({
    borrowed: '借阅成功', limit: '超过借阅上限', 'out-of-stock': '库存不足',
    restocked: '补库存成功', forbidden: '未授权修改被阻止', offline: '断线，服务端未收到',
    'stock-full': '库存已满', 'wrong-role': '角色不适合借阅'
  });

  function createState(stock = 2) {
    if (!Number.isInteger(stock) || stock < 0 || stock > 4) throw new RangeError('库存起点须为 0–4 本整数。');
    return {stock, loans: {'S-01': 0, 'S-02': 0}, revision: 0};
  }

  function cloneState(state) {
    return {stock: state.stock, loans: {'S-01': state.loans['S-01'], 'S-02': state.loans['S-02']}, revision: state.revision};
  }

  function validState(state) {
    return state && typeof state === 'object' && Number.isInteger(state.stock) && state.stock >= 0 && state.stock <= 4 &&
      state.loans && typeof state.loans === 'object' &&
      ['S-01', 'S-02'].every(id => Number.isInteger(state.loans[id]) && state.loans[id] >= 0 && state.loans[id] <= 2) &&
      Number.isSafeInteger(state.revision) && state.revision >= 0;
  }

  function validate(config, request, state) {
    if (!config || ![1, 2].includes(config.loanLimit) || typeof config.accessCheck !== 'boolean' ||
        !['online', 'offline'].includes(config.connection)) throw new RangeError('无效系统规则或连接状态。');
    if (!request || !ACTORS[request.actor] || !['borrow', 'restock'].includes(request.action))
      throw new RangeError('无效请求角色或操作。');
    if (!validState(state)) throw new RangeError('无效库存、借阅计数或版本状态。');
  }

  function checkElements(choice) {
    const parts = {};
    for (const [key, answer] of Object.entries(ELEMENT_ANSWERS)) parts[key] = !!choice && choice[key] === answer;
    return {...parts, ready: Object.values(parts).every(Boolean)};
  }

  function simulate(config, request, state) {
    validate(config, request, state);
    const before = cloneState(state), after = cloneState(state);
    const actor = ACTORS[request.actor];
    const action = request.action === 'borrow' ? '借阅 B-01' : '补充 B-01 库存 1 本';
    const trace = [{stage: 'input', state: 'passed', text: `终端收到 ${actor.label} 的“${action}”输入。`}];
    let outcome, reason, risk = false;

    if (config.connection === 'offline') {
      outcome = 'offline';
      reason = '连接断开，请求停在终端；服务端没有收到，也没有修改库存。';
      trace.push(
        {stage: 'network', state: 'blocked', text: '模拟连接断开：请求未送达处理程序。'},
        {stage: 'rules', state: 'skipped', text: '处理程序未收到请求，规则没有运行。'},
        {stage: 'data', state: 'skipped', text: '数据保持原样。'}
      );
    } else {
      trace.push({stage: 'network', state: 'passed', text: '模拟连接可用：请求送达处理程序。'});
      if (request.action === 'borrow') {
        if (actor.role !== 'student') {
          outcome = 'wrong-role'; reason = '本原型只接受学生本人发起借阅；馆员不能用这条请求代替学生。';
        } else if (after.loans[request.actor] >= config.loanLimit) {
          outcome = 'limit'; reason = `${actor.label} 已借 ${after.loans[request.actor]} 本，达到每人 ${config.loanLimit} 本上限。`;
        } else if (after.stock === 0) {
          outcome = 'out-of-stock'; reason = 'B-01 当前库存为 0，本次借阅不能完成。';
        } else {
          outcome = 'borrowed'; reason = `${actor.label} 借阅 B-01 成功；库存减 1，本人借阅计数加 1。`;
          after.stock--; after.loans[request.actor]++; after.revision++;
        }
      } else if (config.accessCheck && actor.role !== 'librarian') {
        outcome = 'forbidden'; reason = '处理程序的角色检查阻止学生修改馆藏库存。';
      } else if (after.stock === 4) {
        outcome = 'stock-full'; reason = '本原型库存上限为 4 本，本次补库存没有写入。';
      } else {
        outcome = 'restocked';
        risk = actor.role !== 'librarian' && !config.accessCheck;
        reason = risk
          ? '学生补库存被错误放行：处理程序关闭了角色检查，这是故意不安全的教学配置。'
          : '馆员补库存成功；库存加 1。';
        after.stock++; after.revision++;
      }
      const changed = after.revision !== before.revision;
      trace.push(
        {stage: 'rules', state: changed ? 'passed' : 'blocked', text: changed ? '处理规则允许该请求。' : `处理规则拒绝写入：${reason}`},
        {stage: 'data', state: changed ? 'changed' : 'unchanged', text: changed ? `库存 ${before.stock} → ${after.stock}；版本 ${before.revision} → ${after.revision}。` : '库存、借阅计数和版本均未变化。'}
      );
    }
    trace.push({stage: 'output', state: 'reported', text: `${OUTCOME_LABELS[outcome]}。${reason}`});
    return {outcome, reason, risk, changed: after.revision !== before.revision, before, after, trace};
  }

  return {ACTORS, ELEMENT_ANSWERS, OUTCOME_LABELS, createState, checkElements, simulate};
});
