(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.HighGenaiResponsibleUseModel = model;
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
    id: 'fictional-water-saving-study',
    title: '校园节水方案（虚构小组研究任务）',
    boundary: '本页所有生成结果都是本地固定脚本写出的教学演示，不连接真实生成式 AI、不发送网络请求，也不收集自由文本或真实个人信息。',
    note: '判断基于本例的虚构情境与去标识化前提；真实场景还需结合用途、平台规则与授权。'
  });

  const INPUT_CANDIDATES = deepFreeze([
    {id: 'c1', shareable: true, label: '公开的学习问题', detail: '“校园日常用水主要用在哪些环节？”', basis: '面向公开知识的问题，不含个人或内部信息。'},
    {id: 'c2', shareable: true, label: '公开来源线索', detail: '学校公开发布的上月用水台账链接', basis: '已经公开、可追溯的资料线索。'},
    {id: 'c3', shareable: true, label: '去标识化合成数据', detail: '去掉姓名和班级后的节水问卷合成样本', basis: '去除身份信息且为合成数据，可用于方法练习。'},
    {id: 'c4', shareable: false, label: '真实姓名与住址', detail: '含同学真实姓名和家庭住址的登记表', basis: '属于个人敏感信息，不应输入外部生成式工具。'},
    {id: 'c5', shareable: false, label: '未公开内部文件', detail: '标注“内部”、尚未公开的学校后勤改造草案', basis: '内部资料有保密与授权边界，不宜对外输入。'},
    {id: 'c6', shareable: false, label: '手机号与精确生日', detail: '调查对象的手机号和精确出生日期', basis: '可识别个人身份的联系与身份信息，须保护。'}
  ]);

  const SOURCES = deepFreeze([
    {
      id: 's1',
      title: '《城市生活节水指引》（公开科普资料）',
      text: '介绍节水型器具、漏损排查和日常用水习惯；指出更换节水器具和定期巡检管网是常见节水途径。',
      facts: ['更换节水型器具可降低同类用水环节的用水量', '定期巡检管网、修复漏损是常见节水措施']
    },
    {
      id: 's2',
      title: '学校上月公开用水台账',
      text: '公开台账显示校园用水以绿化浇灌、卫生间冲洗和食堂清洗为主，三项合计占比最高。',
      facts: ['校园用水集中在绿化、卫生间和食堂三个环节', '台账来自学校公开发布，可追溯核对']
    }
  ]);

  const GENERATED_OUTPUTS = deepFreeze([
    {
      id: 'out-a',
      label: '生成结果 A · 结论可核对',
      text: '建议优先在绿化浇灌、卫生间冲洗和食堂清洗三个高耗水环节排查漏损，并评估节水型器具；这与公开台账的用水构成和节水指引的措施一致。',
      fabricatedReference: false,
      sourceIds: ['s1', 's2'],
      correctVerdict: 'cite'
    },
    {
      id: 'out-b',
      label: '生成结果 B · 含虚构引用',
      text: '据《全国校园节水白皮书（2025）》统计，安装感应水龙头可让校园用水下降 40%，因此应立即在全校推广。',
      fabricatedReference: true,
      sourceIds: [],
      correctVerdict: 'reject'
    }
  ]);

  function getTask() {
    return TASK;
  }

  function getInputCandidates() {
    return INPUT_CANDIDATES;
  }

  function getSources() {
    return SOURCES;
  }

  function getGeneratedOutputs() {
    return GENERATED_OUTPUTS;
  }

  function checkInputClassification(selection) {
    if (!selection || typeof selection !== 'object' || Array.isArray(selection)) {
      throw new TypeError('selection must be an object keyed by candidate id');
    }
    const expectedIds = INPUT_CANDIDATES.map(item => item.id);
    const givenIds = Object.keys(selection).sort();
    if (givenIds.length !== expectedIds.length || givenIds.some((id, index) => id !== expectedIds[index])) {
      throw new RangeError('selection must contain exactly the six candidate ids');
    }
    for (const item of INPUT_CANDIDATES) {
      if (typeof selection[item.id] !== 'boolean') throw new TypeError(`selection.${item.id} must be boolean`);
    }
    const mismatches = [];
    for (const item of INPUT_CANDIDATES) {
      if (selection[item.id] !== item.shareable) {
        mismatches.push({id: item.id, expected: item.shareable, actual: selection[item.id]});
      }
    }
    if (mismatches.length === 0) {
      return deepFreeze({correct: true, mismatches: [], reason: 'all-classified-correctly'});
    }
    return deepFreeze({correct: false, mismatches, reason: 'classification-mismatch'});
  }

  function verifyOutputs({evidenceOpened = false, verdicts} = {}) {
    if (typeof evidenceOpened !== 'boolean') throw new TypeError('evidenceOpened must be boolean');
    if (!verdicts || typeof verdicts !== 'object' || Array.isArray(verdicts)) {
      throw new RangeError('verdicts must be an object keyed by output id');
    }
    const expectedIds = GENERATED_OUTPUTS.map(item => item.id).sort();
    const givenIds = Object.keys(verdicts).sort();
    if (givenIds.length !== expectedIds.length || givenIds.some((id, index) => id !== expectedIds[index])) {
      throw new RangeError('verdicts must contain exactly the two output ids');
    }
    for (const output of GENERATED_OUTPUTS) {
      if (!['cite', 'reject'].includes(verdicts[output.id])) {
        throw new RangeError(`unknown verdict for ${output.id}`);
      }
    }
    if (!evidenceOpened) {
      return deepFreeze({correct: false, reason: 'open-evidence-first', conflicts: []});
    }
    const conflicts = [];
    for (const output of GENERATED_OUTPUTS) {
      const actual = verdicts[output.id];
      if (actual !== output.correctVerdict) {
        conflicts.push({
          id: output.id,
          expected: output.correctVerdict,
          actual,
          reason: output.fabricatedReference ? 'fabricated-reference-not-in-sources' : 'verdict-conflict'
        });
      }
    }
    if (conflicts.length === 0) {
      return deepFreeze({correct: true, reason: 'sources-support-a-and-b-fabricates', conflicts: []});
    }
    return deepFreeze({correct: false, reason: 'verdict-conflict', conflicts});
  }

  function checkSnapshotDecision(decision) {
    switch (decision) {
      case 'verified-only':
        return deepFreeze({correct: true, reason: 'verified-cited-only'});
      case 'include-b':
        return deepFreeze({correct: false, reason: 'fabricated-output-must-be-excluded'});
      case 'uncited-b':
        return deepFreeze({correct: false, reason: 'citation-required-and-fabricated-excluded'});
      default:
        throw new RangeError('unknown snapshot decision');
    }
  }

  function getCollaborationSnapshot() {
    return deepFreeze({
      published: false,
      networkRequests: 0,
      entries: [
        {
          from: 'out-a',
          summary: '在绿化、卫生间和食堂三个高耗水环节排查漏损并评估节水型器具。',
          citations: ['s1', 's2']
        }
      ]
    });
  }

  return deepFreeze({
    getTask,
    getInputCandidates,
    getSources,
    getGeneratedOutputs,
    checkInputClassification,
    verifyOutputs,
    checkSnapshotDecision,
    getCollaborationSnapshot
  });
});
