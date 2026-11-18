(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.HighResponsiblePublishingModel = model;
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
    id: 'fictional-water-saving-release',
    title: '校园节水成果发布（虚构任务）',
    requirement: '向全校师生展示含同学反馈的节水成果，需要受众可控并能在发现问题时撤回。',
    boundary: '本页所有平台与发布过程都是本地固定脚本写出的教学演示，不连接真实平台、不发送网络请求、不产生真实发布或转发，也不收集自由文本或真实个人信息。',
    note: '平台选择基于本例的受众、权限与撤回需求；不同任务的合理选择不同。'
  });

  const PLATFORMS = deepFreeze([
    {
      id: 'personal-public',
      label: '个人公开发布平台',
      audience: '任何人可见，完全公开',
      permission: '无需学校审核，发布者个人决定',
      retractable: '可删除自己的原帖，但他人转发或截图不可控'
    },
    {
      id: 'class-space',
      label: '班级协作空间',
      audience: '仅本班成员可见',
      permission: '班级内协作编辑',
      retractable: '可在班级空间内撤回'
    },
    {
      id: 'school-platform',
      label: '校内学习平台',
      audience: '全校师生可见，受众可控',
      permission: '经指导老师确认后在校内发布',
      retractable: '可由发布者与管理员撤回，校外传播受限'
    }
  ]);

  const PLATFORM_VERDICT = deepFreeze({
    'personal-public': {correct: false, reason: 'over-public-uncontrolled-spread'},
    'class-space': {correct: false, reason: 'audience-too-narrow'},
    'school-platform': {correct: true, reason: 'audience-and-retraction-match'}
  });

  const DRAFT = deepFreeze({
    title: '校园节水观察成果（草稿）',
    body: '汇总本月节水观察，并引用同学反馈。',
    conclusionHasSource: false,
    containsRealName: true,
    realNameSample: '李明',
    imageAuthorized: false,
    permissionOnSchoolPlatform: true
  });

  const EXPECTED_CHECKS = deepFreeze({source: false, privacy: false, authorization: false, permission: true});

  const WITHDRAWAL_VERDICT = deepFreeze({
    'recall-everywhere': {correct: false, reason: 'forwarded-copies-not-controllable'},
    'no-effect': {correct: false, reason: 'original-can-still-be-retracted'},
    'retract-original-copies-persist': {correct: true, reason: 'original-retractable-forwarded-copies-persist'}
  });

  function getTask() {
    return TASK;
  }

  function getPlatforms() {
    return PLATFORMS;
  }

  function getDraft() {
    return DRAFT;
  }

  function choosePlatform(platformId) {
    const verdict = PLATFORM_VERDICT[platformId];
    if (!verdict) throw new RangeError('unknown platform');
    return deepFreeze({...verdict});
  }

  function checkPrepublish(checks) {
    if (!checks || typeof checks !== 'object' || Array.isArray(checks)) {
      throw new RangeError('checks must be an object');
    }
    const expectedKeys = Object.keys(EXPECTED_CHECKS).sort();
    const givenKeys = Object.keys(checks).sort();
    if (givenKeys.length !== expectedKeys.length || givenKeys.some((key, index) => key !== expectedKeys[index])) {
      throw new RangeError('checks must contain exactly source, privacy, authorization and permission');
    }
    for (const key of expectedKeys) {
      if (typeof checks[key] !== 'boolean') throw new TypeError(`checks.${key} must be boolean`);
    }
    const mismatches = [];
    for (const key of expectedKeys) {
      if (checks[key] !== EXPECTED_CHECKS[key]) {
        mismatches.push({field: key, expected: EXPECTED_CHECKS[key], actual: checks[key]});
      }
    }
    if (mismatches.length === 0) {
      return deepFreeze({correct: true, canPublish: false, mismatches: [], reason: 'blockers-identified-draft-withheld'});
    }
    return deepFreeze({correct: false, canPublish: false, mismatches, reason: 'prepublish-blockers-missed'});
  }

  function checkWithdrawal(decision) {
    const verdict = WITHDRAWAL_VERDICT[decision];
    if (!verdict) throw new RangeError('unknown withdrawal decision');
    return deepFreeze({...verdict});
  }

  function getSpreadState() {
    return deepFreeze({
      originalRetractable: true,
      forwardedCopies: 1,
      copyRetractableByPublisher: false,
      networkRequests: 0
    });
  }

  function getLocalSnapshot() {
    return deepFreeze({
      published: false,
      networkRequests: 0,
      entries: [
        {
          stage: 'platform-choice',
          summary: '选用受众可控、可撤回的校内学习平台。'
        },
        {
          stage: 'prepublish-check',
          summary: '来源、隐私、授权三项不通过，问题稿在发布前被阻止；反馈内容以去标识化方式描述。'
        },
        {
          stage: 'withdrawal',
          summary: '原件可撤回，已转发副本不由发布者控制，传播不可逆。'
        }
      ]
    });
  }

  return deepFreeze({
    getTask,
    getPlatforms,
    getDraft,
    choosePlatform,
    checkPrepublish,
    checkWithdrawal,
    getSpreadState,
    getLocalSnapshot
  });
});
