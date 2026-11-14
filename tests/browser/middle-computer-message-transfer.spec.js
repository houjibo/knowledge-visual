const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('computer/middle/message-transfer.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/computer/middle/message-transfer.html';
const progressKey = 'kv-computer-middle-progress';

async function begin(page, message, mode, prediction) {
  await page.locator('#message').selectOption(message);
  await page.locator('#mode').selectOption(mode);
  await page.locator('#prediction').selectOption(prediction);
  await page.locator('#reveal-button').click();
}

async function deliver(page, count) {
  for (let i = 0; i < count; i++) await page.locator('#step-button').click();
}

async function finish(page) {
  await begin(page, 'ascii', 'ordered', 'yes');
  await deliver(page, 2);
  await begin(page, 'chinese', 'reversed', 'yes');
  await deliver(page, 3);
  await begin(page, 'chinese', 'missing', 'no');
  await deliver(page, 2);
  await page.locator('#retry-button').click();
}

test('UTF-8 bytes, out of order delivery and receiver text use one state', async ({page}) => {
  await page.goto(topic);
  await expect(page.locator('#sender-bytes')).toHaveText('41 49 21');
  await begin(page, 'chinese', 'reversed', 'yes');
  await expect(page.locator('#sender-bytes')).toHaveText('E4 BD A0 E5 A5 BD');
  await expect(page.locator('#receiver-text')).toHaveText('等待完整字节');
  await deliver(page, 1);
  await expect(page.locator('#arrival-list li strong')).toHaveText(['第 3 块']);
  await expect(page.locator('#receiver-slots li.missing strong')).toHaveText(['第 1 块', '第 2 块']);
  await deliver(page, 2);
  await expect(page.locator('#arrival-list li strong')).toHaveText(['第 3 块', '第 2 块', '第 1 块']);
  await expect(page.locator('#receiver-text')).toHaveText('你好');
  await expect(page.locator('#challenge-reversed')).toContainText('本轮已完成');
});

test('missing block prevents rendering until explicit retry', async ({page}) => {
  await page.goto(topic);
  await begin(page, 'chinese', 'missing', 'no');
  await deliver(page, 2);
  await expect(page.locator('#receiver-text')).toHaveText('等待完整字节');
  await expect(page.locator('#receiver-slots li.missing strong')).toHaveText(['第 2 块']);
  await expect(page.locator('#step-status')).toContainText('不能呈现完整文字');
  await expect(page.locator('#challenge-missing')).toContainText('待完成');
  await page.locator('#retry-button').click();
  await expect(page.locator('#arrival-list li strong')).toHaveText(['第 1 块', '第 3 块', '第 2 块']);
  await expect(page.locator('#receiver-text')).toHaveText('你好');
  await expect(page.locator('#challenge-missing')).toContainText('本轮已完成');
});

test('wrong prediction and unobserved blocks never grant completion', async ({page}) => {
  await page.goto(topic);
  await page.locator('#reveal-button').click();
  await expect(page.locator('#prediction-status')).toContainText('请先选择');
  await begin(page, 'ascii', 'ordered', 'no');
  await deliver(page, 2);
  await expect(page.locator('#challenge-ordered')).toContainText('待完成');
  await page.locator('#reset-button').click();
  await begin(page, 'ascii', 'ordered', 'yes');
  await deliver(page, 1);
  await expect(page.locator('#challenge-ordered')).toContainText('待完成');
  await deliver(page, 1);
  await expect(page.locator('#challenge-ordered')).toContainText('本轮已完成');
});

test('all conditions save only after successful work, including retry after storage denial', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网测试不改写存储实现');
  await page.addInitScript(k => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === k) throw new Error('denied');
      return original.call(this, key, value);
    };
    window.restoreProgressWrites = () => { Storage.prototype.setItem = original; };
  }, progressKey);
  await page.goto(topic);
  await finish(page);
  await expect(page.locator('#progress-status')).toContainText('未能保存');
  expect(await page.evaluate(k => localStorage.getItem(k), progressKey)).toBeNull();
  await page.evaluate(() => window.restoreProgressWrites());
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('本机已记录完成');
  expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)), progressKey)).toEqual({'message-transfer': true});
  await page.reload();
  await expect(page.locator('#challenge-ordered')).toContainText('待完成');
  await expect(page.locator('#progress-status')).toContainText('本机已记录完成');
});

test('home search, middle directory and home progress include the new topic', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网发现由发布后验收');
  await page.goto('/');
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total', '14');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('middle');
  await page.getByRole('searchbox', {name: '关键词'}).fill('消息传输');
  await page.locator('#site-results a[href="computer/middle/message-transfer.html"]').click();
  await finish(page);
  await page.locator('.footer-nav a[href="index.html"]').click();
  await expect(page.locator('#stage-progress')).toContainText('1/7');
  await expect(page.locator('[data-topic-slug="message-transfer"] [data-completion]')).toContainText('已完成');
  await page.goto('/');
  await expect(page.locator('[data-subject="computer"] .sp-label')).toContainText('已学 1/14');
});

test('controls stay disabled until the lesson controller is ready', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项不延迟脚本');
  await page.route('**/computer/middle/assets/message-transfer.js', async route => {
    await new Promise(resolve => setTimeout(resolve, 700));
    await route.continue();
  });
  await page.goto(topic, {waitUntil: 'commit'});
  for (const id of ['message', 'mode', 'prediction', 'reveal-button', 'reset-button', 'step-button', 'retry-button']) {
    await expect(page.locator(`#${id}`)).toBeDisabled();
  }
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('#message')).toBeEnabled();
  await expect(page.locator('#step-button')).toBeDisabled();
});

test('320px keyboard, file opening and release subpath run the same lesson', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(topic);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.locator('#prediction').selectOption('yes');
  await page.locator('#reveal-button').focus();
  await page.keyboard.press('Enter');
  await page.locator('#step-button').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(page.locator('#receiver-text')).toHaveText('AI!');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

  if (process.env.KV_PUBLISHED_BASE_URL) return;
  await page.goto(pathToFileURL(resolve(__dirname, '../../computer/middle/message-transfer.html')).href);
  await begin(page, 'chinese', 'reversed', 'yes');
  await deliver(page, 3);
  await expect(page.locator('#receiver-text')).toHaveText('你好');
  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('computer/middle/message-transfer.html', release.base).href);
    expect(response.status()).toBe(200);
    await finish(page);
    await expect(page.locator('#progress-status')).toContainText('本机已记录完成');
  } finally { await release.close(); }
});
