(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.IotDeviceIdentityModel = model;
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
    id: 'fictional-connected-devices',
    title: '联网设备的数字身份与隐私（虚构）',
    boundary: '本页所有设备、标识和数据都是本地固定脚本写出的教学样例，不连接真实设备或网络、不发送网络请求，也不收集自由文本或真实个人信息。',
    note: '设备标识不是人的身份证号，但长期设备数据同样可能关联到具体个人。'
  });

  const DEVICES = deepFreeze([
    {id: 'smart-meter', label: '智能电表', identityId: 'device-id', identityLabel: '设备 ID'},
    {id: 'smart-speaker', label: '智能音箱', identityId: 'serial-number', identityLabel: '序列号（SN）'},
    {id: 'wearable', label: '智能手环', identityId: 'mac-address', identityLabel: 'MAC 地址'},
    {id: 'gateway', label: '家用网关', identityId: 'cloud-account-binding', identityLabel: '云账号绑定标识'}
  ]);
  const DEVICE_IDS = deepFreeze(DEVICES.map(item => item.id));
  const IDENTITY_OPTIONS = deepFreeze(['device-id', 'serial-number', 'mac-address', 'cloud-account-binding', 'national-id']);
  const EXPECTED_IDENTITY = deepFreeze(Object.fromEntries(DEVICES.map(item => [item.id, item.identityId])));

  const DATA_FLOWS = deepFreeze([
    {
      id: 'smart-meter',
      label: '智能电表每小时上报一次用电读数（不含姓名）',
      inferable: 'daily-routine',
      inferableLabel: '在家时间和作息规律'
    },
    {
      id: 'location',
      label: '手机定位服务持续记录位置轨迹（不含姓名）',
      inferable: 'home-commute',
      inferableLabel: '住址、常去地点和通勤路线'
    },
    {
      id: 'wearable',
      label: '智能手环长期同步心率与睡眠数据（不含姓名）',
      inferable: 'health-condition',
      inferableLabel: '健康状况和运动习惯'
    }
  ]);
  const FLOW_IDS = deepFreeze(DATA_FLOWS.map(item => item.id));
  const INFERENCE_OPTIONS = deepFreeze(['daily-routine', 'home-commute', 'health-condition', 'none']);
  const EXPECTED_INFERENCE = deepFreeze(Object.fromEntries(DATA_FLOWS.map(item => [item.id, item.inferable])));

  const PROTECTION_FIELDS = deepFreeze(['anonymize', 'minimize']);
  const PROTECTION_OPTIONS = deepFreeze({
    anonymize: ['rotate-random-id', 'keep-fixed-id'],
    minimize: ['collect-required-only', 'collect-everything']
  });
  const EXPECTED_PROTECTION = deepFreeze({anonymize: 'rotate-random-id', minimize: 'collect-required-only'});

  function getTask() {
    return TASK;
  }

  function getDevices() {
    return DEVICES;
  }

  function getIdentityOptions() {
    return IDENTITY_OPTIONS;
  }

  function matchIdentities(selection) {
    if (!selection || typeof selection !== 'object' || Array.isArray(selection)) {
      throw new RangeError('selection must be an object keyed by device id');
    }
    const givenKeys = Object.keys(selection).sort();
    const expectedKeys = [...DEVICE_IDS].sort();
    if (givenKeys.length !== expectedKeys.length || givenKeys.some((key, index) => key !== expectedKeys[index])) {
      throw new RangeError('selection must contain exactly the four device ids');
    }
    for (const id of expectedKeys) {
      if (!IDENTITY_OPTIONS.includes(selection[id])) throw new RangeError(`unknown identity for ${id}`);
    }
    const mismatches = [];
    for (const device of DEVICES) {
      if (selection[device.id] !== device.identityId) {
        mismatches.push({deviceId: device.id, expected: device.identityId, actual: selection[device.id]});
      }
    }
    if (mismatches.length === 0) return deepFreeze({correct: true, mismatches: [], reason: 'all-identities-matched'});
    return deepFreeze({correct: false, mismatches, reason: 'identity-mismatch'});
  }

  function getDataFlows() {
    return DATA_FLOWS;
  }

  function judgeInference(selection) {
    if (!selection || typeof selection !== 'object' || Array.isArray(selection)) {
      throw new RangeError('selection must be an object keyed by flow id');
    }
    const givenKeys = Object.keys(selection).sort();
    const expectedKeys = [...FLOW_IDS].sort();
    if (givenKeys.length !== expectedKeys.length || givenKeys.some((key, index) => key !== expectedKeys[index])) {
      throw new RangeError('selection must contain exactly the three data flow ids');
    }
    for (const id of expectedKeys) {
      if (!INFERENCE_OPTIONS.includes(selection[id])) throw new RangeError(`unknown inference for ${id}`);
    }
    const mismatches = [];
    for (const flow of DATA_FLOWS) {
      if (selection[flow.id] !== flow.inferable) {
        mismatches.push({flowId: flow.id, expected: flow.inferable, actual: selection[flow.id]});
      }
    }
    if (mismatches.length === 0) return deepFreeze({correct: true, mismatches: [], reason: 'inference-recognised'});
    return deepFreeze({correct: false, mismatches, reason: 'inference-mismatch'});
  }

  function chooseProtection(decision) {
    if (!decision || typeof decision !== 'object') throw new RangeError('decision must be an object');
    const givenKeys = Object.keys(decision).sort();
    const expectedKeys = [...PROTECTION_FIELDS].sort();
    if (givenKeys.length !== expectedKeys.length || givenKeys.some((key, index) => key !== expectedKeys[index])) {
      throw new RangeError('decision must contain exactly anonymize and minimize');
    }
    for (const key of expectedKeys) {
      if (typeof decision[key] !== 'string') throw new TypeError(`${key} must be a string`);
      if (!PROTECTION_OPTIONS[key].includes(decision[key])) throw new RangeError(`unknown ${key} option`);
    }
    const mismatches = [];
    for (const key of expectedKeys) {
      if (decision[key] !== EXPECTED_PROTECTION[key]) {
        mismatches.push({field: key, expected: EXPECTED_PROTECTION[key], actual: decision[key]});
      }
    }
    if (mismatches.length === 0) return deepFreeze({correct: true, mismatches: [], reason: 'anonymized-and-minimized'});
    return deepFreeze({correct: false, mismatches, reason: 'protection-mismatch'});
  }

  function getLocalSnapshot() {
    return deepFreeze({
      connectedToRealDevice: false,
      networkRequests: 0,
      entries: [
        {stage: 'identity', summary: '区分设备数字身份标识与人的身份证号。'},
        {stage: 'inference', summary: '认识无姓名的长期设备数据仍可推断作息、位置与健康。'},
        {stage: 'protection', summary: '用随机轮换标识和数据最小化降低隐私风险。'}
      ]
    });
  }

  return deepFreeze({
    getTask,
    getDevices,
    getIdentityOptions,
    matchIdentities,
    getDataFlows,
    judgeInference,
    chooseProtection,
    getLocalSnapshot
  });
});
