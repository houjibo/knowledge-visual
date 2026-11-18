(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.IotExperimentProcedureModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function deepFreeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.freeze(value);
      for (const child of Object.values(value)) deepFreeze(child);
    }
    return value;
  }

  const TASK = deepFreeze({
    id: 'fictional-temp-humidity-experiment',
    title: '温湿度采集实验的规程与数据流程（先修训练）',
    boundary: '本页实验为本地固定脚本写出的虚构教学案例，不连接真实设备或网络、不发送网络请求，也不收集自由文本或真实数据。',
    prepNote: '这是真实器材实验前的规程与数据流程先修训练，不能替代亲手搭建原型与真实设备数据收发，动手实践仍需在实验室完成。'
  });

  // Step 1: safety procedures
  const SAFETY_RULES = deepFreeze([
    {id: 'check-before-power', label: '通电前检查接线是否牢固、电源规格是否正确', safe: true, reason: '先检查可避免短路和设备损坏。'},
    {id: 'unplug-when-wiring', label: '接线或改线时先断开电源', safe: true, reason: '断电插拔是基本安全规程。'},
    {id: 'anti-static', label: '接触模块前释放静电', safe: true, reason: '静电可能击穿电子元件。'},
    {id: 'approved-power', label: '使用规定电压和配套电源', safe: true, reason: '规范电源保障设备和人身安全。'},
    {id: 'power-off-on-anomaly', label: '发现冒烟或异味时立即断电并报告', safe: true, reason: '异常先断电可防止事故扩大。'},
    {id: 'hot-plug', label: '设备通电时直接插拔传感器接线', safe: false, reason: '带电插拔可能短路或损坏设备。'},
    {id: 'unknown-power', label: '私接来源不明的电源', safe: false, reason: '不明电源电压不可控，有安全隐患。'},
    {id: 'wet-hands', label: '湿手操作电源和接线', safe: false, reason: '潮湿环境有触电风险。'}
  ]);
  const SAFETY_IDS = deepFreeze(SAFETY_RULES.map(r => r.id));

  // Step 2: correct procedure order (fixed sequence)
  const PROCEDURE_STEPS = deepFreeze([
    {id: 'define-goal', label: '明确实验目的与要采集的温湿度数据'},
    {id: 'check-kit', label: '检查传感器、网关、导线等器材是否齐全完好'},
    {id: 'wire-circuit', label: '按接线图连接传感器与网关'},
    {id: 'power-collect', label: '检查无误后通电并开始采集数据'},
    {id: 'record-data', label: '如实记录读数，标注时间和单位'},
    {id: 'power-off-tidy', label: '断电并整理器材、归档记录'}
  ]);
  const STEP_IDS = deepFreeze(PROCEDURE_STEPS.map(s => s.id));

  // Step 3: data flow stages
  const DATA_STAGES = deepFreeze([
    {id: 'device-collect', label: '传感器定时产生温湿度读数', stageKey: 'collect', stageLabel: '设备采集'},
    {id: 'network-transfer', label: '数据通过网络从设备传到网关/平台', stageKey: 'transfer', stageLabel: '网络传输'},
    {id: 'platform-aggregate', label: '多个设备的数据在平台汇总', stageKey: 'aggregate', stageLabel: '平台汇集'},
    {id: 'analyze-use', label: '对汇集数据做分析并用于决策', stageKey: 'analyze', stageLabel: '分析使用'},
    {id: 'archive', label: '数据按保留要求归档留存', stageKey: 'archive', stageLabel: '归档留存'}
  ]);
  const STAGE_IDS = deepFreeze(DATA_STAGES.map(s => s.id));
  const STAGE_KEYS = deepFreeze(DATA_STAGES.map(s => s.stageKey));

  function getTask() {
    return TASK;
  }

  function getSafetyRules() {
    return SAFETY_RULES;
  }

  function judgeSafety(selection) {
    if (!selection || typeof selection !== 'object' || Array.isArray(selection)) {
      throw new RangeError('selection must be an object keyed by rule id');
    }
    const givenKeys = Object.keys(selection).sort();
    const expectedKeys = [...SAFETY_IDS].sort();
    if (givenKeys.length !== expectedKeys.length || givenKeys.some((key, index) => key !== expectedKeys[index])) {
      throw new RangeError('selection must contain exactly all safety rule ids');
    }
    for (const id of expectedKeys) {
      if (!['safe', 'unsafe'].includes(selection[id])) throw new RangeError(`unknown safety value for ${id}`);
    }
    const mismatches = [];
    for (const rule of SAFETY_RULES) {
      const expected = rule.safe ? 'safe' : 'unsafe';
      if (selection[rule.id] !== expected) {
        mismatches.push({ruleId: rule.id, expected, actual: selection[rule.id]});
      }
    }
    if (mismatches.length === 0) return deepFreeze({correct: true, mismatches: [], reason: 'safety-judged'});
    return deepFreeze({correct: false, mismatches, reason: 'safety-mismatch'});
  }

  function getProcedureSteps() {
    return PROCEDURE_STEPS;
  }

  function sameArray(a, b) {
    return Array.isArray(a) && Array.isArray(b) &&
      a.length === b.length && a.every((value, index) => value === b[index]);
  }

  function orderProcedure(order) {
    if (!Array.isArray(order)) throw new RangeError('order must be an array of step ids');
    if (order.length !== STEP_IDS.length) throw new RangeError('order must contain exactly all procedure steps');
    if (order.some(id => !STEP_IDS.includes(id))) throw new RangeError('unknown step id in order');
    if (new Set(order).size !== order.length) throw new RangeError('order must not contain duplicate steps');
    const mismatches = [];
    order.forEach((id, index) => {
      if (id !== STEP_IDS[index]) mismatches.push({position: index, expected: STEP_IDS[index], actual: id});
    });
    if (mismatches.length === 0) return deepFreeze({correct: true, mismatches: [], reason: 'procedure-ordered'});
    return deepFreeze({correct: false, mismatches, reason: 'order-mismatch'});
  }

  function getDataStages() {
    return DATA_STAGES;
  }

  function matchDataFlow(selection) {
    if (!selection || typeof selection !== 'object' || Array.isArray(selection)) {
      throw new RangeError('selection must be an object keyed by stage id');
    }
    const givenKeys = Object.keys(selection).sort();
    const expectedKeys = [...STAGE_IDS].sort();
    if (givenKeys.length !== expectedKeys.length || givenKeys.some((key, index) => key !== expectedKeys[index])) {
      throw new RangeError('selection must contain exactly all data stage ids');
    }
    for (const id of expectedKeys) {
      if (!STAGE_KEYS.includes(selection[id])) throw new RangeError(`unknown stage key for ${id}`);
    }
    const mismatches = [];
    for (const stage of DATA_STAGES) {
      if (selection[stage.id] !== stage.stageKey) {
        mismatches.push({stageId: stage.id, expected: stage.stageKey, actual: selection[stage.id]});
      }
    }
    if (mismatches.length === 0) return deepFreeze({correct: true, mismatches: [], reason: 'data-flow-matched'});
    return deepFreeze({correct: false, mismatches, reason: 'flow-mismatch'});
  }

  function getLocalSnapshot() {
    return deepFreeze({
      connectedToRealDevice: false,
      networkRequests: 0,
      entries: [
        {stage: 'safety', summary: '判断通电、插拔、静电与异常处理的安全规程。'},
        {stage: 'procedure', summary: '按目的、器材、连接、采集、记录、整理的顺序排列实验步骤。'},
        {stage: 'data-flow', summary: '梳理采集、传输、汇集、分析、归档的数据流程。'}
      ]
    });
  }

  return deepFreeze({
    getTask,
    getSafetyRules,
    judgeSafety,
    getProcedureSteps,
    orderProcedure,
    getDataStages,
    matchDataFlow,
    getLocalSnapshot
  });
});
