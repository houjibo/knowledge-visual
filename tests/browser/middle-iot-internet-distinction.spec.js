const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const publishedBase = process.env.KV_PUBLISHED_BASE_URL?.replace(/\/?$/, '/') || '';
const siteRoot = publishedBase || '/';
const topic = publishedBase
  ? new URL('computer/middle/iot-internet-distinction.html', publishedBase).href
  : '/computer/middle/iot-internet-distinction.html';
const progressKey = 'kv-computer-middle-progress';

function watchExternalRequests(page, requests) {
  page.on('request', request => {
    if (!/^https?:/.test(request.url())) return;
    const host = new URL(request.url()).hostname;
    if (host !== '127.0.0.1' && host !== 'localhost' && host !== '::1') requests.push(request.url());
  });
}

async function complete(page) {
  for (const value of ['instant-message:internet', 'video-streaming:internet',
    'temp-sensor:iot', 'watch-heart-rate:iot', 'remote-ac:iot', 'remote-streetlight:iot']) {
    const [id, answer] = value.split(':');
    await page.locator(`input[name="case-${id}"][value="${answer}"]`).check();
  }
  await page.locator('#check-classify').click();
  await page.locator('input[name="element-sensor"][value="temp-humidity-sensor"]').check();
  await page.locator('input[name="element-network"][value="home-network"]').check();
  await page.locator('input[name="element-actuator"][value="air-conditioner"]').check();
  await page.locator('#check-elements').click();
  await page.locator('input[name="impact-benefit"][value="remote-convenience"]').check();
  await page.locator('input[name="impact-risk"][value="habit-privacy"]').check();
  await page.locator('#check-impact').click();
}

test('classifies connections, identifies three elements and judges two-sided impact', async ({page}) => {
  const errors = [], remoteRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  watchExternalRequests(page, remoteRequests);
  await page.goto(topic);
  await expect(page).toHaveTitle(/物联网与互联网辨析实验室/);
  await expect(page.locator('#case-list .case-card')).toHaveCount(6);
  await expect(page.locator('#element-panel')).toBeHidden();
  await expect(page.locator('#impact-panel')).toBeHidden();

  await page.locator('#check-classify').click();
  await expect(page.locator('#classify-status')).toContainText('没有判断');

  await page.locator('input[name="case-temp-sensor"][value="internet"]').check();
  for (const value of ['instant-message:internet', 'video-streaming:internet',
    'watch-heart-rate:iot', 'remote-ac:iot', 'remote-streetlight:iot']) {
    const [id, answer] = value.split(':');
    await page.locator(`input[name="case-${id}"][value="${answer}"]`).check();
  }
  await page.locator('#check-classify').click();
  await expect(page.locator('#classify-status')).toContainText('请重新判断');
  await expect(page.locator('#element-panel')).toBeHidden();
  await expect(page.locator('#learning-steps li[data-done="true"]')).toHaveCount(0);

  await page.locator('input[name="case-temp-sensor"][value="iot"]').check();
  await page.locator('#check-classify').click();
  await expect(page.locator('#element-panel')).toBeVisible();
  await expect(page.locator('#element-title')).toBeFocused();

  await page.locator('#check-elements').click();
  await expect(page.locator('#element-status')).toContainText('各选一项');

  await page.locator('input[name="element-sensor"][value="temp-humidity-sensor"]').check();
  await page.locator('input[name="element-network"][value="home-network"]').check();
  await page.locator('input[name="element-actuator"][value="phone-app"]').check();
  await page.locator('#check-elements').click();
  await expect(page.locator('#element-status')).toContainText('请重新选择');
  await expect(page.locator('#impact-panel')).toBeHidden();

  await page.locator('input[name="element-actuator"][value="air-conditioner"]').check();
  await page.locator('#check-elements').click();
  await expect(page.locator('#impact-panel')).toBeVisible();
  await expect(page.locator('#impact-title')).toBeFocused();

  await page.locator('input[name="impact-benefit"][value="remote-convenience"]').check();
  await page.locator('input[name="impact-risk"][value="no-risk"]').check();
  await page.locator('#check-impact').click();
  await expect(page.locator('#impact-status')).toContainText('请重新判断');

  await page.locator('input[name="impact-risk"][value="habit-privacy"]').check();
  await page.locator('#check-impact').click();
  await expect(page.locator('#learning-steps li[data-done="true"]')).toHaveCount(3);
  await expect(page.locator('#save-status')).toContainText('已保存');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey))
    .toEqual({'iot-internet-distinction': true});
  expect(remoteRequests).toEqual([]);

  await page.goto(siteRoot);
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total', '29');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('middle');
  await page.getByRole('searchbox', {name: '关键词'}).fill('物联网与互联网辨析');
  await page.locator('#site-results a[href="computer/middle/iot-internet-distinction.html"]').click();
  await expect(page).toHaveURL(/computer\/middle\/iot-internet-distinction\.html/);
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
    .toEqual({'iot-internet-distinction': true});
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
  await page.locator('input[name="case-remote-ac"][value="iot"]').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('input[name="case-remote-ac"][value="iot"]')).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
});

test('direct file and release subpath load without a network service', async ({page}) => {
  test.skip(!!publishedBase, '公网专项不打开本机文件或临时发布服务器');
  const remoteRequests = [], errors = [];
  watchExternalRequests(page, remoteRequests);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(resolve(__dirname, '../../computer/middle/iot-internet-distinction.html')).href);
  await expect(page.getByRole('heading', {name: '物联网与互联网辨析实验室'})).toBeVisible();
  await complete(page);
  expect(remoteRequests).toEqual([]);

  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('computer/middle/iot-internet-distinction.html', release.base).href);
    expect(response.status()).toBe(200);
    await complete(page);
    await expect(page.locator('#snapshot-state')).toContainText('网络请求数=0');
  } finally { await release.close(); }
  expect(remoteRequests).toEqual([]);
  expect(errors).toEqual([]);
});
