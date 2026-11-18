const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const publishedBase = process.env.KV_PUBLISHED_BASE_URL?.replace(/\/?$/, '/') || '';
const siteRoot = publishedBase || '/';
const topic = publishedBase
  ? new URL('computer/high/genai-responsible-use.html', publishedBase).href
  : '/computer/high/genai-responsible-use.html';
const progressKey = 'kv-computer-high-progress';
const SHAREABLE = ['c1', 'c2', 'c3'];
const SENSITIVE = ['c4', 'c5', 'c6'];

function watchExternalRequests(page, requests) {
  page.on('request', request => {
    if (!/^https?:/.test(request.url())) return;
    const host = new URL(request.url()).hostname;
    if (host !== '127.0.0.1' && host !== 'localhost' && host !== '::1') requests.push(request.url());
  });
}

async function complete(page, {prediction = 'trust-all'} = {}) {
  for (const id of SHAREABLE) await page.locator(`input[name="input-${id}"][value="true"]`).check();
  for (const id of SENSITIVE) await page.locator(`input[name="input-${id}"][value="false"]`).check();
  await page.locator('#check-inputs').click();
  await page.locator(`input[name="genai-prediction"][value="${prediction}"]`).check();
  await page.locator('#reveal-sources').click();
  await page.locator('input[name="verdict-out-a"][value="cite"]').check();
  await page.locator('input[name="verdict-out-b"][value="reject"]').check();
  await page.locator('#check-verdicts').click();
  await page.locator('input[name="snapshot-decision"][value="verified-only"]').check();
  await page.locator('#check-snapshot').click();
}

test('classifies inputs, verifies generated outputs against sources and keeps the collaboration snapshot local', async ({page}) => {
  const errors = [], remoteRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  watchExternalRequests(page, remoteRequests);
  await page.goto(topic);
  await expect(page).toHaveTitle(/生成式 AI 负责任使用实验室/);
  await expect(page.locator('#candidate-grid .candidate-card')).toHaveCount(6);
  await expect(page.locator('#sources-panel')).toBeHidden();
  await expect(page.locator('#reveal-sources')).toBeDisabled();

  await page.locator('#check-inputs').click();
  await expect(page.locator('#input-status')).toContainText('没有分类');

  for (const id of SHAREABLE) await page.locator(`input[name="input-${id}"][value="true"]`).check();
  for (const id of ['c5', 'c6']) await page.locator(`input[name="input-${id}"][value="false"]`).check();
  await page.locator('input[name="input-c4"][value="true"]').check();
  await page.locator('#check-inputs').click();
  await expect(page.locator('#input-status')).toContainText('请重新分类');
  await expect(page.locator('#reveal-sources')).toBeDisabled();
  await page.locator('input[name="input-c4"][value="false"]').check();

  for (const id of SHAREABLE) await page.locator(`input[name="input-${id}"][value="true"]`).check();
  for (const id of SENSITIVE) await page.locator(`input[name="input-${id}"][value="false"]`).check();
  await page.locator('#check-inputs').click();
  await expect(page.locator('#reveal-sources')).toBeEnabled();

  await page.locator('#reveal-sources').click();
  await expect(page.locator('#prediction-status')).toContainText('先选择');
  await page.locator('input[name="genai-prediction"][value="trust-all"]').check();
  await page.locator('#reveal-sources').click();
  await expect(page.locator('#sources-panel')).toBeVisible();
  await expect(page.locator('#sources-title')).toBeFocused();
  await expect(page.locator('#source-grid .source-card')).toHaveCount(2);
  await expect(page.locator('#output-grid .output-card')).toHaveCount(2);

  await page.locator('#check-verdicts').click();
  await expect(page.locator('#verdict-status')).toContainText('请为两段');
  await page.locator('input[name="verdict-out-b"][value="cite"]').check();
  await page.locator('input[name="verdict-out-a"][value="cite"]').check();
  await page.locator('#check-verdicts').click();
  await expect(page.locator('#verdict-status')).toContainText('白皮书');
  await expect(page.locator('#verdict-status')).toContainText('不能直接采用');
  await expect(page.locator('#snapshot-panel')).toBeHidden();
  await expect(page.locator('#learning-steps li[data-done="true"]')).toHaveCount(1);

  await page.locator('input[name="verdict-out-b"][value="reject"]').check();
  await page.locator('#check-verdicts').click();
  await expect(page.locator('#snapshot-panel')).toBeVisible();
  await expect(page.locator('#snapshot-title')).toBeFocused();
  await expect(page.locator('#snapshot-state')).toContainText('网络请求数为 0');

  await page.locator('input[name="snapshot-decision"][value="include-b"]').check();
  await page.locator('#check-snapshot').click();
  await expect(page.locator('#snapshot-status')).toContainText('不能进入协作快照');
  await page.locator('input[name="snapshot-decision"][value="verified-only"]').check();
  await page.locator('#check-snapshot').click();
  await expect(page.locator('#learning-steps li[data-done="true"]')).toHaveCount(3);
  await expect(page.locator('#save-status')).toContainText('已保存');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey))
    .toEqual({'genai-responsible-use': true});
  expect(remoteRequests).toEqual([]);

  await page.goto(siteRoot);
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total', '30');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('high');
  await page.getByRole('searchbox', {name: '关键词'}).fill('生成式 AI 负责任使用');
  await page.locator('#site-results a[href="computer/high/genai-responsible-use.html"]').click();
  await expect(page).toHaveURL(/computer\/high\/genai-responsible-use\.html/);
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
    .toEqual({'genai-responsible-use': true});
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
  await complete(page, {prediction: 'verify-first'});
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
  await page.locator('input[name="input-c1"][value="true"]').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('input[name="input-c1"][value="true"]')).toBeChecked();
  await page.locator('#check-inputs').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#input-status')).toContainText('没有分类');
  await expect(page.locator('#candidate-grid')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
});

test('direct file and release subpath load without an AI network service', async ({page}) => {
  test.skip(!!publishedBase, '公网专项不打开本机文件或临时发布服务器');
  const remoteRequests = [], errors = [];
  watchExternalRequests(page, remoteRequests);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(resolve(__dirname, '../../computer/high/genai-responsible-use.html')).href);
  await expect(page.getByRole('heading', {name: '生成式 AI 负责任使用实验室'})).toBeVisible();
  await complete(page);
  expect(remoteRequests).toEqual([]);

  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('computer/high/genai-responsible-use.html', release.base).href);
    expect(response.status()).toBe(200);
    await complete(page);
    await expect(page.locator('#snapshot-state')).toContainText('网络请求数为 0');
  } finally { await release.close(); }
  expect(remoteRequests).toEqual([]);
  expect(errors).toEqual([]);
});
