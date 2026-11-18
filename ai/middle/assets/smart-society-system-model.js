(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.KVSmartSocietySystemModel = model;
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
    id: 'fictional-smart-city',
    title: '智慧社会系统辨析（虚构城市案例）',
    boundary: '本页场景与系统都是本地固定脚本写出的去品牌化教学样例，不连接真实平台或网络、不发送网络请求，也不收集自由文本或真实机构信息。',
    note: '智慧社会系统强调多要素协同、数据驱动决策并连接成系统，单一自动化设备不等于智慧社会。'
  });

  // Step 1: six system elements mapped to a fictional smart-traffic system
  const SYSTEM_ELEMENTS = deepFreeze([
    {id: 'sensing', label: '感知设备', componentId: 'camera-sensor', componentLabel: '路口摄像头与流量传感器'},
    {id: 'network', label: '网络传输', componentId: 'comm-network', componentLabel: '通信网络（5G/光纤）'},
    {id: 'data-platform', label: '数据平台', componentId: 'data-center', componentLabel: '城市交通数据中心'},
    {id: 'decision', label: '智能决策', componentId: 'algo-dispatch', componentLabel: '信号配时算法调度'},
    {id: 'application', label: '应用服务', componentId: 'travel-app', componentLabel: '面向市民的出行 App'},
    {id: 'people-rule', label: '人与制度', componentId: 'management-rule', componentLabel: '管理规则与运维人员'}
  ]);
  const ELEMENT_IDS = deepFreeze(SYSTEM_ELEMENTS.map(item => item.id));
  const COMPONENT_IDS = deepFreeze(SYSTEM_ELEMENTS.map(item => item.componentId));
  const EXPECTED_MAPPING = deepFreeze(Object.fromEntries(SYSTEM_ELEMENTS.map(item => [item.id, item.componentId])));

  // Step 2: system vs single automation boundary
  const BOUNDARY_SCENARIOS = deepFreeze([
    {id: 'smart-traffic', label: '摄像头采集流量，数据中心分析后由算法实时调节全城信号，并通过出行 App 服务市民', isSystem: true, reason: '多要素协同、数据驱动决策并连接成系统。'},
    {id: 'smart-community', label: '门禁、烟感、电表数据汇入社区平台，异常自动告警并联动物业处置', isSystem: true, reason: '多设备数据汇聚、平台决策并联动多场景服务。'},
    {id: 'auto-door', label: '人靠近就自动打开的感应门', isSystem: false, reason: '只有固定规则和单一设备，没有数据平台与决策闭环。'},
    {id: 'timer-streetlight', label: '按固定时间开关的路灯', isSystem: false, reason: '仅定时控制，无感知数据采集与智能决策。'},
    {id: 'standalone-thermostat', label: '到设定温度就停机的单台空调温控器', isSystem: false, reason: '单设备阈值动作，未连接成多要素系统。'}
  ]);
  const SCENARIO_IDS = deepFreeze(BOUNDARY_SCENARIOS.map(item => item.id));

  // Step 3: autonomous control for society-scale systems
  const CONTROL_PRACTICES = deepFreeze([
    {id: 'data-self-hosting', label: '关键公共数据本地自持、可导出，不被单一外部服务锁定', enhancesControl: true},
    {id: 'open-standards', label: '采用开放标准与可互操作协议，保留可替代方案', enhancesControl: true},
    {id: 'localize-capability', label: '网络中断时核心调度仍能在本地维持基本运行', enhancesControl: true},
    {id: 'single-vendor-lockin', label: '系统核心完全依赖单一外部厂商，可被远程停服', enhancesControl: false}
  ]);
  const PRACTICE_IDS = deepFreeze(CONTROL_PRACTICES.map(item => item.id));
  const EXPECTED_CONTROL = deepFreeze(CONTROL_PRACTICES.filter(item => item.enhancesControl).map(item => item.id).sort());

  function getTask() {
    return TASK;
  }

  function getSystemElements() {
    return SYSTEM_ELEMENTS;
  }

  function matchElements(selection) {
    if (!selection || typeof selection !== 'object' || Array.isArray(selection)) {
      throw new RangeError('selection must be an object keyed by element id');
    }
    const givenKeys = Object.keys(selection).sort();
    const expectedKeys = [...ELEMENT_IDS].sort();
    if (givenKeys.length !== expectedKeys.length || givenKeys.some((key, index) => key !== expectedKeys[index])) {
      throw new RangeError('selection must contain exactly the six element ids');
    }
    for (const id of expectedKeys) {
      if (!COMPONENT_IDS.includes(selection[id])) throw new RangeError(`unknown component for ${id}`);
    }
    const mismatches = [];
    for (const element of SYSTEM_ELEMENTS) {
      if (selection[element.id] !== element.componentId) {
        mismatches.push({elementId: element.id, expected: element.componentId, actual: selection[element.id]});
      }
    }
    if (mismatches.length === 0) return deepFreeze({correct: true, mismatches: [], reason: 'elements-matched'});
    return deepFreeze({correct: false, mismatches, reason: 'element-mismatch'});
  }

  function getBoundaryScenarios() {
    return BOUNDARY_SCENARIOS;
  }

  function judgeBoundary(selection) {
    if (!selection || typeof selection !== 'object' || Array.isArray(selection)) {
      throw new RangeError('selection must be an object keyed by scenario id');
    }
    const givenKeys = Object.keys(selection).sort();
    const expectedKeys = [...SCENARIO_IDS].sort();
    if (givenKeys.length !== expectedKeys.length || givenKeys.some((key, index) => key !== expectedKeys[index])) {
      throw new RangeError('selection must contain exactly the five scenario ids');
    }
    for (const id of expectedKeys) {
      if (!['system', 'single-automation'].includes(selection[id])) {
        throw new RangeError(`unknown boundary value for ${id}`);
      }
    }
    const mismatches = [];
    for (const scenario of BOUNDARY_SCENARIOS) {
      const expected = scenario.isSystem ? 'system' : 'single-automation';
      if (selection[scenario.id] !== expected) {
        mismatches.push({scenarioId: scenario.id, expected, actual: selection[scenario.id]});
      }
    }
    if (mismatches.length === 0) return deepFreeze({correct: true, mismatches: [], reason: 'boundary-judged'});
    return deepFreeze({correct: false, mismatches, reason: 'boundary-mismatch'});
  }

  function getControlPractices() {
    return CONTROL_PRACTICES;
  }

  function sameSet(actual, expected) {
    if (!Array.isArray(actual)) return false;
    const left = [...actual].filter((value, index) => actual.indexOf(value) === index).sort();
    const right = [...expected].sort();
    return left.length === right.length && left.every((value, index) => value === right[index]);
  }

  function judgeControl(chosen) {
    if (!Array.isArray(chosen)) throw new TypeError('chosen practices must be an array');
    for (const id of chosen) {
      if (!PRACTICE_IDS.includes(id)) throw new RangeError(`unknown practice: ${id}`);
    }
    const chosenEnhancing = CONTROL_PRACTICES.filter(item => chosen.includes(item.id) && item.enhancesControl)
      .map(item => item.id);
    const chosenBlocked = CONTROL_PRACTICES.filter(item => chosen.includes(item.id) && !item.enhancesControl);
    const mismatches = [];
    if (!sameSet(chosenEnhancing, EXPECTED_CONTROL)) {
      for (const expected of EXPECTED_CONTROL) {
        if (!chosen.includes(expected)) mismatches.push({practiceId: expected, kind: 'missing'});
      }
    }
    for (const item of chosenBlocked) {
      mismatches.push({practiceId: item.id, kind: 'should-not-select'});
    }
    if (mismatches.length === 0) return deepFreeze({correct: true, mismatches: [], reason: 'control-recognised'});
    return deepFreeze({correct: false, mismatches, reason: 'control-mismatch'});
  }

  function getLocalSnapshot() {
    return deepFreeze({
      connectedToRealPlatform: false,
      networkRequests: 0,
      entries: [
        {stage: 'elements', summary: '把感知、网络、平台、决策、应用与制度对应到系统环节。'},
        {stage: 'boundary', summary: '区分多要素协同的智慧社会系统与单一自动化设备。'},
        {stage: 'control', summary: '用数据自持、开放标准和本地化增强系统自主可控。'}
      ]
    });
  }

  return deepFreeze({
    getTask,
    getSystemElements,
    matchElements,
    getBoundaryScenarios,
    judgeBoundary,
    getControlPractices,
    judgeControl,
    getLocalSnapshot
  });
});
