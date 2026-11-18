const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const publishedBase = process.env.KV_PUBLISHED_BASE_URL?.replace(/\/?$/, '/') || '';
const siteRoot = publishedBase || '/';
const topic = publishedBase
  ? new URL('computer/high/device-platform-choice.html', publishedBase).href
  : '/computer/high/device-platform-choice.html';
const progressKey = 'kv-computer-high-progress';

function watchExternalRequests(page, requests) {
  page.on('request', request => {
    if (!/^https?:/.test(request.url())) return;
    const host = new URL(request.url()).hostname;
    if (host !== '127.0.0.1' && host !== 'localhost' && host !== '::1') requests.push(request.url());
  });
}

async function complete(page, {device = 'rugged-tablet'} = {}) {
  await page.locator(`input[name="device-choice"][value="${device}"]`).check();
  await page.locator('#check-device').click();
  await page.locator('input[name="stage-field"][value="offline-notes"]').check();
  await page.locator('input[name="stage-camp"][value="cloud-doc"]').check();
  await page.locator('input[name="stage-school"][value="cloud-doc"]').check();
  await page.locator('#check-platforms').click();
  await page.locator('input[name="active-members"][value="member-a"]').check();
  await page.locator('input[name="active-members"][value="member-b"]').check();
  await page.locator('input[name="conflict-action"][value="keep-both-merge"]').check();
  await page.locator('#check-data').click();
}

test('chooses a device, matches stages to platforms and uses platform data', async ({page}) => {
  const errors = [], remoteRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  watchExternalRequests(page, remoteRequests);
  await page.goto(topic);
  await expect(page).toHaveTitle(/设备与平台选择实验室/);
  await expect(page.locator('#device-grid .device-card')).toHaveCount(4);
  await expect(page.locator('#platform-panel')).toBeHidden();
  await expect(page.locator('#data-panel')).toBeHidden();

  await page.locator('#check-device').click();
  await expect(page.locator('#device-status')).toContainText('选择一台设备');

  await page.locator('input[name="device-choice"][value="desktop-workstation"]').check();
  await page.locator('#check-device').click();
  await expect(page.locator('#device-status')).toContainText('请重新选择');
  await expect(page.locator('#platform-panel')).toBeHidden();

  await page.locator('input[name="device-choice"][value="rugged-tablet"]').check();
  await page.locator('#check-device').click();
  await expect(page.locator('#platform-panel')).toBeVisible();
  await expect(page.locator('#platform-title')).toBeFocused();

  await page.locator('#check-platforms').click();
  await expect(page.locator('#platform-status')).toContainText('没有选择平台');
  await page.locator('input[name="stage-field"][value="cloud-doc"]').check();
  await page.locator('input[name="stage-camp"][value="cloud-doc"]').check();
  await page.locator('input[name="stage-school"][value="cloud-doc"]').check();
  await page.locator('#check-platforms').click();
  await expect(page.locator('#platform-status')).toContainText('请重新匹配');
  await expect(page.locator('#data-panel')).toBeHidden();
  await expect(page.locator('#learning-steps li[data-done="true"]')).toHaveCount(1);

  await page.locator('input[name="stage-field"][value="offline-notes"]').check();
  await page.locator('input[name="stage-camp"][value="video-site"]').check();
  await page.locator('#check-platforms').click();
  await expect(page.locator('#platform-status')).toContainText('视频网站');
  await page.locator('input[name="stage-camp"][value="cloud-doc"]').check();
  await page.locator('#check-platforms').click();
  await expect(page.locator('#data-panel')).toBeVisible();
  await expect(page.locator('#data-title')).toBeFocused();
  await expect(page.locator('#contribution-body tr')).toHaveCount(3);

  await page.locator('input[name="active-members"][value="member-c"]').check();
  await page.locator('input[name="conflict-action"][value="keep-both-merge"]').check();
  await page.locator('#check-data').click();
  await expect(page.locator('#data-status')).toContainText('请重新判断');

  await page.locator('input[name="active-members"][value="member-c"]').uncheck();
  await page.locator('input[name="active-members"][value="member-a"]').check();
  await page.locator('input[name="active-members"][value="member-b"]').check();
  await page.locator('input[name="conflict-action"][value="overwrite-with-cloud"]').check();
  await page.locator('#check-data').click();
  await expect(page.locator('#data-status')).toContainText('请重新判断');

  await page.locator('input[name="conflict-action"][value="keep-both-merge"]').check();
  await page.locator('#check-data').click();
  await expect(page.locator('#learning-steps li[data-done="true"]')).toHaveCount(3);
  await expect(page.locator('#save-status')).toContainText('已保存');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey))
    .toEqual({'device-platform-choice': true});
  expect(remoteRequests).toEqual([]);

  await page.goto(siteRoot);
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total', '26');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('high');
  await page.getByRole('searchbox', {name: '关键词'}).fill('设备与平台选择');
  await page.locator('#site-results a[href="computer/high/device-platform-choice.html"]').click();
  await expect(page).toHaveURL(/computer\/high\/device-platform-choice\.html/);
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
    .toEqual({'device-platform-choice': true});
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
  await page.locator('input[name="device-choice"][value="rugged-tablet"]').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('input[name="device-choice"][value="rugged-tablet"]')).toBeChecked();
  await page.locator('#check-device').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#device-status')).toContainText('正确');
  await expect(page.locator('#device-grid')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
});

test('direct file and release subpath load without a platform network service', async ({page}) => {
  test.skip(!!publishedBase, '公网专项不打开本机文件或临时发布服务器');
  const remoteRequests = [], errors = [];
  watchExternalRequests(page, remoteRequests);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(resolve(__dirname, '../../computer/high/device-platform-choice.html')).href);
  await expect(page.getByRole('heading', {name: '设备与平台选择实验室'})).toBeVisible();
  await complete(page);
  expect(remoteRequests).toEqual([]);

  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('computer/high/device-platform-choice.html', release.base).href);
    expect(response.status()).toBe(200);
    await complete(page);
    await expect(page.locator('#snapshot-state')).toContainText('网络请求数=0');
  } finally { await release.close(); }
  expect(remoteRequests).toEqual([]);
  expect(errors).toEqual([]);
});
