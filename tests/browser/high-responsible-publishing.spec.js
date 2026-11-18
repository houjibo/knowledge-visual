const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const publishedBase = process.env.KV_PUBLISHED_BASE_URL?.replace(/\/?$/, '/') || '';
const siteRoot = publishedBase || '/';
const topic = publishedBase
  ? new URL('computer/high/responsible-publishing.html', publishedBase).href
  : '/computer/high/responsible-publishing.html';
const progressKey = 'kv-computer-high-progress';

function watchExternalRequests(page, requests) {
  page.on('request', request => {
    if (!/^https?:/.test(request.url())) return;
    const host = new URL(request.url()).hostname;
    if (host !== '127.0.0.1' && host !== 'localhost' && host !== '::1') requests.push(request.url());
  });
}

async function complete(page, {platform = 'school-platform'} = {}) {
  await page.locator(`input[name="platform-choice"][value="${platform}"]`).check();
  await page.locator('#check-platform').click();
  await page.locator('input[name="check-source"][value="fail"]').check();
  await page.locator('input[name="check-privacy"][value="fail"]').check();
  await page.locator('input[name="check-authorization"][value="fail"]').check();
  await page.locator('input[name="check-permission"][value="pass"]').check();
  await page.locator('#check-prepublish').click();
  await page.locator('input[name="withdrawal"][value="retract-original-copies-persist"]').check();
  await page.locator('#check-withdrawal').click();
}

test('chooses a platform, blocks the flawed draft and recognises withdrawal limits', async ({page}) => {
  const errors = [], remoteRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  watchExternalRequests(page, remoteRequests);
  await page.goto(topic);
  await expect(page).toHaveTitle(/负责任发布与传播实验室/);
  await expect(page.locator('#platform-grid .platform-card')).toHaveCount(3);
  await expect(page.locator('#withdrawal-panel')).toBeHidden();
  await expect(page.locator('#check-prepublish')).toBeDisabled();

  await page.locator('#check-platform').click();
  await expect(page.locator('#platform-status')).toContainText('选择一个平台');

  await page.locator('input[name="platform-choice"][value="personal-public"]').check();
  await page.locator('#check-platform').click();
  await expect(page.locator('#platform-status')).toContainText('请重新选择');
  await expect(page.locator('#check-prepublish')).toBeDisabled();

  await page.locator('input[name="platform-choice"][value="school-platform"]').check();
  await page.locator('#check-platform').click();
  await expect(page.locator('#check-prepublish')).toBeEnabled();

  await page.locator('#check-prepublish').click();
  await expect(page.locator('#prepublish-status')).toContainText('没有判断');
  await page.locator('input[name="check-source"][value="pass"]').check();
  await page.locator('input[name="check-privacy"][value="pass"]').check();
  await page.locator('input[name="check-authorization"][value="pass"]').check();
  await page.locator('input[name="check-permission"][value="pass"]').check();
  await page.locator('#check-prepublish').click();
  await expect(page.locator('#prepublish-status')).toContainText('请重新判断');
  await expect(page.locator('#withdrawal-panel')).toBeHidden();
  await expect(page.locator('#learning-steps li[data-done="true"]')).toHaveCount(1);

  await page.locator('input[name="check-source"][value="fail"]').check();
  await page.locator('input[name="check-privacy"][value="fail"]').check();
  await page.locator('input[name="check-authorization"][value="fail"]').check();
  await page.locator('#check-prepublish').click();
  await expect(page.locator('#withdrawal-panel')).toBeVisible();
  await expect(page.locator('#withdrawal-title')).toBeFocused();
  await expect(page.locator('#spread-state')).toContainText('网络请求数仍为 0');

  await page.locator('input[name="withdrawal"][value="recall-everywhere"]').check();
  await page.locator('#check-withdrawal').click();
  await expect(page.locator('#withdrawal-status')).toContainText('请重新判断');
  await page.locator('input[name="withdrawal"][value="retract-original-copies-persist"]').check();
  await page.locator('#check-withdrawal').click();
  await expect(page.locator('#learning-steps li[data-done="true"]')).toHaveCount(3);
  await expect(page.locator('#save-status')).toContainText('已保存');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey))
    .toEqual({'responsible-publishing': true});
  expect(remoteRequests).toEqual([]);

  await page.goto(siteRoot);
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total', '28');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('high');
  await page.getByRole('searchbox', {name: '关键词'}).fill('负责任发布与传播');
  await page.locator('#site-results a[href="computer/high/responsible-publishing.html"]').click();
  await expect(page).toHaveURL(/computer\/high\/responsible-publishing\.html/);
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
    .toEqual({'responsible-publishing': true});
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
  await complete(page, {platform: 'school-platform'});
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
  await page.locator('input[name="platform-choice"][value="school-platform"]').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('input[name="platform-choice"][value="school-platform"]')).toBeChecked();
  await page.locator('#check-platform').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#platform-status')).toContainText('正确');
  await expect(page.locator('#platform-grid')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
});

test('direct file and release subpath load without a publishing network service', async ({page}) => {
  test.skip(!!publishedBase, '公网专项不打开本机文件或临时发布服务器');
  const remoteRequests = [], errors = [];
  watchExternalRequests(page, remoteRequests);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(resolve(__dirname, '../../computer/high/responsible-publishing.html')).href);
  await expect(page.getByRole('heading', {name: '负责任发布与传播实验室'})).toBeVisible();
  await complete(page);
  expect(remoteRequests).toEqual([]);

  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('computer/high/responsible-publishing.html', release.base).href);
    expect(response.status()).toBe(200);
    await complete(page);
    await expect(page.locator('#spread-state')).toContainText('网络请求数仍为 0');
  } finally { await release.close(); }
  expect(remoteRequests).toEqual([]);
  expect(errors).toEqual([]);
});
