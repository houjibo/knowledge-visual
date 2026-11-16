(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  if (root) root.KVIdentityEncryptionModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const questions = Object.freeze([
    Object.freeze({id:'identifier', title:'账号标识与秘密',
      prompt:'虚构学习平台用账号名区分用户。关于账号名和验证凭据，哪种说法较合理？',
      choices:Object.freeze([
        Object.freeze({id:'identify', text:'账号名用于区分账号；密码和验证码应保密，账号名也可能是个人信息。'}),
        Object.freeze({id:'name-secret', text:'只要知道账号名，就完成了身份验证。'}),
        Object.freeze({id:'code-public', text:'验证码是账号标识，可以发给别人。'})]),
      answer:'identify', explanation:'标识用于指向账号，验证用于检查是否控制已绑定的凭据。账号名也可能包含个人信息，不应随意公开。'}),
    Object.freeze({id:'factors', title:'保护多个账号',
      prompt:'假设学习平台支持密码和已绑定验证器的额外验证，哪种做法更合适？',
      choices:Object.freeze([
        Object.freeze({id:'reuse', text:'所有账号使用同一密码，方便记忆。'}),
        Object.freeze({id:'independent', text:'各账号使用不同的强密码，并按平台规则启用额外验证。'}),
        Object.freeze({id:'twice', text:'把同一个密码输入两次，就等于两个不同因素。'})]),
      answer:'independent', explanation:'不同账号使用独立强密码可减少一个账号泄露后的连带风险；不同因素的额外验证可增加保护，但不是绝对安全。'}),
    Object.freeze({id:'unexpected', title:'意外验证码请求',
      prompt:'一条虚构消息称“账号即将冻结”，催促你把验证码发给对方。下一步怎么做？',
      choices:Object.freeze([
        Object.freeze({id:'send', text:'立即把验证码发给对方，防止账号冻结。'}),
        Object.freeze({id:'verify', text:'不分享验证码；自行通过已知可信入口核验，并可向可信任的成年人求助。'}),
        Object.freeze({id:'link', text:'直接点击消息里的链接并输入密码和验证码。'})]),
      answer:'verify', explanation:'不要把密码或一次性验证码交给他人。手动输入的验证码也可能被钓鱼网站转交，额外验证不能替代独立核验。'})
  ]);
  const channels = Object.freeze([
    Object.freeze({id:'plaintext', label:'明文传送', symbol:'明文：示例信息', recipient:true, observer:true,
      explanation:'在本模型中消息直接以明文经过公共通道，接收者和通道观察者都能读到。'}),
    Object.freeze({id:'private-key', label:'密文 · 密钥未泄露', symbol:'密文：■■■■', recipient:true, observer:false,
      explanation:'假设采用安全加密、接收者持有正确密钥且观察者拿不到密钥：接收者可读，观察者不能直接读懂。'}),
    Object.freeze({id:'leaked-key', label:'密文 · 密钥被观察者取得', symbol:'密文：■■■■', recipient:true, observer:true,
      explanation:'若观察者也取得同一密钥，本模型中双方都能读到；保护密钥是保密条件之一。'})
  ]);
  function question(id) { return questions.find(item => item.id === id) || null; }
  function channel(id) { return channels.find(item => item.id === id) || null; }
  function assessQuestion(id, answer) {
    const item = question(id);
    if (!item || !item.choices.some(option => option.id === answer)) return null;
    return {correct: answer === item.answer, explanation:item.explanation};
  }
  function assessChannel(id, recipient, observer) {
    const item = channel(id);
    if (!item || !['yes','no'].includes(recipient) || !['yes','no'].includes(observer)) return null;
    return {correct:(recipient === 'yes') === item.recipient && (observer === 'yes') === item.observer,
      recipient:item.recipient, observer:item.observer, explanation:item.explanation};
  }
  return {questions, channels, question, channel, assessQuestion, assessChannel};
});
