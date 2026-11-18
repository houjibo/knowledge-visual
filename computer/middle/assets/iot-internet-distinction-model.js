(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.IotInternetDistinctionModel = model;
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
    id: 'fictional-connection-cases',
    title: '日常连接案例辨析（虚构）',
    boundary: '本页所有案例都是本地固定脚本写出的教学样例，不连接真实设备或网络、不发送网络请求，也不收集自由文本或真实个人信息。',
    note: '物联网常以互联网为网络基础，区别在于是否连接物理设备、自动采集数据或远程控制设备。'
  });

  const CASES = deepFreeze([
    {
      id: 'instant-message',
      label: '用聊天软件给同学发文字消息',
      expected: 'internet',
      subtype: 'human-to-human',
      reason: '人与人之间通过网络通信，没有传感器自动上报或设备控制，属于互联网。'
    },
    {
      id: 'video-streaming',
      label: '在视频网站观看科普短片',
      expected: 'internet',
      subtype: 'content-access',
      reason: '人主动获取网络内容，不涉及物理设备的数据采集或控制，属于互联网。'
    },
    {
      id: 'temp-sensor',
      label: '教室温湿度传感器定时自动把读数发到平台',
      expected: 'iot',
      subtype: 'sensor-report',
      reason: '传感器无需人工操作就自动采集并上报物理环境数据，属于物联网。'
    },
    {
      id: 'watch-heart-rate',
      label: '智能手表持续记录心率并同步到健康应用',
      expected: 'iot',
      subtype: 'sensor-report',
      reason: '可穿戴设备的传感器自动采集身体数据并联网同步，属于物联网。'
    },
    {
      id: 'remote-ac',
      label: '在回家路上用手机远程打开家里的空调',
      expected: 'iot',
      subtype: 'remote-control',
      reason: '通过网络对物理设备（空调）发出控制指令，属于物联网。'
    },
    {
      id: 'remote-streetlight',
      label: '管理平台按光照远程调节街区路灯亮度',
      expected: 'iot',
      subtype: 'remote-control',
      reason: '系统联网控制真实的路灯设备并结合传感数据，属于物联网。'
    }
  ]);

  const CASE_IDS = deepFreeze(CASES.map(item => item.id));

  const THREE_ELEMENTS = deepFreeze({
    sensor: {
      id: 'temp-humidity-sensor',
      label: '温湿度传感器',
      role: 'sensor',
      detail: '采集房间的温度、湿度等物理量。'
    },
    network: {
      id: 'home-network',
      label: '家庭网络（连接互联网）',
      role: 'network',
      detail: '在传感器、手机和空调之间传送数据与指令。'
    },
    actuator: {
      id: 'air-conditioner',
      label: '空调（受控设备）',
      role: 'actuator',
      detail: '接收指令并真正执行制冷、开关等动作。'
    },
    distractors: [
      {id: 'phone-app', label: '手机上的控制 App', role: 'app'},
      {id: 'router-casing', label: '路由器外壳', role: 'object'}
    ]
  });

  const ELEMENT_FIELDS = deepFreeze(['sensor', 'network', 'actuator']);

  const IMPACT_OPTIONS = deepFreeze({
    benefits: [
      {id: 'remote-convenience', label: '可提前调节温度，更方便也可能更节能'},
      {id: 'no-difference', label: '没有任何便利，和普通电器完全一样'}
    ],
    risks: [
      {id: 'habit-privacy', label: '设备标识与长期读数可能推断出在家时间等生活习惯'},
      {id: 'no-risk', label: '联网设备不会带来任何隐私或安全问题'}
    ]
  });
  const EXPECTED_IMPACT = deepFreeze({benefit: 'remote-convenience', risk: 'habit-privacy'});

  function getTask() {
    return TASK;
  }

  function getCases() {
    return CASES;
  }

  function classify(selection) {
    if (!selection || typeof selection !== 'object' || Array.isArray(selection)) {
      throw new RangeError('selection must be an object keyed by case id');
    }
    const givenKeys = Object.keys(selection).sort();
    const expectedKeys = [...CASE_IDS].sort();
    if (givenKeys.length !== expectedKeys.length || givenKeys.some((key, index) => key !== expectedKeys[index])) {
      throw new RangeError('selection must contain exactly the six case ids');
    }
    for (const id of expectedKeys) {
      if (!['internet', 'iot'].includes(selection[id])) throw new RangeError(`unknown classification for ${id}`);
    }
    const mismatches = [];
    for (const item of CASES) {
      if (selection[item.id] !== item.expected) {
        mismatches.push({caseId: item.id, expected: item.expected, actual: selection[item.id]});
      }
    }
    if (mismatches.length === 0) return deepFreeze({correct: true, mismatches: [], reason: 'all-connections-classified'});
    return deepFreeze({correct: false, mismatches, reason: 'connection-types-mismatch'});
  }

  function getThreeElements() {
    return THREE_ELEMENTS;
  }

  function identifyElements(elements) {
    if (!elements || typeof elements !== 'object') throw new RangeError('elements must be an object');
    const givenKeys = Object.keys(elements).sort();
    const expectedKeys = [...ELEMENT_FIELDS].sort();
    if (givenKeys.length !== expectedKeys.length || givenKeys.some((key, index) => key !== expectedKeys[index])) {
      throw new RangeError('elements must contain exactly sensor, network and actuator');
    }
    const expected = {
      sensor: THREE_ELEMENTS.sensor.id,
      network: THREE_ELEMENTS.network.id,
      actuator: THREE_ELEMENTS.actuator.id
    };
    const allIds = [
      THREE_ELEMENTS.sensor.id,
      THREE_ELEMENTS.network.id,
      THREE_ELEMENTS.actuator.id,
      ...THREE_ELEMENTS.distractors.map(item => item.id)
    ];
    for (const key of expectedKeys) {
      if (!allIds.includes(elements[key])) throw new RangeError(`unknown element for ${key}`);
    }
    const mismatches = [];
    for (const key of expectedKeys) {
      if (elements[key] !== expected[key]) mismatches.push({field: key, expected: expected[key], actual: elements[key]});
    }
    if (mismatches.length === 0) return deepFreeze({correct: true, mismatches: [], reason: 'three-elements-identified'});
    return deepFreeze({correct: false, mismatches, reason: 'element-mismatch'});
  }

  function getImpactOptions() {
    return IMPACT_OPTIONS;
  }

  function judgeImpact(decision = {}) {
    if (!decision || typeof decision !== 'object' || Array.isArray(decision)) {
      throw new RangeError('decision must be an object with benefit and risk');
    }
    if (!Object.prototype.hasOwnProperty.call(decision, 'benefit') ||
        !Object.prototype.hasOwnProperty.call(decision, 'risk')) {
      throw new RangeError('decision must contain exactly benefit and risk');
    }
    const {benefit, risk} = decision;
    if (typeof benefit !== 'string' || typeof risk !== 'string') throw new TypeError('benefit and risk must be strings');
    const validBenefits = IMPACT_OPTIONS.benefits.map(item => item.id);
    const validRisks = IMPACT_OPTIONS.risks.map(item => item.id);
    if (!validBenefits.includes(benefit)) throw new RangeError('unknown benefit option');
    if (!validRisks.includes(risk)) throw new RangeError('unknown risk option');
    const mismatches = [];
    if (benefit !== EXPECTED_IMPACT.benefit) mismatches.push({field: 'benefit', expected: EXPECTED_IMPACT.benefit, actual: benefit});
    if (risk !== EXPECTED_IMPACT.risk) mismatches.push({field: 'risk', expected: EXPECTED_IMPACT.risk, actual: risk});
    if (mismatches.length === 0) return deepFreeze({correct: true, mismatches: [], reason: 'two-sided-impact-recognised'});
    return deepFreeze({correct: false, mismatches, reason: 'impact-mismatch'});
  }

  function getLocalSnapshot() {
    return deepFreeze({
      connectedToRealDevice: false,
      networkRequests: 0,
      entries: [
        {stage: 'classification', summary: '区分互联网的人与人通信和物联网的传感上报、远程控制。'},
        {stage: 'three-elements', summary: '在远程控制空调案例中识别传感器、网络和受控设备。'},
        {stage: 'impact', summary: '同时看到远程控制的便利与设备数据带来的隐私风险。'}
      ]
    });
  }

  return deepFreeze({
    getTask,
    getCases,
    classify,
    getThreeElements,
    identifyElements,
    getImpactOptions,
    judgeImpact,
    getLocalSnapshot
  });
});
