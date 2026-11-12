const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('computer/primary/sequential-search.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/computer/primary/sequential-search.html';
const progressKey = 'kv-computer-primary-progress';

async function compare(page, count) {
  for (let i = 0; i < count; i++) await page.locator('#step-button').click();
}

test('prediction is required; each comparison is visible and finding stops immediately', async ({page}) => {
  await page.goto(topic);
  await page.locator('#step-button').click();
  await expect(page.locator('#comparison-count')).toHaveText('0');
  await expect(page.locator('#run-status')).toContainText('请先预测');
  await page.locator('#prediction-select').selectOption('3');
  await compare(page, 1);
  await expect(page.locator('#comparison-count')).toHaveText('1');
  await expect(page.locator('.search-card[data-state="miss"]')).toHaveCount(1);
  await expect(page.locator('.search-card[aria-current="step"]')).toHaveAttribute('data-index', '2');
  await expect(page.locator('#prediction-select')).toBeDisabled();
  await expect(page.locator('#trace-list')).toContainText('4 ≠ 7');
  await compare(page, 2);
  await expect(page.locator('#comparison-count')).toHaveText('3');
  await expect(page.locator('.search-card[data-state="found"]')).toHaveAttribute('data-index', '3');
  await expect(page.locator('.search-card[data-state="waiting"]')).toHaveCount(2);
  await expect(page.locator('#step-button')).toBeDisabled();
  await expect(page.locator('#prediction-status')).toContainText('预测正确');
  await expect(page.locator('#challenge-progress')).toContainText('找到：已正确预测');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
});

test('found and absent rounds both need correct predictions before completion', async ({page}) => {
  await page.goto(topic);
  await page.locator('#prediction-select').selectOption('2');
  await compare(page, 3);
  await expect(page.locator('#prediction-status')).toContainText('未猜对');
  await expect(page.locator('#challenge-progress')).toContainText('找到：待完成');
  await page.locator('#reset-button').click();
  await expect(page.locator('#target-select')).toHaveValue('7');
  await page.locator('#prediction-select').selectOption('3');
  await compare(page, 3);
  await page.locator('#target-select').selectOption('9');
  await expect(page.locator('#comparison-count')).toHaveText('0');
  await page.locator('#prediction-select').selectOption('5');
  await compare(page, 4);
  await expect(page.locator('#run-status')).toContainText('继续查看第 5 张');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
  await compare(page, 1);
  await expect(page.locator('#comparison-count')).toHaveText('5');
  await expect(page.locator('#next-label')).toContainText('未找到');
  await expect(page.locator('#prediction-status')).toContainText('预测正确');
  await expect(page.locator('#challenge-progress')).toContainText('找到：已正确预测 · 未找到：已正确预测');
  await expect(page.locator('#progress-status')).toContainText('已保存');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'sequential-search': true});
  await page.locator('#reset-button').click();
  await expect(page.locator('#progress-status')).toContainText('本机已有');
  await expect(page.locator('#comparison-count')).toHaveText('0');
});

test('changing card order changes real comparison sequence', async ({page}) => {
  await page.goto(topic);
  await page.locator('#preset-select').selectOption('shifted');
  await expect(page.locator('.search-card strong')).toHaveText(['2', '7', '4', '5', '1']);
  await page.locator('#prediction-select').selectOption('2');
  await compare(page, 2);
  await expect(page.locator('#trace-list li')).toHaveCount(2);
  await expect(page.locator('#trace-list')).toContainText('2 ≠ 7');
  await expect(page.locator('#next-label')).toContainText('第 2 张找到');
  await page.locator('#example-button').click();
  await expect(page.locator('#preset-select')).toHaveValue('standard');
  await expect(page.locator('#target-select')).toHaveValue('7');
  await expect(page.locator('#comparison-count')).toHaveText('0');
});

test('continuous run can pause; changing target cancels the old timer', async ({page}) => {
  await page.goto(topic);
  await page.locator('#prediction-select').selectOption('3');
  await page.locator('#play-button').click();
  await expect(page.locator('#pause-button')).toBeEnabled();
  await expect.poll(async () => Number(await page.locator('#comparison-count').innerText())).toBeGreaterThanOrEqual(1);
  await page.locator('#pause-button').click();
  const stopped = await page.locator('#comparison-count').innerText();
  await page.waitForTimeout(800);
  await expect(page.locator('#comparison-count')).toHaveText(stopped);
  await page.locator('#play-button').click();
  await page.locator('#target-select').selectOption('9');
  await expect(page.locator('#comparison-count')).toHaveText('0');
  await expect(page.locator('#trace-list')).toContainText('还没有比较');
  await page.waitForTimeout(800);
  await expect(page.locator('#comparison-count')).toHaveText('0');
  await page.locator('#prediction-select').selectOption('5');
  await page.locator('#play-button').click();
  await expect(page.locator('#comparison-count')).toHaveText('5', {timeout: 10000});
  await expect(page.locator('#pause-button')).toBeDisabled();
  await expect(page.locator('#next-label')).toContainText('未找到');
});

test('a broken progress record remains intact and earned completion can be saved later', async ({page}) => {
  await page.addInitScript(key => localStorage.setItem(key, '{broken'), progressKey);
  await page.goto(topic);
  await page.locator('#prediction-select').selectOption('3');
  await compare(page, 3);
  await page.locator('#target-select').selectOption('9');
  await page.locator('#prediction-select').selectOption('5');
  await compare(page, 5);
  await expect(page.locator('#retry-save')).toBeVisible();
  await expect(page.locator('#progress-status')).toContainText('未能保存');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBe('{broken');
  await page.locator('#reset-button').click();
  await page.evaluate(key => localStorage.removeItem(key), progressKey);
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('此前赢得');
  await expect(page.locator('#progress-status')).toContainText('当前轮尚未完成');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'sequential-search': true});
});

test('write rejection does not claim completion and can be retried after reset', async ({page}) => {
  await page.addInitScript(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new Error('write rejected');
      return original.call(this, name, value);
    };
    window.restoreProgressWrites = () => { Storage.prototype.setItem = original; };
  }, progressKey);
  await page.goto(topic);
  await page.locator('#prediction-select').selectOption('3');
  await compare(page, 3);
  await page.locator('#target-select').selectOption('9');
  await page.locator('#prediction-select').selectOption('5');
  await compare(page, 5);
  await expect(page.locator('#progress-status')).toContainText('未能保存');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
  await page.locator('#reset-button').click();
  await page.evaluate(() => window.restoreProgressWrites());
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('此前赢得');
  await expect(page.locator('#progress-status')).toContainText('当前轮尚未完成');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'sequential-search': true});
});

test('home search, stage directory and actual progress include the new topic', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网发现由发布后浏览器专项核验');
  await page.goto('/');
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total', '8');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('primary');
  await page.getByRole('searchbox', {name: '关键词'}).fill('顺序查找');
  await page.locator('#site-results a[href="computer/primary/sequential-search.html"]').click();
  await page.locator('#prediction-select').selectOption('3');
  await compare(page, 3);
  await page.locator('#target-select').selectOption('9');
  await page.locator('#prediction-select').selectOption('5');
  await compare(page, 5);
  await page.locator('.footer-nav a[href="index.html"]').click();
  await expect(page.locator('#stage-progress')).toContainText('1/5');
  await expect(page.locator('[data-topic-slug="sequential-search"] [data-completion]')).toContainText('已完成');
  await page.goto('/');
  await expect(page.locator('[data-subject="computer"] .sp-label')).toContainText('已学 1/8');
});

test('320px keyboard and reduced motion still allow a readable manual search', async ({page}) => {
  await page.setViewportSize({width: 320, height: 720});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(topic);
  await page.locator('#prediction-select').focus();
  await page.keyboard.press('5');
  await expect(page.locator('#prediction-select')).toHaveValue('5');
  await page.locator('#target-select').focus();
  await page.keyboard.press('9');
  await expect(page.locator('#target-select')).toHaveValue('9');
  await page.locator('#prediction-select').focus();
  await page.keyboard.press('5');
  await page.locator('#step-button').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#comparison-count')).toHaveText('1');
  const data = await page.evaluate(() => ({width: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth, outline: getComputedStyle(document.querySelector('#step-button')).outlineStyle}));
  expect(data.width).toBeLessThanOrEqual(data.viewport);
  expect(data.outline).not.toBe('none');
  await compare(page, 4);
  await expect(page.locator('#next-label')).toContainText('未找到');
});

test('direct local file works with no remote runtime requests', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项只检查公开站点');
  const remote = [], errors = [];
  page.on('request', request => { if (/^https?:/.test(request.url())) remote.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(resolve(__dirname, '../../computer/primary/sequential-search.html')).href);
  await page.locator('#prediction-select').selectOption('3');
  await compare(page, 3);
  await expect(page.locator('#next-label')).toContainText('第 3 张找到');
  expect(remote).toEqual([]);
  expect(errors).toEqual([]);
});

test('built release works under the project subpath', async ({page}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop' || !!process.env.KV_PUBLISHED_BASE_URL, '发布包单次桌面检查');
  const release = await startReleaseServer(), failures = [];
  try {
    page.on('requestfailed', request => failures.push(request.url()));
    const response = await page.goto(new URL('computer/primary/sequential-search.html', release.base).href);
    expect(response.status()).toBe(200);
    await page.locator('#prediction-select').selectOption('3');
    await compare(page, 3);
    await expect(page.locator('#next-label')).toContainText('第 3 张找到');
    expect(failures).toEqual([]);
  } finally { await release.close(); }
});
