const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');
const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('computer/middle/identity-encryption.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/computer/middle/identity-encryption.html';
const progressKey = 'kv-computer-middle-progress';
async function question(page, id, answer) {
  await page.locator('#question-select').selectOption(id);
  await page.locator(`input[name="question-answer"][value="${answer}"]`).check();
  await page.locator('#check-question').click();
}
async function channel(page,id, recipient, observer) {
  await page.locator('#channel-select').selectOption(id);
  await page.locator('#recipient-choice').selectOption(recipient);
  await page.locator('#observer-choice').selectOption(observer);
  await page.locator('#check-channel').click();
}
async function complete(page) {
  await question(page,'identifier','identify');
  await question(page,'factors','independent');
  await question(page,'unexpected','verify');
  await channel(page,'plaintext','yes','yes');
  await channel(page,'private-key','yes','no');
  await channel(page,'leaked-key','yes','yes');
}

test('账号判断能纠错，标识、额外验证与可疑请求有明确边界', async ({page}) => {
  await page.goto(topic);
  await page.locator('#check-question').click();
  await expect(page.locator('#question-feedback')).toContainText('先选择');
  await question(page,'identifier','name-secret');
  await expect(page.locator('#question-feedback')).toContainText('再想想');
  await expect(page.locator('#challenge-status')).toContainText('0/3');
  await question(page,'identifier','identify');
  await expect(page.locator('#question-feedback')).toContainText('个人信息');
  await question(page,'factors','independent');
  await expect(page.locator('#question-feedback')).toContainText('不是绝对安全');
  await question(page,'unexpected','verify');
  await expect(page.locator('#question-feedback')).toContainText('也可能被钓鱼');
  await expect(page.locator('#challenge-status')).toContainText('账号判断 3/3');
});

test('先预测明文与密文条件，切换或修改预测清除旧揭示', async ({page}) => {
  await page.goto(topic);
  await channel(page,'plaintext','yes','no');
  await expect(page.locator('#channel-feedback')).toContainText('至少一项');
  await expect(page.locator('#observer-status')).toHaveText('核对后显示');
  await channel(page,'plaintext','yes','yes');
  await expect(page.locator('#observer-status')).toHaveText('可读示例信息');
  await page.locator('#channel-select').selectOption('private-key');
  await expect(page.locator('#observer-status')).toHaveText('核对后显示');
  await expect(page.locator('#recipient-choice')).toHaveValue('');
  await page.locator('#recipient-choice').selectOption('yes');
  await page.locator('#observer-choice').selectOption('no');
  await page.locator('#check-channel').click();
  await expect(page.locator('#observer-status')).toHaveText('不能直接读懂');
  await expect(page.locator('#sender-status')).toContainText('密文');
  await page.locator('#observer-choice').selectOption('yes');
  await expect(page.locator('#observer-status')).toHaveText('核对后显示');
  await channel(page,'leaked-key','yes','yes');
  await expect(page.locator('#channel-feedback')).toContainText('保护密钥');
  await expect(page.locator('#challenge-status')).toContainText('传输预测 3/3');
});

test('六项独立完成后保存，刷新后本轮重新开始，目录和首页计数同步', async ({page}) => {
  await page.goto(topic);
  await complete(page);
  await expect(page.locator('#progress-status')).toContainText('本机已记录');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'identity-encryption':true});
  await page.reload();
  await expect(page.locator('#challenge-status')).toContainText('账号判断 0/3');
  await expect(page.locator('#progress-status')).toContainText('此前已记录');
  await page.getByRole('link',{name:'← 返回初中计算机'}).click();
  await expect(page.locator('a[href="identity-encryption.html"] [data-completion]')).toContainText('已完成');
  await expect(page.locator('#stage-progress')).toContainText('1/13');
  await page.getByRole('link',{name:'首页',exact:true}).click();
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total','30');
});

test('存储失败不谎报完成并允许重试', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '仅本机替换存储');
  await page.addInitScript(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(name,value) { if(name === key) throw new Error('denied'); return original.call(this,name,value); };
    window.restoreWrites = () => { Storage.prototype.setItem = original; };
  }, progressKey);
  await page.goto(topic); await complete(page);
  await expect(page.locator('#progress-status')).toContainText('未保存');
  await expect(page.locator('#retry-save')).toBeVisible();
  await page.evaluate(() => window.restoreWrites());
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('已记录');
});

test('320px 键盘与文件直开', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '仅本机文件直开');
  await page.setViewportSize({width:320,height:740});
  await page.goto(pathToFileURL(resolve(__dirname,'../../computer/middle/identity-encryption.html')).href);
  await page.locator('input[name="question-answer"][value="identify"]').focus();
  await page.keyboard.press('Space');
  await page.locator('#check-question').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#question-feedback')).toContainText('判断正确');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('发布子路径包含脚本资源', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '仅本机发布包');
  const server = await startReleaseServer();
  try {
    await page.goto(new URL('computer/middle/identity-encryption.html', server.base).href);
    await question(page,'unexpected','verify');
    await expect(page.locator('#question-feedback')).toContainText('钓鱼');
  } finally { await server.close(); }
});

test('损坏的本机记录不被覆盖，修复后可重试', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '仅本机注入损坏记录');
  await page.addInitScript(key => { localStorage.setItem(key, '{broken'); }, progressKey);
  await page.goto(topic); await complete(page);
  await expect(page.locator('#progress-status')).toContainText('未保存');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBe('{broken');
  await page.evaluate(key => localStorage.setItem(key, '{}'), progressKey);
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('已记录');
});

test('离线模型不发送外部请求，也不提供凭据输入框', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '本地网络边界检查');
  const external = [];
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4183/')) external.push(request.url()); });
  await page.goto(topic); await complete(page);
  await expect(page.locator('input[type="password"], input[type="text"], input[type="email"]')).toHaveCount(0);
  expect(external).toEqual([]);
});

test('模型加载失败时保留清晰提示和禁用控件', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '仅本地拦截资源');
  await page.route('**/computer/middle/assets/identity-encryption-model.js', route => route.abort());
  await page.goto(topic);
  await expect(page.locator('#question-prompt')).toContainText('加载失败');
  await expect(page.locator('#check-question')).toBeDisabled();
  await expect(page.locator('#check-channel')).toBeDisabled();
});
