(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.IotAutonomousControlModel = model;
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
    id: 'fictional-campus-iot-security',
    title: '校园物联网自主可控与安全（虚构）',
    boundary: '本页设备、来源和案例都是本地固定脚本写出的去品牌化教学样例，不连接真实设备或网络、不发送网络请求，也不收集自由文本或真实机构信息。',
    note: '自主可控取决于对技术、数据和服务连续性的掌控程度，不是按品牌国籍一刀切。'
  });

  // Step 1: supply chain trust
  const SUPPLY_SOURCES = deepFreeze([
    {id: 'official-store', label: '从设备厂商官方渠道采购，来源可核验', trustworthy: true, reason: '渠道正规、来源可追溯。'},
    {id: 'signed-update', label: '带官方数字签名校验的固件更新', trustworthy: true, reason: '签名可核验更新未被篡改。'},
    {id: 'unknown-drive', label: '从陌生网盘下载、来源不明的安装包', trustworthy: false, reason: '无法核验来源，可能含恶意代码。'},
    {id: 'tampered-firmware', label: '无签名校验、声称“破解版”的网关固件', trustworthy: false, reason: '可能被植入后门，属于不可信渠道。'}
  ]);
  const SOURCE_IDS = deepFreeze(SUPPLY_SOURCES.map(item => item.id));

  // Step 2: maintenance / updates
  const MAINTENANCE_CASES = deepFreeze([
    {id: 'timely-patch', label: '及时安装厂商发布的安全补丁', safe: true, reason: '修复已知漏洞。'},
    {id: 'ignore-updates', label: '设备长期联网但从不安装更新', safe: false, reason: '已知漏洞长期暴露。'},
    {id: 'eol-device', label: '厂商已停止维护（EOL）、不再提供安全更新的设备', safe: false, reason: '新漏洞不会被修复，应隔离或更换。'}
  ]);
  const MAINTENANCE_IDS = deepFreeze(MAINTENANCE_CASES.map(item => item.id));

  // Step 3: autonomous control practices
  const CONTROL_PRACTICES = deepFreeze([
    {id: 'data-self-hosting', label: '关键数据本地自持、可导出，不被单一外部服务锁定', enhancesControl: true},
    {id: 'open-standards', label: '采用开放标准与可互操作协议，保留可替代方案', enhancesControl: true},
    {id: 'localize-capability', label: '断网时核心功能仍能在本地运行', enhancesControl: true},
    {id: 'brand-nationality-shortcut', label: '只按品牌国籍判断，认为某国产品牌就一定自主可控', enhancesControl: false},
    {id: 'single-vendor-lockin', label: '核心系统完全依赖单一外部厂商、可被远程停服', enhancesControl: false}
  ]);
  const PRACTICE_IDS = deepFreeze(CONTROL_PRACTICES.map(item => item.id));
  const EXPECTED_CONTROL = deepFreeze(CONTROL_PRACTICES.filter(item => item.enhancesControl).map(item => item.id).sort());

  function getTask() {
    return TASK;
  }

  function getSupplySources() {
    return SUPPLY_SOURCES;
  }

  function judgeSupplyChain(selection) {
    if (!selection || typeof selection !== 'object' || Array.isArray(selection)) {
      throw new RangeError('selection must be an object keyed by source id');
    }
    const givenKeys = Object.keys(selection).sort();
    const expectedKeys = [...SOURCE_IDS].sort();
    if (givenKeys.length !== expectedKeys.length || givenKeys.some((key, index) => key !== expectedKeys[index])) {
      throw new RangeError('selection must contain exactly the four source ids');
    }
    for (const id of expectedKeys) {
      if (!['trusted', 'untrusted'].includes(selection[id])) throw new RangeError(`unknown trust value for ${id}`);
    }
    const mismatches = [];
    for (const source of SUPPLY_SOURCES) {
      const expected = source.trustworthy ? 'trusted' : 'untrusted';
      if (selection[source.id] !== expected) {
        mismatches.push({sourceId: source.id, expected, actual: selection[source.id]});
      }
    }
    if (mismatches.length === 0) return deepFreeze({correct: true, mismatches: [], reason: 'supply-chain-trustworthy'});
    return deepFreeze({correct: false, mismatches, reason: 'supply-chain-mismatch'});
  }

  function getMaintenanceCases() {
    return MAINTENANCE_CASES;
  }

  function judgeMaintenance(selection) {
    if (!selection || typeof selection !== 'object' || Array.isArray(selection)) {
      throw new RangeError('selection must be an object keyed by maintenance case id');
    }
    const givenKeys = Object.keys(selection).sort();
    const expectedKeys = [...MAINTENANCE_IDS].sort();
    if (givenKeys.length !== expectedKeys.length || givenKeys.some((key, index) => key !== expectedKeys[index])) {
      throw new RangeError('selection must contain exactly the three maintenance case ids');
    }
    for (const id of expectedKeys) {
      if (typeof selection[id] !== 'boolean') throw new RangeError(`unknown safety value for ${id}`);
    }
    const mismatches = [];
    for (const item of MAINTENANCE_CASES) {
      if (selection[item.id] !== item.safe) {
        mismatches.push({caseId: item.id, expected: item.safe, actual: selection[item.id]});
      }
    }
    if (mismatches.length === 0) return deepFreeze({correct: true, mismatches: [], reason: 'maintenance-judged'});
    return deepFreeze({correct: false, mismatches, reason: 'maintenance-mismatch'});
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
    if (mismatches.length === 0) return deepFreeze({correct: true, mismatches: [], reason: 'autonomous-control-recognised'});
    return deepFreeze({correct: false, mismatches, reason: 'control-mismatch'});
  }

  function getLocalSnapshot() {
    return deepFreeze({
      connectedToRealDevice: false,
      networkRequests: 0,
      entries: [
        {stage: 'supply-chain', summary: '核验来源与固件签名，拒绝不明渠道。'},
        {stage: 'maintenance', summary: '及时补丁，隔离或更换停止维护的设备。'},
        {stage: 'control', summary: '用数据自持、开放标准和本地化增强自主可控。'}
      ]
    });
  }

  return deepFreeze({
    getTask,
    getSupplySources,
    judgeSupplyChain,
    getMaintenanceCases,
    judgeMaintenance,
    getControlPractices,
    judgeControl,
    getLocalSnapshot
  });
});
