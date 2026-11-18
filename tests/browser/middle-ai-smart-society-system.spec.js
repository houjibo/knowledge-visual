const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const publishedBase = process.env.KV_PUBLISHED_BASE_URL?.replace(/\/?$/, '/') || '';
const siteRoot = publishedBase || '/';
const topic = publishedBase
  ? new URL('ai/middle/smart-society-system.html', publishedBase).href
  : '/ai/middle/smart-society-system.html';
const progressKey = 'kv-ai-middle-progress';

function watchExternalRequests(page, requests) {
  page.on('request', request => {
    if (!/^https?:/.test(request.url())) return;
    const host = new URL(request.url()).hostname;
    if (host !== '127.0.0.1' && host !== 'localhost' && host !== '::1') requests.push(request.url());
  });
}

async function complete(page) {
  const mapping = {
    sensing: 'camera-sensor',
    network: 'comm-network',
    'data-platform': 'data-center',
    decision: 'algo-dispatch',
    application: 'travel-app',
    'people-rule': 'management-rule'
  };
  for (const [element, component] of Object.entries(mapping)) {
    await page.locator(`input[name="element-${element}"][value="${component}"]`).check();
  }
  await page.locator('#check-elements').click();
  const boundary = {
    'smart-traffic': 'system',
    'smart-community': 'system',
    'auto-door': 'single-automation',
    'timer-streetlight': 'single-automation',
    'standalone-thermostat': 'single-automation'
  };
  for (const [id, value] of Object.entries(boundary)) {
    await page.locator(`input[name="boundary-${id}"][value="${value}"]`).check();
  }
  await page.locator('#check-boundary').click();
  for (const id of ['data-self-hosting', 'open-standards', 'localize-capability']) {
    await page.locator(`input[name="control-practice"][value="${id}"]`).check();
  }
  await page.locator('#check-control').click();
}

test('identifies system elements, boundary and autonomous control', async ({page}) => {
  const errors = [], remoteRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  watchExternalRequests(page, remoteRequests);
  await page.goto(topic);
  await expect(page).toHaveTitle(/智慧社会系统辨析实验室/);
  await expect(page.locator('#element-list .case-card')).toHaveCount(6);
  await expect(page.locator('#boundary-panel')).toBeHidden();
  await expect(page.locator('#control-panel')).toBeHidden();

  await page.locator('#check-elements').click();
  await expect(page.locator('#elements-status')).toContainText('没有选择环节');

  // Wrong element mapping is rejected.
  await page.locator('input[name="element-sensing"][value="travel-app"]').check();
  for (const [element, component] of Object.entries({
    network: 'comm-network', 'data-platform': 'data-center',
    decision: 'algo-dispatch', application: 'camera-sensor', 'people-rule': 'management-rule'
  })) {
    await page.locator(`input[name="element-${element}"][value="${component}"]`).check();
  }
  await page.locator('#check-elements').click();
  await expect(page.locator('#elements-status')).toContainText('请重新判断');
  await expect(page.locator('#boundary-panel')).toBeHidden();

  // Correct all six.
  await page.locator('input[name="element-sensing"][value="camera-sensor"]').check();
  await page.locator('input[name="element-application"][value="travel-app"]').check();
  await page.locator('#check-elements').click();
  await expect(page.locator('#boundary-panel')).toBeVisible();
  await expect(page.locator('#boundary-title')).toBeFocused();

  await page.locator('#check-boundary').click();
  await expect(page.locator('#boundary-status')).toContainText('没有判断');

  // Calling an auto door a smart-society system is rejected.
  await page.locator('input[name="boundary-auto-door"][value="system"]').check();
  for (const [id, value] of Object.entries({
    'smart-traffic': 'system', 'smart-community': 'system',
    'timer-streetlight': 'single-automation', 'standalone-thermostat': 'single-automation'
  })) {
    await page.locator(`input[name="boundary-${id}"][value="${value}"]`).check();
  }
  await page.locator('#check-boundary').click();
  await expect(page.locator('#boundary-status')).toContainText('请重新判断');
  await expect(page.locator('#control-panel')).toBeHidden();
  await expect(page.locator('#learning-steps li[data-done="true"]')).toHaveCount(1);

  await page.locator('input[name="boundary-auto-door"][value="single-automation"]').check();
  await page.locator('#check-boundary').click();
  await expect(page.locator('#control-panel')).toBeVisible();
  await expect(page.locator('#control-title')).toBeFocused();

  // Selecting vendor lock-in fails the control step.
  await page.locator('input[name="control-practice"][value="single-vendor-lockin"]').check();
  for (const id of ['data-self-hosting', 'open-standards', 'localize-capability']) {
    await page.locator(`input[name="control-practice"][value="${id}"]`).check();
  }
  await page.locator('#check-control').click();
  await expect(page.locator('#control-status')).toContainText('请重新选择');

  await page.locator('input[name="control-practice"][value="single-vendor-lockin"]').uncheck();
  await page.locator('#check-control').click();
  await expect(page.locator('#learning-steps li[data-done="true"]')).toHaveCount(3);
  await expect(page.locator('#save-status')).toContainText('已保存');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey))
    .toEqual({'smart-society-system': true});
  expect(remoteRequests).toEqual([]);

  await page.goto(siteRoot);
  await expect(page.locator('[data-subject="ai"]')).toHaveAttribute('data-total', '12');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('ai');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('middle');
  await page.getByRole('searchbox', {name: '关键词'}).fill('智慧社会系统');
  await page.locator('#site-results a[href="ai/middle/smart-society-system.html"]').click();
  await expect(page).toHaveURL(/ai\/middle\/smart-society-system\.html/);
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
    .toEqual({'smart-society-system': true});
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
  await page.locator('input[name="element-sensing"][value="camera-sensor"]').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('input[name="element-sensing"][value="camera-sensor"]')).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
});

test('direct file and release subpath load without a platform service', async ({page}) => {
  test.skip(!!publishedBase, '公网专项不打开本机文件或临时发布服务器');
  const remoteRequests = [], errors = [];
  watchExternalRequests(page, remoteRequests);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(resolve(__dirname, '../../ai/middle/smart-society-system.html')).href);
  await expect(page.getByRole('heading', {name: '智慧社会系统辨析实验室'})).toBeVisible();
  await complete(page);
  expect(remoteRequests).toEqual([]);

  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('ai/middle/smart-society-system.html', release.base).href);
    expect(response.status()).toBe(200);
    await complete(page);
    await expect(page.locator('#snapshot-state')).toContainText('网络请求数=0');
  } finally { await release.close(); }
  expect(remoteRequests).toEqual([]);
  expect(errors).toEqual([]);
});
