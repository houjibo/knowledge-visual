const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('computer/middle/online-collaboration.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/computer/middle/online-collaboration.html';
const progressKey = 'kv-computer-middle-progress';

async function step(page, b, c, target) {
  if (target) await page.locator('#manual-target').selectOption(target);
  await page.locator('#predict-b').selectOption(String(b));
  await page.locator('#predict-c').selectOption(String(c));
  await page.locator('#step-button').click();
}

async function completeOffline(page) {
  await page.locator('#scenario').selectOption('offline');
  await page.locator('#edit-button').click();
  await step(page, 2, 1, 'b');
  await step(page, 2, 2, 'c');
}

async function completeOnline(page) {
  await page.locator('#scenario').selectOption('online');
  await page.locator('#edit-button').click();
  await step(page, 2, 2);
}

async function completeDisconnected(page) {
  await page.locator('#scenario').selectOption('disconnected');
  await page.locator('#edit-button').click();
  await step(page, 2, 1);
  await page.locator('#reconnect-button').click();
  await step(page, 2, 2);
}

async function completeAll(page) {
  await completeOffline(page);
  await completeOnline(page);
  await completeDisconnected(page);
  await page.getByRole('radio', {name: /共享让已连接的人取得同一更新/}).check();
  await page.locator('#check-conclusion').click();
}

test('independent copies need two directed deliveries; connected peers sync in one step', async ({page}) => {
  await page.goto(topic);
  await expect(page.locator('#card-service .version')).toHaveText('不使用');
  await page.locator('#edit-button').click();
  await expect(page.locator('#card-a .version')).toHaveText('版本 2');
  await expect(page.locator('#card-b .version')).toHaveText('版本 1');
  await page.locator('#step-button').click();
  await expect(page.locator('#step-feedback')).toContainText('先分别预测');
  await step(page, 2, 1, 'b');
  await expect(page.locator('#card-b .version')).toHaveText('版本 2');
  await expect(page.locator('#card-c .version')).toHaveText('版本 1');
  await expect(page.locator('#challenge-offline')).toContainText('待完成');
  await step(page, 2, 2, 'c');
  await expect(page.locator('#challenge-offline')).toContainText('本轮已完成');
  await expect(page.locator('#history li')).toHaveCount(4);
  await completeOnline(page);
  await expect(page.locator('#card-service .version')).toHaveText('版本 2');
  await expect(page.locator('#history li')).toHaveCount(3);
  await expect(page.locator('#challenge-online')).toContainText('本轮已完成');
  await expect(page.locator('#check-conclusion')).toBeDisabled();
});

test('reconnection does not change the old copy; a later sync does', async ({page}) => {
  await page.goto(topic);
  await page.locator('#scenario').selectOption('disconnected');
  await page.locator('#edit-button').click();
  await step(page, 2, 1);
  await expect(page.locator('#card-b .version')).toHaveText('版本 2');
  await expect(page.locator('#card-c .version')).toHaveText('版本 1');
  await expect(page.locator('#card-c .connection')).toHaveText('暂时断线');
  await expect(page.locator('#step-button')).toBeDisabled();
  await page.locator('#reconnect-button').click();
  await expect(page.locator('#card-c .version')).toHaveText('版本 1');
  await expect(page.locator('#card-c .connection')).toHaveText('已连接');
  await step(page, 2, 2);
  await expect(page.locator('#card-c .version')).toHaveText('版本 2');
  await expect(page.locator('#challenge-disconnected')).toContainText('本轮已完成');
  await expect(page.locator('#history li')).toHaveCount(5);
});

test('wrong prediction needs a fresh correct run; wrong conclusion cannot save', async ({page}) => {
  await page.goto(topic);
  await page.locator('#edit-button').click();
  await step(page, 2, 2, 'b');
  await expect(page.locator('#step-feedback')).toContainText('C 应为版本 1');
  await step(page, 2, 2, 'c');
  await expect(page.locator('#challenge-offline')).toContainText('待完成');
  await page.locator('#reset-button').click();
  await completeOffline(page);
  await completeOnline(page);
  await completeDisconnected(page);
  await page.getByRole('radio', {name: /一旦联网/}).check();
  await page.locator('#check-conclusion').click();
  await expect(page.locator('#conclusion-feedback')).toContainText('不保证');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
  await page.getByRole('radio', {name: /共享让已连接的人取得同一更新/}).check();
  await page.locator('#check-conclusion').click();
  await expect(page.locator('#progress-status')).toContainText('本机已记录完成');
  await page.reload();
  await expect(page.locator('#challenge-offline')).toContainText('待完成');
  await expect(page.locator('#progress-status')).toContainText('本机此前已记录完成');
});

test('denied progress storage shows failure and retry without losing current work', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网测试不改写存储实现');
  await page.addInitScript(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new Error('denied');
      return original.call(this, name, value);
    };
    window.restoreProgressWrites = () => { Storage.prototype.setItem = original; };
  }, progressKey);
  await page.goto(topic);
  await completeAll(page);
  await expect(page.locator('#progress-status')).toContainText('未能保存');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
  await page.evaluate(() => window.restoreProgressWrites());
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('本机已记录完成');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'online-collaboration': true});
});

test('home search, counts and stage directory expose the new topic', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网发现由发布后验收');
  await page.goto('/');
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total', '13');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('middle');
  await page.getByRole('searchbox', {name: '关键词'}).fill('资料共享与同步');
  await page.locator('#site-results a[href="computer/middle/online-collaboration.html"]').click();
  await completeAll(page);
  await page.locator('.footer-nav a[href="index.html"]').click();
  await expect(page.locator('#stage-progress')).toContainText('1/6');
  await expect(page.locator('[data-topic-slug="online-collaboration"] [data-completion]')).toContainText('已完成');
  await page.goto('/');
  await expect(page.locator('[data-subject="computer"] .sp-label')).toContainText('已学 1/13');
});

test('controls stay disabled until the lesson script loads', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项不延迟脚本');
  await page.route('**/computer/middle/assets/online-collaboration.js', async route => {
    await new Promise(resolve => setTimeout(resolve, 700));
    await route.continue();
  });
  await page.goto(topic, {waitUntil: 'commit'});
  for (const id of ['scenario', 'manual-target', 'edit-button', 'predict-b', 'predict-c', 'step-button', 'check-conclusion']) {
    await expect(page.locator(`#${id}`)).toBeDisabled();
  }
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('#scenario')).toBeEnabled();
  await expect(page.locator('#edit-button')).toBeEnabled();
});

test('320px keyboard, file opening and release subpath preserve the activity', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(topic);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.locator('#edit-button').focus();
  await page.keyboard.press('Enter');
  await page.locator('#manual-target').selectOption('b');
  await page.locator('#predict-b').selectOption('2');
  await page.locator('#predict-c').selectOption('1');
  await page.locator('#step-button').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#card-b .version')).toHaveText('版本 2');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  if (process.env.KV_PUBLISHED_BASE_URL) return;

  await page.goto(pathToFileURL(resolve(__dirname, '../../computer/middle/online-collaboration.html')).href);
  await completeDisconnected(page);
  await expect(page.locator('#challenge-disconnected')).toContainText('本轮已完成');
  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('computer/middle/online-collaboration.html', release.base).href);
    expect(response.status()).toBe(200);
    await completeAll(page);
    await expect(page.locator('#progress-status')).toContainText('本机已记录完成');
  } finally { await release.close(); }
});
