(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.HighDevicePlatformChoiceModel = model;
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
    id: 'fictional-field-geology-study',
    title: '野外地质考察学习任务（虚构）',
    requirement: '在没有网络的野外拍照并离线记录，晚间回到营地小组汇总，回校后在稳定网络下处理数据并出报告。',
    boundary: '本页所有设备、平台和协作数据都是本地固定脚本写出的教学演示，不连接真实设备或平台、不发送网络请求，也不收集自由文本或真实个人信息。',
    note: '设备与平台均为去品牌化的功能类别；判断基于本例的联网、协作和数据条件，不同任务的合理选择不同。'
  });

  const DEVICES = deepFreeze([
    {
      id: 'rugged-tablet',
      label: '加固平板（去品牌化类别）',
      capabilities: {offline: true, camera: true, portable: true, dataProcessing: 'basic'},
      detail: '可离线运行记录程序、带相机、轻便且续航长。'
    },
    {
      id: 'lightweight-laptop',
      label: '轻薄办公本（去品牌化类别）',
      capabilities: {offline: false, camera: true, portable: true, dataProcessing: 'strong'},
      detail: '数据处理能力强，但部分记录与同步依赖联网，野外续航有限。'
    },
    {
      id: 'desktop-workstation',
      label: '桌面工作站（去品牌化类别）',
      capabilities: {offline: false, camera: false, portable: false, dataProcessing: 'strongest'},
      detail: '性能最强但需要固定电源和场地，无法带到野外。'
    },
    {
      id: 'feature-phone',
      label: '功能机（去品牌化类别）',
      capabilities: {offline: true, camera: true, portable: true, dataProcessing: 'none'},
      detail: '便携且续航长，但不能安装考察记录程序，也无法整理结构化数据。'
    }
  ]);

  const DEVICE_VERDICT = deepFreeze({
    'rugged-tablet': {correct: true, reason: 'offline-camera-portable-fit'},
    'lightweight-laptop': {correct: false, reason: 'network-dependent-weak-battery'},
    'desktop-workstation': {correct: false, reason: 'not-portable-needs-power'},
    'feature-phone': {correct: false, reason: 'cannot-run-recording-program'}
  });

  const PLATFORMS = deepFreeze([
    {
      id: 'offline-notes',
      label: '离线本地记录工具',
      capabilities: {offline: true, collaborativeEditing: false, realtimeSync: false, streamingOnly: false}
    },
    {
      id: 'cloud-doc',
      label: '实时云端协作文档',
      capabilities: {offline: false, collaborativeEditing: true, realtimeSync: true, streamingOnly: false}
    },
    {
      id: 'video-site',
      label: '仅在线视频网站',
      capabilities: {offline: false, collaborativeEditing: false, realtimeSync: false, streamingOnly: true}
    }
  ]);

  const PLATFORM_IDS = deepFreeze(PLATFORMS.map(item => item.id));
  const STAGES = deepFreeze([
    {id: 'field', label: '野外阶段', condition: '无网络，需要离线拍照与记录'},
    {id: 'camp', label: '营地阶段', condition: '晚间有热点，小组需要共同汇总'},
    {id: 'school', label: '回校阶段', condition: '稳定联网，需要协作处理数据并出报告'}
  ]);
  const EXPECTED_STAGE_PLATFORM = deepFreeze({field: 'offline-notes', camp: 'cloud-doc', school: 'cloud-doc'});

  const PLATFORM_DATA = deepFreeze({
    contributions: [
      {memberId: 'member-a', edits: 18, lastSyncHoursAgo: 3, active: true},
      {memberId: 'member-b', edits: 15, lastSyncHoursAgo: 5, active: true},
      {memberId: 'member-c', edits: 1, lastSyncHoursAgo: 72, active: false}
    ],
    syncConflict: {
      description: '离线采集的野外记录与云端版本在同一字段不同，出现一次同步冲突。',
      recommended: 'keep-both-merge'
    }
  });
  const EXPECTED_ACTIVE = deepFreeze(['member-a', 'member-b']);
  const CONFLICT_CHOICES = deepFreeze(['keep-both-merge', 'overwrite-with-cloud']);

  function getTask() {
    return TASK;
  }

  function getDevices() {
    return DEVICES;
  }

  function getPlatforms() {
    return PLATFORMS;
  }

  function getStages() {
    return STAGES;
  }

  function chooseDevice(deviceId) {
    const verdict = DEVICE_VERDICT[deviceId];
    if (!verdict) throw new RangeError('unknown device');
    return deepFreeze({...verdict});
  }

  function matchPlatforms(mapping) {
    if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) {
      throw new RangeError('mapping must be an object keyed by stage');
    }
    const expectedKeys = STAGES.map(item => item.id).sort();
    const givenKeys = Object.keys(mapping).sort();
    if (givenKeys.length !== expectedKeys.length || givenKeys.some((key, index) => key !== expectedKeys[index])) {
      throw new RangeError('mapping must contain exactly field, camp and school');
    }
    for (const key of expectedKeys) {
      if (typeof mapping[key] !== 'string') throw new TypeError(`mapping.${key} must be a string`);
      if (!PLATFORM_IDS.includes(mapping[key])) throw new RangeError(`unknown platform for ${key}`);
    }
    const mismatches = [];
    for (const stage of STAGES) {
      const expected = EXPECTED_STAGE_PLATFORM[stage.id];
      const actual = mapping[stage.id];
      if (actual !== expected) mismatches.push({stage: stage.id, expected, actual});
    }
    if (mismatches.length === 0) {
      return deepFreeze({correct: true, mismatches: [], reason: 'all-stages-match-conditions'});
    }
    return deepFreeze({correct: false, mismatches, reason: 'stage-condition-mismatch'});
  }

  function getPlatformData() {
    return PLATFORM_DATA;
  }

  function sameSet(actual, expected) {
    if (!Array.isArray(actual) || actual.length !== expected.length) return false;
    const left = [...actual].sort();
    const right = [...expected].sort();
    return left.every((value, index) => value === right[index]);
  }

  function decideCollaboration({activeMembers, conflictAction} = {}) {
    if (!Array.isArray(activeMembers)) throw new TypeError('activeMembers must be an array');
    if (typeof conflictAction !== 'string') throw new TypeError('conflictAction must be a string');
    if (!CONFLICT_CHOICES.includes(conflictAction)) throw new RangeError('unknown conflict action');
    const mismatches = [];
    if (!sameSet(activeMembers, EXPECTED_ACTIVE)) {
      mismatches.push({field: 'activeMembers', expected: [...EXPECTED_ACTIVE], actual: [...activeMembers]});
    }
    if (conflictAction !== PLATFORM_DATA.syncConflict.recommended) {
      mismatches.push({
        field: 'conflictAction',
        expected: PLATFORM_DATA.syncConflict.recommended,
        actual: conflictAction,
        reason: 'overwrite-loses-offline-data'
      });
    }
    if (mismatches.length === 0) {
      return deepFreeze({correct: true, mismatches: [], reason: 'data-supports-collaboration-decision'});
    }
    return deepFreeze({correct: false, mismatches, reason: 'collaboration-decision-mismatch'});
  }

  function getLocalSnapshot() {
    return deepFreeze({
      connectedToRealPlatform: false,
      networkRequests: 0,
      entries: [
        {stage: 'device', summary: '选用可离线、带相机且便携的加固平板。'},
        {stage: 'platform', summary: '野外离线记录，营地与回校用云端协作文档汇总。'},
        {stage: 'platform-data', summary: '依据编辑与同步数据识别持续协作者，冲突保留双方版本再合并。'}
      ]
    });
  }

  return deepFreeze({
    getTask,
    getDevices,
    getPlatforms,
    getStages,
    chooseDevice,
    matchPlatforms,
    getPlatformData,
    decideCollaboration,
    getLocalSnapshot
  });
});
