const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('computer/uni/stack-queue.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/computer/uni/stack-queue.html';
const key = 'kv-computer-uni-progress';

async function add(page, n = 1) {
  for (let i = 0; i < n; i++) await page.locator('#add-button').click();
}
async function remove(page, stack, queue) {
  await page.locator('#stack-prediction').selectOption(stack);
  await page.locator('#queue-prediction').selectOption(queue);
  await page.locator('#remove-button').click();
}
async function finish(page) {
  await add(page, 3);
  await remove(page, 'C', 'A');
  await add(page);
  await remove(page, 'D', 'B');
}

test('same arrivals show opposite removal ends and two correct rounds save completion', async ({page}) => {
  await page.goto(topic);
  await expect(page.locator('#remove-button')).toBeDisabled();
  await add(page, 3);
  await expect(page.locator('#stack-summary')).toContainText('A → B → C；栈顶 C');
  await expect(page.locator('#queue-summary')).toContainText('A → B → C；队首 A');
  await page.locator('#remove-button').click();
  await expect(page.locator('#action-status')).toContainText('请先分别预测');
  await expect(page.locator('#stack-list .data-item')).toHaveCount(3);
  await remove(page, 'C', 'A');
  await expect(page.locator('#action-status')).toContainText('栈取出 C');
  await expect(page.locator('#action-status')).toContainText('队列取出 A');
  await expect(page.locator('#stack-summary')).toContainText('A → B；栈顶 B');
  await expect(page.locator('#queue-summary')).toContainText('B → C；队首 B');
  await expect(page.locator('#challenge-first')).toContainText('已完成');
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBeNull();
  await add(page);
  await expect(page.locator('#challenge-add')).toContainText('已完成');
  await remove(page, 'D', 'B');
  await expect(page.locator('#challenge-second')).toContainText('已完成');
  await expect(page.locator('#progress-status')).toContainText('本机已记录完成');
  expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)), key)).toEqual({'stack-queue': true});
  await page.locator('#reset-button').click();
  await expect(page.locator('#stack-list .empty-item')).toBeVisible();
  await expect(page.locator('#progress-status')).toContainText('本机已记录完成');
});

test('wrong prediction and an early one-item removal do not qualify', async ({page}) => {
  await page.goto(topic);
  await add(page);
  await remove(page, 'A', 'A');
  await expect(page.locator('#challenge-first')).toContainText('待完成');
  await add(page, 3);
  await remove(page, 'A', 'B');
  await expect(page.locator('#action-status')).toContainText('预测未全对');
  await expect(page.locator('#challenge-first')).toContainText('待完成');
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBeNull();
  await page.locator('#reset-button').click();
  await finish(page);
  await expect(page.locator('#progress-status')).toContainText('本机已记录完成');
});

test('two correct removals without a new arrival do not finish the challenge', async ({page}) => {
  await page.goto(topic);
  await add(page, 4);
  await remove(page, 'D', 'A');
  await remove(page, 'C', 'B');
  await expect(page.locator('#challenge-add')).toContainText('待完成');
  await expect(page.locator('#challenge-second')).toContainText('待完成');
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBeNull();
});

test('six-item boundary and reset keep the finite model honest', async ({page}) => {
  await page.goto(topic);
  await add(page, 6);
  await expect(page.locator('#add-button')).toBeDisabled();
  await expect(page.locator('#item-count')).toContainText('6/6 件');
  await remove(page, 'F', 'A');
  await expect(page.locator('#stack-summary')).toContainText('栈顶 E');
  await expect(page.locator('#queue-summary')).toContainText('队首 B');
  await page.locator('#reset-button').click();
  await expect(page.locator('#add-button')).toHaveText('同时加入 A');
  await expect(page.locator('#history li')).toHaveCount(0);
});

test('visible controls wait until the local controller has attached', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项不延迟脚本');
  await page.route('**/computer/uni/assets/stack-queue.js', async route => {
    await new Promise(resolve => setTimeout(resolve, 900));
    await route.continue();
  });
  await page.goto(topic, {waitUntil: 'commit'});
  await expect(page.locator('#add-button')).toBeDisabled();
  await expect(page.locator('#reset-button')).toBeDisabled();
  await expect(page.locator('#stack-prediction')).toBeDisabled();
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('#add-button')).toBeEnabled();
  await expect(page.locator('#reset-button')).toBeEnabled();
  await expect(page.locator('#stack-prediction')).toBeEnabled();
  await add(page, 3);
  await expect(page.locator('#stack-summary')).toContainText('A → B → C；栈顶 C');
});

test('storage failure preserves earned completion and retry succeeds', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '不修改公网存储原型');
  await page.addInitScript(k => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === k) throw new Error('denied');
      return original.call(this, key, value);
    };
    window.restoreProgressWrites = () => { Storage.prototype.setItem = original; };
  }, key);
  await page.goto(topic);
  await finish(page);
  await expect(page.locator('#progress-status')).toContainText('未能保存');
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBeNull();
  await page.evaluate(() => window.restoreProgressWrites());
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('本机已记录完成');
});

test('corrupt university record is neither overwritten nor reported as saved', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '不修改公网存储记录');
  await page.addInitScript(k => localStorage.setItem(k, '{broken'), key);
  await page.goto(topic);
  await finish(page);
  await expect(page.locator('#progress-status')).toContainText('未能保存');
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBe('{broken');
  await page.locator('#reset-button').click();
  await expect(page.locator('#progress-status')).toContainText('暂不可用');
});

test('home search, university directory and progress count include the topic', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网发现由发布后验收');
  await page.goto('/');
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total', '8');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('uni');
  await page.getByRole('searchbox', {name: '关键词'}).fill('栈与队列');
  await page.locator('#site-results a[href="computer/uni/stack-queue.html"]').click();
  await finish(page);
  await page.locator('.footer-nav a[href="index.html"]').click();
  await expect(page.locator('#stage-progress')).toContainText('1/1');
  await expect(page.locator('[data-completion]')).toContainText('已完成');
  await page.goto('/');
  await expect(page.locator('[data-subject="computer"] .sp-label')).toContainText('已学 1/8');
});

test('keyboard at 320px and reduced motion can complete the comparison', async ({page}) => {
  await page.setViewportSize({width: 320, height: 720});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(topic);
  await page.locator('#add-button').focus();
  await page.keyboard.press('Enter');
  await add(page, 2);
  await page.locator('#stack-prediction').selectOption('C');
  await page.locator('#queue-prediction').selectOption('A');
  await page.locator('#remove-button').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#challenge-first')).toContainText('已完成');
  const metrics = await page.evaluate(() => ({width: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
    outline: getComputedStyle(document.getElementById('remove-button')).outlineStyle}));
  expect(metrics.width).toBeLessThanOrEqual(metrics.viewport);
  expect(metrics.outline).not.toBe('none');
});

test('direct file works offline without runtime requests', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项不检查本地文件');
  const remote = [], errors = [];
  page.on('request', request => { if (/^https?:/.test(request.url())) remote.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(resolve(__dirname, '../../computer/uni/stack-queue.html')).href);
  await finish(page);
  await expect(page.locator('#history li')).toHaveCount(2);
  expect(remote).toEqual([]);
  expect(errors).toEqual([]);
});

test('built release works under the repository subpath', async ({page}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop' || !!process.env.KV_PUBLISHED_BASE_URL, '发布包单次桌面检查');
  const release = await startReleaseServer(), failures = [];
  try {
    page.on('requestfailed', request => failures.push(request.url()));
    const response = await page.goto(new URL('computer/uni/stack-queue.html', release.base).href);
    expect(response.status()).toBe(200);
    await finish(page);
    await expect(page.locator('#progress-status')).toContainText('本机已记录完成');
    expect(failures).toEqual([]);
  } finally { await release.close(); }
});
