const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const publishedBase = process.env.KV_PUBLISHED_BASE_URL?.replace(/\/?$/, '/') || '';
const siteRoot = publishedBase || '/';
const topic = publishedBase
  ? new URL('computer/high/ai-system-dialogue.html', publishedBase).href
  : '/computer/high/ai-system-dialogue.html';
const progressKey = 'kv-computer-high-progress';

function watchExternalRequests(page, requests) {
  page.on('request', request => {
    if (!/^https?:/.test(request.url())) return;
    const host = new URL(request.url()).hostname;
    if (host !== '127.0.0.1' && host !== 'localhost' && host !== '::1') requests.push(request.url());
  });
}

async function complete(page, {prediction = 'act'} = {}) {
  await page.locator('input[name="comparison-check"][value="same"]').check();
  await page.locator('#check-comparison').click();
  await page.locator(`input[name="trust-prediction"][value="${prediction}"]`).check();
  await page.locator('#reveal-evidence').click();
  await page.locator('input[name="renewal-decision"][value="verify"]').check();
  await page.locator('#check-decision').click();
  await page.locator('input[name="action-boundary"][value="unchanged"]').check();
  await page.locator('#check-action-boundary').click();
}

test('compares interaction modes, detects source conflict and keeps the business record unchanged', async ({page}) => {
  const errors = [], remoteRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  watchExternalRequests(page, remoteRequests);
  await page.goto(topic);
  await expect(page).toHaveTitle(/信息系统对话交互实验室/);
  await expect(page.locator('#form-steps li')).toHaveCount(4);
  await expect(page.locator('#assistant-response')).toContainText('可以续借 7 天');
  await expect(page.locator('#evidence-panel')).toBeHidden();
  await expect(page.locator('#reveal-evidence')).toBeDisabled();

  await page.locator('#check-comparison').click();
  await expect(page.locator('#comparison-status')).toContainText('先选择');
  await page.locator('input[name="comparison-check"][value="different"]').check();
  await page.locator('#check-comparison').click();
  await expect(page.locator('#comparison-status')).toContainText('请重新判断');
  await expect(page.locator('#reveal-evidence')).toBeDisabled();

  await page.locator('input[name="comparison-check"][value="same"]').check();
  await page.locator('#check-comparison').click();
  await expect(page.locator('#reveal-evidence')).toBeEnabled();
  await page.locator('#reveal-evidence').click();
  await expect(page.locator('#prediction-status')).toContainText('先选择');
  await page.locator('input[name="trust-prediction"][value="act"]').check();
  await page.locator('#reveal-evidence').click();
  await expect(page.locator('#evidence-panel')).toBeVisible();
  await expect(page.locator('#evidence-title')).toBeFocused();
  await expect(page.locator('#reservation-count')).toHaveText('1 人等待');

  await page.locator('#check-decision').click();
  await expect(page.locator('#decision-status')).toContainText('选择是否');
  await page.locator('input[name="renewal-decision"][value="renew"]').check();
  await page.locator('#check-decision').click();
  await expect(page.locator('#decision-status')).toContainText('与系统记录冲突');
  await expect(page.locator('#action-panel')).toBeHidden();
  await expect(page.locator('#learning-steps li[data-done="true"]')).toHaveCount(1);

  await page.locator('input[name="renewal-decision"][value="verify"]').check();
  await page.locator('#check-decision').click();
  await expect(page.locator('#action-panel')).toBeVisible();
  await expect(page.locator('#action-title')).toBeFocused();
  await expect(page.locator('#loan-status')).toHaveText('未续借');
  await page.locator('input[name="action-boundary"][value="changed"]').check();
  await page.locator('#check-action-boundary').click();
  await expect(page.locator('#action-status')).toContainText('不等于已提交');
  await page.locator('input[name="action-boundary"][value="unchanged"]').check();
  await page.locator('#check-action-boundary').click();
  await expect(page.locator('#learning-steps li[data-done="true"]')).toHaveCount(3);
  await expect(page.locator('#save-status')).toContainText('已保存');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey))
    .toEqual({'ai-system-dialogue': true});
  await expect(page.locator('#loan-status')).toHaveText('未续借');
  expect(remoteRequests).toEqual([]);

  await page.goto(siteRoot);
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total', '26');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('high');
  await page.getByRole('searchbox', {name: '关键词'}).fill('信息系统对话交互');
  await page.locator('#site-results a[href="computer/high/ai-system-dialogue.html"]').click();
  await expect(page).toHaveURL(/computer\/high\/ai-system-dialogue\.html/);
  expect(errors).toEqual([]);
});

test('damaged progress is preserved and the completed exercise can be saved after repair', async ({page}) => {
  test.skip(!!publishedBase, '公网验收不修改站点存储故障');
  await page.addInitScript(key => localStorage.setItem(key, '{broken'), progressKey);
  await page.goto(topic);
  await complete(page);
  await expect(page.locator('#retry-save')).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBe('{broken');
  await page.evaluate(key => localStorage.removeItem(key), progressKey);
  await page.locator('#retry-save').click();
  await expect(page.locator('#save-status')).toContainText('已保存');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey))
    .toEqual({'ai-system-dialogue': true});
});

test('rejected progress writes can be retried without blocking the learning flow', async ({page}) => {
  test.skip(!!publishedBase, '公网验收不改写本地存储实现');
  await page.addInitScript(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new Error('write rejected');
      return original.call(this, name, value);
    };
    window.restoreProgressWrites = () => { Storage.prototype.setItem = original; };
  }, progressKey);
  await page.goto(topic);
  await complete(page, {prediction: 'inspect'});
  await expect(page.locator('#save-status')).toContainText('未能保存');
  await page.evaluate(() => window.restoreProgressWrites());
  await page.locator('#retry-save').click();
  await expect(page.locator('#save-status')).toContainText('已保存');
});

test('320px keyboard flow remains visible without horizontal overflow', async ({page}) => {
  await page.setViewportSize({width: 320, height: 760});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(topic);
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.locator('input[name="comparison-check"][value="same"]').focus();
  await page.keyboard.press('Space');
  await page.locator('#check-comparison').focus();
  await page.keyboard.press('Enter');
  await page.locator('input[name="trust-prediction"][value="act"]').focus();
  await page.keyboard.press('Space');
  await page.locator('#reveal-evidence').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#evidence-panel')).toBeVisible();
  await expect(page.locator('#form-steps')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
});

test('direct file and release subpath load without an AI network service', async ({page}) => {
  test.skip(!!publishedBase, '公网专项不打开本机文件或临时发布服务器');
  const remoteRequests = [], errors = [];
  watchExternalRequests(page, remoteRequests);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(resolve(__dirname, '../../computer/high/ai-system-dialogue.html')).href);
  await expect(page.getByRole('heading', {name: '信息系统对话交互实验室'})).toBeVisible();
  await complete(page);
  expect(remoteRequests).toEqual([]);

  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('computer/high/ai-system-dialogue.html', release.base).href);
    expect(response.status()).toBe(200);
    await complete(page);
    await expect(page.locator('#loan-status')).toHaveText('未续借');
  } finally { await release.close(); }
  expect(remoteRequests).toEqual([]);
  expect(errors).toEqual([]);
});
