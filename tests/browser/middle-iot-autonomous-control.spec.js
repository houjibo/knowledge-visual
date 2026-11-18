const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const publishedBase = process.env.KV_PUBLISHED_BASE_URL?.replace(/\/?$/, '/') || '';
const siteRoot = publishedBase || '/';
const topic = publishedBase
  ? new URL('computer/middle/iot-autonomous-control.html', publishedBase).href
  : '/computer/middle/iot-autonomous-control.html';
const progressKey = 'kv-computer-middle-progress';

function watchExternalRequests(page, requests) {
  page.on('request', request => {
    if (!/^https?:/.test(request.url())) return;
    const host = new URL(request.url()).hostname;
    if (host !== '127.0.0.1' && host !== 'localhost' && host !== '::1') requests.push(request.url());
  });
}

async function complete(page) {
  const trust = {
    'official-store': 'trusted',
    'signed-update': 'trusted',
    'unknown-drive': 'untrusted',
    'tampered-firmware': 'untrusted'
  };
  for (const [id, value] of Object.entries(trust)) {
    await page.locator(`input[name="supply-${id}"][value="${value}"]`).check();
  }
  await page.locator('#check-supply').click();
  await page.locator('input[name="maintenance-timely-patch"][value="true"]').check();
  await page.locator('input[name="maintenance-ignore-updates"][value="false"]').check();
  await page.locator('input[name="maintenance-eol-device"][value="false"]').check();
  await page.locator('#check-maintenance').click();
  for (const id of ['data-self-hosting', 'open-standards', 'localize-capability']) {
    await page.locator(`input[name="control-practice"][value="${id}"]`).check();
  }
  await page.locator('#check-control').click();
}

test('judges supply chain, maintenance and autonomous control', async ({page}) => {
  const errors = [], remoteRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  watchExternalRequests(page, remoteRequests);
  await page.goto(topic);
  await expect(page).toHaveTitle(/物联网自主可控与安全实验室/);
  await expect(page.locator('#supply-list .case-card')).toHaveCount(4);
  await expect(page.locator('#maintenance-panel')).toBeHidden();
  await expect(page.locator('#control-panel')).toBeHidden();

  await page.locator('#check-supply').click();
  await expect(page.locator('#supply-status')).toContainText('没有判断');

  // Trusting tampered firmware is rejected.
  await page.locator('input[name="supply-tampered-firmware"][value="trusted"]').check();
  for (const [id, value] of Object.entries({
    'official-store': 'trusted', 'signed-update': 'trusted', 'unknown-drive': 'untrusted'
  })) {
    await page.locator(`input[name="supply-${id}"][value="${value}"]`).check();
  }
  await page.locator('#check-supply').click();
  await expect(page.locator('#supply-status')).toContainText('请重新判断');
  await expect(page.locator('#maintenance-panel')).toBeHidden();

  await page.locator('input[name="supply-tampered-firmware"][value="untrusted"]').check();
  await page.locator('#check-supply').click();
  await expect(page.locator('#maintenance-panel')).toBeVisible();
  await expect(page.locator('#maintenance-title')).toBeFocused();

  await page.locator('#check-maintenance').click();
  await expect(page.locator('#maintenance-status')).toContainText('没有判断');

  // Calling an EOL device safe is rejected.
  await page.locator('input[name="maintenance-timely-patch"][value="true"]').check();
  await page.locator('input[name="maintenance-ignore-updates"][value="false"]').check();
  await page.locator('input[name="maintenance-eol-device"][value="true"]').check();
  await page.locator('#check-maintenance').click();
  await expect(page.locator('#maintenance-status')).toContainText('请重新判断');
  await expect(page.locator('#control-panel')).toBeHidden();
  await expect(page.locator('#learning-steps li[data-done="true"]')).toHaveCount(1);

  await page.locator('input[name="maintenance-eol-device"][value="false"]').check();
  await page.locator('#check-maintenance').click();
  await expect(page.locator('#control-panel')).toBeVisible();
  await expect(page.locator('#control-title')).toBeFocused();

  // Brand-nationality shortcut is not a valid control practice.
  await page.locator('input[name="control-practice"][value="brand-nationality-shortcut"]').check();
  for (const id of ['data-self-hosting', 'open-standards', 'localize-capability']) {
    await page.locator(`input[name="control-practice"][value="${id}"]`).check();
  }
  await page.locator('#check-control').click();
  await expect(page.locator('#control-status')).toContainText('请重新选择');

  await page.locator('input[name="control-practice"][value="brand-nationality-shortcut"]').uncheck();
  await page.locator('#check-control').click();
  await expect(page.locator('#learning-steps li[data-done="true"]')).toHaveCount(3);
  await expect(page.locator('#save-status')).toContainText('已保存');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey))
    .toEqual({'iot-autonomous-control': true});
  expect(remoteRequests).toEqual([]);

  await page.goto(siteRoot);
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total', '29');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('middle');
  await page.getByRole('searchbox', {name: '关键词'}).fill('物联网自主可控');
  await page.locator('#site-results a[href="computer/middle/iot-autonomous-control.html"]').click();
  await expect(page).toHaveURL(/computer\/middle\/iot-autonomous-control\.html/);
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
    .toEqual({'iot-autonomous-control': true});
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
  await page.locator('input[name="supply-official-store"][value="trusted"]').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('input[name="supply-official-store"][value="trusted"]')).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
});

test('direct file and release subpath load without a device network service', async ({page}) => {
  test.skip(!!publishedBase, '公网专项不打开本机文件或临时发布服务器');
  const remoteRequests = [], errors = [];
  watchExternalRequests(page, remoteRequests);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(resolve(__dirname, '../../computer/middle/iot-autonomous-control.html')).href);
  await expect(page.getByRole('heading', {name: '物联网自主可控与安全实验室'})).toBeVisible();
  await complete(page);
  expect(remoteRequests).toEqual([]);

  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('computer/middle/iot-autonomous-control.html', release.base).href);
    expect(response.status()).toBe(200);
    await complete(page);
    await expect(page.locator('#snapshot-state')).toContainText('网络请求数=0');
  } finally { await release.close(); }
  expect(remoteRequests).toEqual([]);
  expect(errors).toEqual([]);
});
