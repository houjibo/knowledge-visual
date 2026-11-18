const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const publishedBase = process.env.KV_PUBLISHED_BASE_URL?.replace(/\/?$/, '/') || '';
const siteRoot = publishedBase || '/';
const topic = publishedBase
  ? new URL('ai/middle/ai-application-recognition.html', publishedBase).href
  : '/ai/middle/ai-application-recognition.html';
const progressKey = 'kv-ai-middle-progress';

function watchExternalRequests(page, requests) {
  page.on('request', request => {
    if (!/^https?:/.test(request.url())) return;
    const host = new URL(request.url()).hostname;
    if (host !== '127.0.0.1' && host !== 'localhost' && host !== '::1') requests.push(request.url());
  });
}

async function complete(page) {
  const kinds = {
    'voice-assistant': 'ai', 'recommender': 'ai', 'image-recognition': 'ai',
    'adaptive-learning': 'ai', 'auto-door': 'automation',
    'timer-streetlight': 'automation', 'thermostat': 'automation'
  };
  for (const [id, value] of Object.entries(kinds)) {
    await page.locator(`input[name="kind-${id}"][value="${value}"]`).check();
  }
  await page.locator('#check-classify').click();
  const impacts = {
    'voice-assistant': ['learning', 'life', 'work'],
    'recommender': ['learning', 'life', 'work'],
    'image-recognition': ['life', 'work'],
    'adaptive-learning': ['learning']
  };
  for (const [id, domains] of Object.entries(impacts)) {
    for (const domain of domains) {
      await page.locator(`input[name="impact-${id}"][value="${domain}"]`).check();
    }
  }
  await page.locator('#check-impact').click();
  const boundary = {
    'image-sort': 'ai-reliable', 'speech-draft': 'ai-reliable',
    'medical-diagnosis': 'human-review', 'hiring-screen': 'human-review', 'fact-check': 'human-review'
  };
  for (const [id, value] of Object.entries(boundary)) {
    await page.locator(`input[name="boundary-${id}"][value="${value}"]`).check();
  }
  await page.locator('#check-boundary').click();
}

test('classifies apps, judges impacts and capability boundary', async ({page}) => {
  const errors = [], remoteRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  watchExternalRequests(page, remoteRequests);
  await page.goto(topic);
  await expect(page).toHaveTitle(/AI 应用识别实验室/);
  await expect(page.locator('#app-list .case-card')).toHaveCount(7);
  await expect(page.locator('#impact-panel')).toBeHidden();
  await expect(page.locator('#boundary-panel')).toBeHidden();

  await page.locator('#check-classify').click();
  await expect(page.locator('#classify-status')).toContainText('没有判断');

  // Calling an auto door an AI app is rejected.
  await page.locator('input[name="kind-auto-door"][value="ai"]').check();
  for (const [id, value] of Object.entries({
    'voice-assistant': 'ai', 'recommender': 'ai', 'image-recognition': 'ai',
    'adaptive-learning': 'ai', 'timer-streetlight': 'automation', 'thermostat': 'automation'
  })) {
    await page.locator(`input[name="kind-${id}"][value="${value}"]`).check();
  }
  await page.locator('#check-classify').click();
  await expect(page.locator('#classify-status')).toContainText('请重新判断');
  await expect(page.locator('#impact-panel')).toBeHidden();

  await page.locator('input[name="kind-auto-door"][value="automation"]').check();
  await page.locator('#check-classify').click();
  await expect(page.locator('#impact-panel')).toBeVisible();
  await expect(page.locator('#impact-title')).toBeFocused();

  await page.locator('#check-impact').click();
  await expect(page.locator('#impact-status')).toContainText('没有选择影响域');

  // Missing one impact domain is rejected.
  await page.locator('input[name="impact-voice-assistant"][value="learning"]').check();
  await page.locator('input[name="impact-voice-assistant"][value="life"]').check();
  for (const [id, domains] of Object.entries({
    'recommender': ['learning', 'life', 'work'],
    'image-recognition': ['life', 'work'], 'adaptive-learning': ['learning']
  })) {
    for (const domain of domains) {
      await page.locator(`input[name="impact-${id}"][value="${domain}"]`).check();
    }
  }
  await page.locator('#check-impact').click();
  await expect(page.locator('#impact-status')).toContainText('请重新选择');
  await expect(page.locator('#boundary-panel')).toBeHidden();
  await expect(page.locator('#learning-steps li[data-done="true"]')).toHaveCount(1);

  await page.locator('input[name="impact-voice-assistant"][value="work"]').check();
  await page.locator('#check-impact').click();
  await expect(page.locator('#boundary-panel')).toBeVisible();
  await expect(page.locator('#boundary-title')).toBeFocused();

  // Treating a medical diagnosis as fully AI-reliable is rejected.
  await page.locator('input[name="boundary-medical-diagnosis"][value="ai-reliable"]').check();
  for (const [id, value] of Object.entries({
    'image-sort': 'ai-reliable', 'speech-draft': 'ai-reliable',
    'hiring-screen': 'human-review', 'fact-check': 'human-review'
  })) {
    await page.locator(`input[name="boundary-${id}"][value="${value}"]`).check();
  }
  await page.locator('#check-boundary').click();
  await expect(page.locator('#boundary-status')).toContainText('请重新判断');

  await page.locator('input[name="boundary-medical-diagnosis"][value="human-review"]').check();
  await page.locator('#check-boundary').click();
  await expect(page.locator('#learning-steps li[data-done="true"]')).toHaveCount(3);
  await expect(page.locator('#save-status')).toContainText('已保存');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey))
    .toEqual({'ai-application-recognition': true});
  expect(remoteRequests).toEqual([]);

  await page.goto(siteRoot);
  await expect(page.locator('[data-subject="ai"]')).toHaveAttribute('data-total', '12');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('ai');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('middle');
  await page.getByRole('searchbox', {name: '关键词'}).fill('AI 应用识别');
  await page.locator('#site-results a[href="ai/middle/ai-application-recognition.html"]').click();
  await expect(page).toHaveURL(/ai\/middle\/ai-application-recognition\.html/);
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
    .toEqual({'ai-application-recognition': true});
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
  await complete(page);
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
  await page.locator('input[name="kind-auto-door"][value="automation"]').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('input[name="kind-auto-door"][value="automation"]')).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
});

test('direct file and release subpath load without a platform service', async ({page}) => {
  test.skip(!!publishedBase, '公网专项不打开本机文件或临时发布服务器');
  const remoteRequests = [], errors = [];
  watchExternalRequests(page, remoteRequests);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(resolve(__dirname, '../../ai/middle/ai-application-recognition.html')).href);
  await expect(page.getByRole('heading', {name: 'AI 应用识别实验室'})).toBeVisible();
  await complete(page);
  expect(remoteRequests).toEqual([]);

  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('ai/middle/ai-application-recognition.html', release.base).href);
    expect(response.status()).toBe(200);
    await complete(page);
    await expect(page.locator('#snapshot-state')).toContainText('网络请求数=0');
  } finally { await release.close(); }
  expect(remoteRequests).toEqual([]);
  expect(errors).toEqual([]);
});
