const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const publishedBase = process.env.KV_PUBLISHED_BASE_URL?.replace(/\/?$/, '/') || '';
const siteRoot = publishedBase || '/';
const topic = publishedBase
  ? new URL('computer/middle/iot-experiment-procedure.html', publishedBase).href
  : '/computer/middle/iot-experiment-procedure.html';
const progressKey = 'kv-computer-middle-progress';

function watchExternalRequests(page, requests) {
  page.on('request', request => {
    if (!/^https?:/.test(request.url())) return;
    const host = new URL(request.url()).hostname;
    if (host !== '127.0.0.1' && host !== 'localhost' && host !== '::1') requests.push(request.url());
  });
}

async function complete(page) {
  const safety = {
    'check-before-power': 'safe', 'unplug-when-wiring': 'safe', 'anti-static': 'safe',
    'approved-power': 'safe', 'power-off-on-anomaly': 'safe',
    'hot-plug': 'unsafe', 'unknown-power': 'unsafe', 'wet-hands': 'unsafe'
  };
  for (const [id, value] of Object.entries(safety)) {
    await page.locator(`input[name="safety-${id}"][value="${value}"]`).check();
  }
  await page.locator('#check-safety').click();
  const order = ['define-goal', 'check-kit', 'wire-circuit', 'power-collect', 'record-data', 'power-off-tidy'];
  for (let i = 0; i < order.length; i++) {
    await page.locator(`select[name="order-${order[i]}"]`).selectOption(String(i + 1));
  }
  await page.locator('#check-order').click();
  const flow = {
    'device-collect': 'collect', 'network-transfer': 'transfer', 'platform-aggregate': 'aggregate',
    'analyze-use': 'analyze', 'archive': 'archive'
  };
  for (const [id, value] of Object.entries(flow)) {
    await page.locator(`input[name="flow-${id}"][value="${value}"]`).check();
  }
  await page.locator('#check-dataflow').click();
}

test('judges safety, orders procedure and matches data flow', async ({page}) => {
  const errors = [], remoteRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  watchExternalRequests(page, remoteRequests);
  await page.goto(topic);
  await expect(page).toHaveTitle(/物联网实验规程与数据流程实验室/);
  await expect(page.locator('#safety-list .case-card')).toHaveCount(8);
  await expect(page.locator('#procedure-panel')).toBeHidden();
  await expect(page.locator('#dataflow-panel')).toBeHidden();
  await expect(page.locator('#prep-note')).toContainText('不能替代亲手搭建原型');

  await page.locator('#check-safety').click();
  await expect(page.locator('#safety-status')).toContainText('没有判断');

  // Calling hot-plug safe is rejected.
  await page.locator('input[name="safety-hot-plug"][value="safe"]').check();
  for (const [id, value] of Object.entries({
    'check-before-power': 'safe', 'unplug-when-wiring': 'safe', 'anti-static': 'safe',
    'approved-power': 'safe', 'power-off-on-anomaly': 'safe',
    'unknown-power': 'unsafe', 'wet-hands': 'unsafe'
  })) {
    await page.locator(`input[name="safety-${id}"][value="${value}"]`).check();
  }
  await page.locator('#check-safety').click();
  await expect(page.locator('#safety-status')).toContainText('请重新判断');
  await expect(page.locator('#procedure-panel')).toBeHidden();

  await page.locator('input[name="safety-hot-plug"][value="unsafe"]').check();
  await page.locator('#check-safety').click();
  await expect(page.locator('#procedure-panel')).toBeVisible();
  await expect(page.locator('#procedure-title')).toBeFocused();

  // Wrong order (power before wiring) is rejected.
  const wrongOrder = ['define-goal', 'check-kit', 'power-collect', 'wire-circuit', 'record-data', 'power-off-tidy'];
  for (let i = 0; i < wrongOrder.length; i++) {
    await page.locator(`select[name="order-${wrongOrder[i]}"]`).selectOption(String(i + 1));
  }
  await page.locator('#check-order').click();
  await expect(page.locator('#order-status')).toContainText('请重新排序');
  await expect(page.locator('#dataflow-panel')).toBeHidden();
  await expect(page.locator('#learning-steps li[data-done="true"]')).toHaveCount(1);

  const order = ['define-goal', 'check-kit', 'wire-circuit', 'power-collect', 'record-data', 'power-off-tidy'];
  for (let i = 0; i < order.length; i++) {
    await page.locator(`select[name="order-${order[i]}"]`).selectOption(String(i + 1));
  }
  await page.locator('#check-order').click();
  await expect(page.locator('#dataflow-panel')).toBeVisible();
  await expect(page.locator('#dataflow-title')).toBeFocused();

  // Mis-matching aggregation as collection is rejected.
  await page.locator('input[name="flow-platform-aggregate"][value="collect"]').check();
  for (const [id, value] of Object.entries({
    'device-collect': 'collect', 'network-transfer': 'transfer',
    'analyze-use': 'analyze', 'archive': 'archive'
  })) {
    await page.locator(`input[name="flow-${id}"][value="${value}"]`).check();
  }
  await page.locator('#check-dataflow').click();
  await expect(page.locator('#dataflow-status')).toContainText('请重新判断');

  await page.locator('input[name="flow-platform-aggregate"][value="aggregate"]').check();
  await page.locator('#check-dataflow').click();
  await expect(page.locator('#learning-steps li[data-done="true"]')).toHaveCount(3);
  await expect(page.locator('#save-status')).toContainText('已保存');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey))
    .toEqual({'iot-experiment-procedure': true});
  expect(remoteRequests).toEqual([]);

  await page.goto(siteRoot);
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total', '30');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('middle');
  await page.getByRole('searchbox', {name: '关键词'}).fill('实验规程');
  await page.locator('#site-results a[href="computer/middle/iot-experiment-procedure.html"]').click();
  await expect(page).toHaveURL(/computer\/middle\/iot-experiment-procedure\.html/);
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
    .toEqual({'iot-experiment-procedure': true});
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
  await page.locator('input[name="safety-check-before-power"][value="safe"]').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('input[name="safety-check-before-power"][value="safe"]')).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
});

test('direct file and release subpath load without a device network service', async ({page}) => {
  test.skip(!!publishedBase, '公网专项不打开本机文件或临时发布服务器');
  const remoteRequests = [], errors = [];
  watchExternalRequests(page, remoteRequests);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(resolve(__dirname, '../../computer/middle/iot-experiment-procedure.html')).href);
  await expect(page.getByRole('heading', {name: '物联网实验规程与数据流程实验室'})).toBeVisible();
  await complete(page);
  expect(remoteRequests).toEqual([]);

  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('computer/middle/iot-experiment-procedure.html', release.base).href);
    expect(response.status()).toBe(200);
    await complete(page);
    await expect(page.locator('#snapshot-state')).toContainText('网络请求数=0');
  } finally { await release.close(); }
  expect(remoteRequests).toEqual([]);
  expect(errors).toEqual([]);
});
