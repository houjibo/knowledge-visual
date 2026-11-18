const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const publishedBase = process.env.KV_PUBLISHED_BASE_URL?.replace(/\/?$/, '/') || '';
const siteRoot = publishedBase || '/';
const topic = publishedBase
  ? new URL('computer/middle/iot-device-identity.html', publishedBase).href
  : '/computer/middle/iot-device-identity.html';
const progressKey = 'kv-computer-middle-progress';

function watchExternalRequests(page, requests) {
  page.on('request', request => {
    if (!/^https?:/.test(request.url())) return;
    const host = new URL(request.url()).hostname;
    if (host !== '127.0.0.1' && host !== 'localhost' && host !== '::1') requests.push(request.url());
  });
}

async function complete(page) {
  const identity = {
    'smart-meter': 'device-id',
    'smart-speaker': 'serial-number',
    wearable: 'mac-address',
    gateway: 'cloud-account-binding'
  };
  for (const [device, id] of Object.entries(identity)) {
    await page.locator(`input[name="identity-${device}"][value="${id}"]`).check();
  }
  await page.locator('#check-identity').click();
  await page.locator('input[name="inference-smart-meter"][value="daily-routine"]').check();
  await page.locator('input[name="inference-location"][value="home-commute"]').check();
  await page.locator('input[name="inference-wearable"][value="health-condition"]').check();
  await page.locator('#check-inference').click();
  await page.locator('input[name="protection-anonymize"][value="rotate-random-id"]').check();
  await page.locator('input[name="protection-minimize"][value="collect-required-only"]').check();
  await page.locator('#check-protection').click();
}

test('matches device identities, infers personal data and chooses privacy protection', async ({page}) => {
  const errors = [], remoteRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  watchExternalRequests(page, remoteRequests);
  await page.goto(topic);
  await expect(page).toHaveTitle(/物联设备数字身份与隐私实验室/);
  await expect(page.locator('#device-list .case-card')).toHaveCount(4);
  await expect(page.locator('#inference-panel')).toBeHidden();
  await expect(page.locator('#protection-panel')).toBeHidden();

  await page.locator('#check-identity').click();
  await expect(page.locator('#identity-status')).toContainText('没有选择标识');

  // National ID is not a device identity.
  await page.locator('input[name="identity-wearable"][value="national-id"]').check();
  for (const [device, id] of Object.entries({
    'smart-meter': 'device-id', 'smart-speaker': 'serial-number', gateway: 'cloud-account-binding'
  })) {
    await page.locator(`input[name="identity-${device}"][value="${id}"]`).check();
  }
  await page.locator('#check-identity').click();
  await expect(page.locator('#identity-status')).toContainText('请重新匹配');
  await expect(page.locator('#inference-panel')).toBeHidden();

  await page.locator('input[name="identity-wearable"][value="mac-address"]').check();
  await page.locator('#check-identity').click();
  await expect(page.locator('#inference-panel')).toBeVisible();
  await expect(page.locator('#inference-title')).toBeFocused();

  await page.locator('#check-inference').click();
  await expect(page.locator('#inference-status')).toContainText('没有判断');

  // Claiming no inference possible is rejected.
  await page.locator('input[name="inference-smart-meter"][value="none"]').check();
  await page.locator('input[name="inference-location"][value="home-commute"]').check();
  await page.locator('input[name="inference-wearable"][value="health-condition"]').check();
  await page.locator('#check-inference').click();
  await expect(page.locator('#inference-status')).toContainText('请重新判断');
  await expect(page.locator('#protection-panel')).toBeHidden();
  await expect(page.locator('#learning-steps li[data-done="true"]')).toHaveCount(1);

  await page.locator('input[name="inference-smart-meter"][value="daily-routine"]').check();
  await page.locator('#check-inference').click();
  await expect(page.locator('#protection-panel')).toBeVisible();
  await expect(page.locator('#protection-title')).toBeFocused();

  // Keeping a fixed ID fails anonymization.
  await page.locator('input[name="protection-anonymize"][value="keep-fixed-id"]').check();
  await page.locator('input[name="protection-minimize"][value="collect-required-only"]').check();
  await page.locator('#check-protection').click();
  await expect(page.locator('#protection-status')).toContainText('请重新选择');

  await page.locator('input[name="protection-anonymize"][value="rotate-random-id"]').check();
  await page.locator('#check-protection').click();
  await expect(page.locator('#learning-steps li[data-done="true"]')).toHaveCount(3);
  await expect(page.locator('#save-status')).toContainText('已保存');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey))
    .toEqual({'iot-device-identity': true});
  expect(remoteRequests).toEqual([]);

  await page.goto(siteRoot);
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total', '28');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('middle');
  await page.getByRole('searchbox', {name: '关键词'}).fill('物联设备数字身份');
  await page.locator('#site-results a[href="computer/middle/iot-device-identity.html"]').click();
  await expect(page).toHaveURL(/computer\/middle\/iot-device-identity\.html/);
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
    .toEqual({'iot-device-identity': true});
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
  await page.locator('input[name="identity-smart-meter"][value="device-id"]').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('input[name="identity-smart-meter"][value="device-id"]')).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
});

test('direct file and release subpath load without a device network service', async ({page}) => {
  test.skip(!!publishedBase, '公网专项不打开本机文件或临时发布服务器');
  const remoteRequests = [], errors = [];
  watchExternalRequests(page, remoteRequests);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(resolve(__dirname, '../../computer/middle/iot-device-identity.html')).href);
  await expect(page.getByRole('heading', {name: '物联设备数字身份与隐私实验室'})).toBeVisible();
  await complete(page);
  expect(remoteRequests).toEqual([]);

  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('computer/middle/iot-device-identity.html', release.base).href);
    expect(response.status()).toBe(200);
    await complete(page);
    await expect(page.locator('#snapshot-state')).toContainText('网络请求数=0');
  } finally { await release.close(); }
  expect(remoteRequests).toEqual([]);
  expect(errors).toEqual([]);
});
