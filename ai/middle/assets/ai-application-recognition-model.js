(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.KVAiApplicationRecognitionModel = model;
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
    id: 'fictional-everyday-ai-apps',
    title: '身边的人工智能应用识别（去品牌化案例）',
    boundary: '本页应用与案例都是本地固定脚本写出的去品牌化教学样例，不连接真实服务或网络、不发送网络请求，也不收集自由文本或真实个人信息。',
    note: '判断关键：是否能从数据中学习并适应未预设的新情况；只按固定规则动作的是自动化，不是 AI。'
  });

  // Step 1 & 2: applications with kind and impact domains (only AI apps have impacts)
  const APPLICATIONS = deepFreeze([
    {id: 'voice-assistant', label: '能根据你的语音习惯改进识别效果的语音助手', kind: 'ai',
     impacts: ['learning', 'life', 'work'], reason: '从语音数据学习并适应不同口音。'},
    {id: 'recommender', label: '根据历史行为调整内容的推荐系统', kind: 'ai',
     impacts: ['learning', 'life', 'work'], reason: '从行为数据学习偏好并持续调整。'},
    {id: 'image-recognition', label: '用大量图片训练、可识别新照片内容的图像识别', kind: 'ai',
     impacts: ['life', 'work'], reason: '从训练数据学习，能处理未见过的图片。'},
    {id: 'adaptive-learning', label: '按答题情况调整难度的自适应学习程序', kind: 'ai',
     impacts: ['learning'], reason: '依据学习数据动态调整，不是固定题库。'},
    {id: 'auto-door', label: '人靠近就自动打开的感应门', kind: 'automation',
     impacts: [], reason: '只按传感器触发的固定规则动作，不学习。'},
    {id: 'timer-streetlight', label: '按固定时间开关的路灯', kind: 'automation',
     impacts: [], reason: '定时规则，没有数据学习闭环。'},
    {id: 'thermostat', label: '到设定温度就停机的恒温器', kind: 'automation',
     impacts: [], reason: '单设备阈值动作，不适应新情况。'}
  ]);
  const APP_IDS = deepFreeze(APPLICATIONS.map(a => a.id));
  const AI_APP_IDS = deepFreeze(APPLICATIONS.filter(a => a.kind === 'ai').map(a => a.id));
  const IMPACT_DOMAINS = deepFreeze(['learning', 'life', 'work']);

  // Step 3: capability boundary
  const CAPABILITY_CASES = deepFreeze([
    {id: 'image-sort', label: '在大量常规图片中区分猫和狗', needsHumanReview: false, reason: '模式识别是 AI 较可靠的辅助任务。'},
    {id: 'speech-draft', label: '把清晰语音转成文字初稿', needsHumanReview: false, reason: '语音转文字可作初稿，仍建议校对。'},
    {id: 'medical-diagnosis', label: '依据症状给出疾病诊断结论', needsHumanReview: true, reason: '高风险、需担责，AI 可能出错，须医生复核。'},
    {id: 'hiring-screen', label: '自动决定求职者是否录用', needsHumanReview: true, reason: '影响个人权益且可能带偏见，需人工判断。'},
    {id: 'fact-check', label: '判断一条信息的事实真伪', needsHumanReview: true, reason: 'AI 可能生成不实内容，事实须人工核实。'}
  ]);
  const CASE_IDS = deepFreeze(CAPABILITY_CASES.map(c => c.id));

  function getTask() {
    return TASK;
  }

  function getApplications() {
    return APPLICATIONS;
  }

  function sameArray(a, b) {
    return Array.isArray(a) && Array.isArray(b) &&
      a.length === b.length && a.every((value, index) => value === b[index]);
  }

  function classifyApplications(selection) {
    if (!selection || typeof selection !== 'object' || Array.isArray(selection)) {
      throw new RangeError('selection must be an object keyed by application id');
    }
    const givenKeys = Object.keys(selection).sort();
    const expectedKeys = [...APP_IDS].sort();
    if (givenKeys.length !== expectedKeys.length || givenKeys.some((key, index) => key !== expectedKeys[index])) {
      throw new RangeError('selection must contain exactly all application ids');
    }
    for (const id of expectedKeys) {
      if (!['ai', 'automation'].includes(selection[id])) throw new RangeError(`unknown kind for ${id}`);
    }
    const mismatches = [];
    for (const app of APPLICATIONS) {
      if (selection[app.id] !== app.kind) {
        mismatches.push({appId: app.id, expected: app.kind, actual: selection[app.id]});
      }
    }
    if (mismatches.length === 0) return deepFreeze({correct: true, mismatches: [], reason: 'applications-classified'});
    return deepFreeze({correct: false, mismatches, reason: 'classification-mismatch'});
  }

  function judgeImpacts(selection) {
    if (!selection || typeof selection !== 'object' || Array.isArray(selection)) {
      throw new RangeError('selection must be an object keyed by ai application id');
    }
    const givenKeys = Object.keys(selection).sort();
    const expectedKeys = [...AI_APP_IDS].sort();
    if (givenKeys.length !== expectedKeys.length || givenKeys.some((key, index) => key !== expectedKeys[index])) {
      throw new RangeError('selection must contain exactly the ai application ids');
    }
    for (const id of expectedKeys) {
      const value = selection[id];
      if (!Array.isArray(value)) throw new RangeError(`impacts for ${id} must be an array`);
      if (value.some(domain => !IMPACT_DOMAINS.includes(domain))) throw new RangeError(`unknown impact domain for ${id}`);
    }
    const mismatches = [];
    for (const app of APPLICATIONS.filter(a => a.kind === 'ai')) {
      const expected = [...app.impacts].sort();
      const actual = [...selection[app.id]].sort();
      if (!sameArray(actual, expected)) {
        mismatches.push({appId: app.id, expected: app.impacts, actual: selection[app.id]});
      }
    }
    if (mismatches.length === 0) return deepFreeze({correct: true, mismatches: [], reason: 'impacts-judged'});
    return deepFreeze({correct: false, mismatches, reason: 'impact-mismatch'});
  }

  function getCapabilityCases() {
    return CAPABILITY_CASES;
  }

  function judgeBoundary(selection) {
    if (!selection || typeof selection !== 'object' || Array.isArray(selection)) {
      throw new RangeError('selection must be an object keyed by capability case id');
    }
    const givenKeys = Object.keys(selection).sort();
    const expectedKeys = [...CASE_IDS].sort();
    if (givenKeys.length !== expectedKeys.length || givenKeys.some((key, index) => key !== expectedKeys[index])) {
      throw new RangeError('selection must contain exactly all capability case ids');
    }
    for (const id of expectedKeys) {
      if (!['ai-reliable', 'human-review'].includes(selection[id])) {
        throw new RangeError(`unknown boundary value for ${id}`);
      }
    }
    const mismatches = [];
    for (const item of CAPABILITY_CASES) {
      const expected = item.needsHumanReview ? 'human-review' : 'ai-reliable';
      if (selection[item.id] !== expected) {
        mismatches.push({caseId: item.id, expected, actual: selection[item.id]});
      }
    }
    if (mismatches.length === 0) return deepFreeze({correct: true, mismatches: [], reason: 'boundary-judged'});
    return deepFreeze({correct: false, mismatches, reason: 'boundary-mismatch'});
  }

  function getLocalSnapshot() {
    return deepFreeze({
      connectedToRealService: false,
      networkRequests: 0,
      entries: [
        {stage: 'classify', summary: '依据是否从数据学习区分 AI 应用与固定自动化。'},
        {stage: 'impacts', summary: '把 AI 应用归类到学习、生活、工作影响域。'},
        {stage: 'boundary', summary: '认识高风险任务需要人类复核，AI 不保证总是正确。'}
      ]
    });
  }

  return deepFreeze({
    getTask,
    getApplications,
    classifyApplications,
    judgeImpacts,
    getCapabilityCases,
    judgeBoundary,
    getLocalSnapshot
  });
});
