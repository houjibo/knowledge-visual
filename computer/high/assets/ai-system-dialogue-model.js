(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.HighAiSystemDialogueModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CASE = Object.freeze({
    id: 'fictional-loan-renewal',
    title: '《星际观测手册》（虚构书目）',
    dueInDays: 5,
    renewalsRemaining: 1,
    queuedReservations: 1,
    policyMaximumDays: 7,
    renewalBlockedWhenReserved: true,
    recordStatus: '未续借'
  });

  const FORM_STEPS = Object.freeze([
    '打开借阅记录',
    '查看到期时间与剩余续借次数',
    '查看预约队列和续借规则',
    '根据记录决定是否继续'
  ]);

  function getCase() {
    return Object.freeze({...CASE});
  }

  function compareInteractionModes() {
    const record = getCase();
    return Object.freeze({
      caseId: record.id,
      fixedDemonstration: true,
      form: Object.freeze({
        steps: FORM_STEPS,
        dueInDays: record.dueInDays,
        renewalsRemaining: record.renewalsRemaining,
        queuedReservations: record.queuedReservations,
        eligible: !(record.renewalBlockedWhenReserved && record.queuedReservations > 0)
      }),
      dialogue: Object.freeze({
        prompt: '这本书还有几天到期？我还能续借吗？',
        response: '到期还剩 5 天，尚有 1 次续借额度。可以续借 7 天。',
        claim: 'renewal-allowed',
        responseSource: '本地固定教学脚本',
        actionIssued: false
      }),
      note: '本例只比较固定交互路径，不表示普遍速度、准确率或真实模型能力。'
    });
  }

  function verifyRenewalDecision({evidenceOpened = false, decision} = {}) {
    if (typeof evidenceOpened !== 'boolean') throw new TypeError('evidenceOpened must be boolean');
    if (decision !== 'verify' && decision !== 'renew') throw new RangeError('unknown renewal decision');
    if (!evidenceOpened) {
      return Object.freeze({correct: false, reason: 'open-evidence-first', actionExecuted: false});
    }
    if (decision === 'verify') {
      return Object.freeze({correct: true, reason: 'reservation-blocks-renewal', actionExecuted: false});
    }
    return Object.freeze({correct: false, reason: 'record-conflicts-with-answer', actionExecuted: false});
  }

  function getEvidence() {
    return Object.freeze({
      record: getCase(),
      rules: Object.freeze({
        renewalBlockedWhenReserved: true,
        maximumDays: CASE.policyMaximumDays,
        explanation: '预约队列中有读者时，当前记录不允许续借。'
      }),
      conclusion: '预约数为 1，因此本例不符合续借条件。',
      actionExecuted: false
    });
  }

  return Object.freeze({getCase, compareInteractionModes, verifyRenewalDecision, getEvidence});
});
