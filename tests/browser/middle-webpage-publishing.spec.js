const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('computer/middle/webpage-publishing.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/computer/middle/webpage-publishing.html';
const progressKey = 'kv-computer-middle-progress';

async function publishTwo(page) {
  await page.locator('#draft-title').fill('校园科学展新安排');
  await page.locator('#publish-button').click();
  await page.locator('#draft-body').fill('周六可参观天文与机械模型。');
  await page.locator('#publish-button').click();
}

async function answerBoth(page) {
  await page.getByRole('radio', {name: '标题、正文、图像说明和链接目标'}).check();
  await page.locator('#check-data').click();
  await page.getByRole('radio', {name: '保持版本 1，直到再次模拟发布'}).check();
  await page.locator('#check-timing').click();
}

test('structured data changes draft preview and cannot execute typed HTML', async ({page}) => {
  await page.goto(topic);
  await expect(page.locator('#draft-preview .preview-title')).toHaveText('校园科学展');
  await expect(page.locator('#published-empty')).toBeVisible();
  await page.locator('#publish-button').click();
  await expect(page.locator('#publish-status')).toContainText('先编辑至少一个');
  await page.locator('#draft-title').fill('科学展新安排');
  await page.locator('#draft-image-alt').fill('展台与海报');
  await page.locator('#draft-body').fill('<img src=x onerror=alert(1)>');
  await page.locator('#draft-link').selectOption('network-paths.html');
  await expect(page.locator('#draft-data')).toContainText('科学展新安排');
  await expect(page.locator('#draft-preview .preview-title')).toHaveText('科学展新安排');
  await expect(page.locator('#draft-preview .art')).toHaveAttribute('aria-label', '展台与海报');
  await expect(page.locator('#draft-preview .preview-alt')).toHaveText('图像说明：展台与海报');
  await expect(page.locator('#draft-preview .preview-body')).toHaveText('<img src=x onerror=alert(1)>');
  await expect(page.locator('#draft-preview img')).toHaveCount(0);
  await expect(page.locator('#draft-preview .preview-link')).toHaveAttribute('href', 'network-paths.html');
  await page.locator('#draft-body').fill(' ');
  await page.locator('#publish-button').click();
  await expect(page.locator('#publish-status')).toContainText('请填写正文');
  await expect(page.locator('#draft-body')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#published-empty')).toBeVisible();
});

test('two distinct local publication snapshots and both explanations earn completion', async ({page}) => {
  await page.goto(topic);
  await page.getByRole('radio', {name: '浏览器电量、鼠标速度和屏幕亮度'}).check();
  await page.locator('#check-data').click();
  await expect(page.locator('#data-feedback')).toContainText('再看编辑区');
  await page.getByRole('radio', {name: '立刻跟着草稿改变'}).check();
  await page.locator('#check-timing').click();
  await expect(page.locator('#timing-feedback')).toContainText('再比较');
  await page.locator('#draft-title').fill('校园科学展新安排');
  await page.locator('#publish-button').click();
  await expect(page.locator('#published-meta')).toContainText('版本 1');
  await expect(page.locator('#published-preview .preview-body')).toHaveText('用一张网页介绍科学展的活动与参观方式。');
  await page.locator('#draft-body').fill('周六可参观天文与机械模型。');
  await expect(page.locator('#draft-preview .preview-body')).toHaveText('周六可参观天文与机械模型。');
  await expect(page.locator('#published-preview .preview-body')).toHaveText('用一张网页介绍科学展的活动与参观方式。');
  await expect(page.locator('#published-meta')).toContainText('未发布更改');
  await page.locator('#publish-button').click();
  await expect(page.locator('#published-meta')).toContainText('版本 2');
  await expect(page.locator('#published-preview .preview-body')).toHaveText('周六可参观天文与机械模型。');
  await page.locator('#publish-button').click();
  await expect(page.locator('#publish-status')).toContainText('相同');
  await expect(page.locator('#round-status')).toContainText('2 个不同版本');
  await answerBoth(page);
  await expect(page.locator('#progress-status')).toContainText('本机已记录完成');
  await page.reload();
  await expect(page.locator('#round-status')).toContainText('0 个不同版本');
  await expect(page.locator('#progress-status')).toContainText('本机此前已记录完成');
});

test('storage rejection does not claim saved completion and retry updates the directory', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网测试不改写存储实现');
  await page.addInitScript(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new Error('denied');
      return original.call(this, name, value);
    };
    window.restoreProgressWrites = () => { Storage.prototype.setItem = original; };
  }, progressKey);
  await page.goto(topic);
  await publishTwo(page);
  await answerBoth(page);
  await expect(page.locator('#progress-status')).toContainText('未能保存');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
  await page.evaluate(() => window.restoreProgressWrites());
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('本机已记录完成');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'webpage-publishing': true});
  await page.goto('/computer/middle/index.html');
  await expect(page.locator('#stage-progress')).toContainText('1/5');
  await expect(page.locator('[data-topic-slug="webpage-publishing"] [data-completion]')).toContainText('已完成');
});

test('home search and counts expose the new middle computer topic', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网发现由发布后验收');
  await page.goto('/');
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total', '12');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('middle');
  await page.getByRole('searchbox', {name: '关键词'}).fill('网页编辑与发布');
  await page.locator('#site-results a[href="computer/middle/webpage-publishing.html"]').click();
  await expect(page.getByRole('heading', {name: '网页编辑与发布实验室'})).toBeVisible();
});

test('controls remain disabled while controller script is delayed', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项不延迟脚本');
  await page.route('**/computer/middle/assets/webpage-publishing.js', async route => {
    await new Promise(resolve => setTimeout(resolve, 700));
    await route.continue();
  });
  await page.goto(topic, {waitUntil: 'commit'});
  await expect(page.locator('#draft-title')).toBeDisabled();
  await expect(page.locator('#publish-button')).toBeDisabled();
  await expect(page.locator('#check-data')).toBeDisabled();
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('#draft-title')).toBeEnabled();
});

test('320px keyboard, file opening and release subpath preserve local publication', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(topic);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.locator('#draft-title').fill('新安排');
  await page.locator('#publish-button').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#published-preview .preview-title')).toHaveText('新安排');
  await page.locator('#draft-body').fill('第二版正文');
  await page.locator('#publish-button').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#published-preview .preview-body')).toHaveText('第二版正文');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

  if (process.env.KV_PUBLISHED_BASE_URL) return;
  await page.goto(pathToFileURL(resolve(__dirname, '../../computer/middle/webpage-publishing.html')).href);
  await page.locator('#draft-title').fill('文件直开');
  await page.locator('#publish-button').click();
  await expect(page.locator('#published-preview .preview-title')).toHaveText('文件直开');
  await expect(page.locator('#published-preview .preview-link')).toHaveAttribute('href', 'message-transfer.html');
  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('computer/middle/webpage-publishing.html', release.base).href);
    expect(response.status()).toBe(200);
    await page.locator('#draft-title').fill('子路径发布');
    await page.locator('#publish-button').click();
    await page.locator('#published-preview .preview-link').click();
    await expect(page.getByRole('heading', {name: '消息传输实验室'})).toBeVisible();
  } finally { await release.close(); }
});
