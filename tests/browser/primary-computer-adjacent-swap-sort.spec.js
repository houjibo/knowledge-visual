const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('computer/primary/adjacent-swap-sort.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/computer/primary/adjacent-swap-sort.html';
const progressKey = 'kv-computer-primary-progress';
async function compare(page, count) {
  for (let index = 0; index < count; index++) await page.locator('#step-button').click();
}

test('prediction is required and the default first pass compares four adjacent pairs', async ({page}) => {
  await page.goto(topic);
  await page.locator('#step-button').click();
  await expect(page.locator('#comparison-count')).toHaveText('0');
  await expect(page.locator('#run-status')).toContainText('请先预测');
  await page.locator('#prediction-select').selectOption('3');
  await compare(page, 1);
  await expect(page.locator('.sort-card strong')).toHaveText(['2', '4', '5', '1', '3']);
  await expect(page.locator('#swap-count')).toHaveText('1');
  await expect(page.locator('#prediction-select')).toBeDisabled();
  await expect(page.locator('#trace-list')).toContainText('4 > 2，交换');
  await compare(page, 1);
  await expect(page.locator('#trace-list')).toContainText('4 < 5，保持');
  await expect(page.locator('#prediction-status')).toContainText('第一轮尚未结束');
  await compare(page, 2);
  await expect(page.locator('.sort-card strong')).toHaveText(['2', '4', '1', '3', '5']);
  await expect(page.locator('#comparison-count')).toHaveText('4');
  await expect(page.locator('#swap-count')).toHaveText('3');
  await expect(page.locator('#settled-count')).toHaveText('1');
  await expect(page.locator('.sort-card[data-state="settled"]')).toHaveAttribute('data-index', '5');
  await expect(page.locator('#pass-label')).toHaveText('第 2 轮');
  await expect(page.locator('#pass-list')).toContainText('右侧的 5 已就位');
  await expect(page.locator('#prediction-status')).toContainText('预测正确');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
});

test('both a disorderly and an already sorted round are required for saved completion', async ({page}) => {
  await page.goto(topic);
  await page.locator('#prediction-select').selectOption('3');
  await compare(page, 10);
  await expect(page.locator('#run-status')).toContainText('第 4 轮没有交换');
  await expect(page.locator('#comparison-count')).toHaveText('10');
  await expect(page.locator('.sort-card strong')).toHaveText(['1', '2', '3', '4', '5']);
  await expect(page.locator('#challenge-progress')).toContainText('原本无序：已正确完成 · 原本有序：待完成');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
  await page.locator('#preset-select').selectOption('sorted');
  await page.locator('#prediction-select').selectOption('0');
  await compare(page, 4);
  await expect(page.locator('#run-status')).toContainText('没有交换');
  await expect(page.locator('#run-status')).toContainText('提前结束');
  await expect(page.locator('#comparison-count')).toHaveText('4');
  await expect(page.locator('#swap-count')).toHaveText('0');
  await expect(page.locator('#settled-count')).toHaveText('5');
  await expect(page.locator('#step-button')).toBeDisabled();
  await expect(page.locator('#challenge-progress')).toContainText('原本无序：已正确完成 · 原本有序：已正确完成');
  await expect(page.locator('#progress-status')).toContainText('已保存');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'adjacent-swap-sort': true});
  await page.locator('#reset-button').click();
  await expect(page.locator('#preset-select')).toHaveValue('sorted');
  await expect(page.locator('#progress-status')).toContainText('本机已有');
});

test('wrong first-pass prediction never qualifies a completed round', async ({page}) => {
  await page.goto(topic);
  await page.locator('#prediction-select').selectOption('2');
  await compare(page, 10);
  await expect(page.locator('#prediction-status')).toContainText('实际交换 3 次');
  await expect(page.locator('#prediction-status')).toContainText('未猜对');
  await expect(page.locator('#challenge-progress')).toContainText('原本无序：待完成');
  await page.locator('#preset-select').selectOption('sorted');
  await page.locator('#prediction-select').selectOption('0');
  await compare(page, 4);
  await expect(page.locator('#challenge-progress')).toContainText('原本无序：待完成 · 原本有序：已正确完成');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
});

test('reverse input needs all ten comparisons and four first-pass swaps', async ({page}) => {
  await page.goto(topic);
  await page.locator('#preset-select').selectOption('reversed');
  await page.locator('#prediction-select').selectOption('4');
  await compare(page, 10);
  await expect(page.locator('#comparison-count')).toHaveText('10');
  await expect(page.locator('#swap-count')).toHaveText('10');
  await expect(page.locator('#pass-list li')).toHaveCount(4);
  await expect(page.locator('#pass-list li').first()).toContainText('交换 4 次');
  await expect(page.locator('.sort-card strong')).toHaveText(['1', '2', '3', '4', '5']);
  await expect(page.locator('#step-button')).toBeDisabled();
});

test('continuous sort pauses and changing a preset cancels old timer', async ({page}) => {
  await page.goto(topic);
  await page.locator('#prediction-select').selectOption('3');
  await page.locator('#play-button').click();
  await expect(page.locator('#comparison-count')).toHaveText('1');
  await page.locator('#pause-button').click();
  await page.waitForTimeout(700);
  await expect(page.locator('#comparison-count')).toHaveText('1');
  await page.locator('#play-button').click();
  await page.locator('#preset-select').selectOption('sorted');
  await expect(page.locator('#comparison-count')).toHaveText('0');
  await expect(page.locator('#trace-list')).toContainText('还没有比较');
  await page.waitForTimeout(700);
  await expect(page.locator('#comparison-count')).toHaveText('0');
  await page.locator('#prediction-select').selectOption('0');
  await page.locator('#play-button').click();
  await expect(page.locator('#comparison-count')).toHaveText('4', {timeout: 10000});
  await expect(page.locator('#pause-button')).toBeDisabled();
  await expect(page.locator('#run-status')).toContainText('提前结束');
  await page.locator('#example-button').click();
  await expect(page.locator('#preset-select')).toHaveValue('mixed');
  await expect(page.locator('#comparison-count')).toHaveText('0');
});

test('broken progress stays intact and earned completion is retryable after reset', async ({page}) => {
  await page.addInitScript(key => localStorage.setItem(key, '{broken'), progressKey);
  await page.goto(topic);
  await page.locator('#prediction-select').selectOption('3');
  await compare(page, 10);
  await page.locator('#preset-select').selectOption('sorted');
  await page.locator('#prediction-select').selectOption('0');
  await compare(page, 4);
  await expect(page.locator('#retry-save')).toBeVisible();
  await expect(page.locator('#progress-status')).toContainText('未能保存');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBe('{broken');
  await page.locator('#reset-button').click();
  await page.evaluate(key => localStorage.removeItem(key), progressKey);
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('此前赢得');
  await expect(page.locator('#progress-status')).toContainText('当前轮尚未完成');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'adjacent-swap-sort': true});
});

test('write rejection does not claim saving and can recover later', async ({page}) => {
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
  await compare(page, 10);
  await page.locator('#preset-select').selectOption('sorted');
  await page.locator('#prediction-select').selectOption('0');
  await compare(page, 4);
  await expect(page.locator('#progress-status')).toContainText('未能保存');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
  await page.locator('#reset-button').click();
  await page.evaluate(() => window.restoreProgressWrites());
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('此前赢得');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'adjacent-swap-sort': true});
});

test('home search and stage progress include the sorting topic', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网发现由发布后浏览器验收');
  await page.goto('/');
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total', '12');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('primary');
  await page.getByRole('searchbox', {name: '关键词'}).fill('相邻交换');
  await page.locator('#site-results a[href="computer/primary/adjacent-swap-sort.html"]').click();
  await page.locator('#prediction-select').selectOption('3');
  await compare(page, 10);
  await page.locator('#preset-select').selectOption('sorted');
  await page.locator('#prediction-select').selectOption('0');
  await compare(page, 4);
  await page.locator('.footer-nav a[href="index.html"]').click();
  await expect(page.locator('#stage-progress')).toContainText('1/5');
  await expect(page.locator('[data-topic-slug="adjacent-swap-sort"] [data-completion]')).toContainText('已完成');
  await page.goto('/');
  await expect(page.locator('[data-subject="computer"] .sp-label')).toContainText('已学 1/12');
});

test('320px keyboard and reduced motion preserve manual comparison', async ({page}) => {
  await page.setViewportSize({width: 320, height: 720});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(topic);
  await page.locator('#prediction-select').focus();
  await page.keyboard.press('3');
  await expect(page.locator('#prediction-select')).toHaveValue('3');
  await page.locator('#step-button').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#comparison-count')).toHaveText('1');
  const dimensions = await page.evaluate(() => ({width: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
    outline: getComputedStyle(document.querySelector('#step-button')).outlineStyle}));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.outline).not.toBe('none');
  await compare(page, 3);
  await expect(page.locator('#prediction-status')).toContainText('预测正确');
});

test('direct file works offline with no runtime network requests', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项不检查本地文件');
  const remote = [], errors = [];
  page.on('request', request => { if (/^https?:/.test(request.url())) remote.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(resolve(__dirname, '../../computer/primary/adjacent-swap-sort.html')).href);
  await page.locator('#prediction-select').selectOption('3');
  await compare(page, 4);
  await expect(page.locator('#pass-list')).toContainText('右侧的 5 已就位');
  expect(remote).toEqual([]);
  expect(errors).toEqual([]);
});

test('built release sorts under the project subpath', async ({page}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop' || !!process.env.KV_PUBLISHED_BASE_URL, '发布包单次桌面检查');
  const release = await startReleaseServer(), failures = [];
  try {
    page.on('requestfailed', request => failures.push(request.url()));
    const response = await page.goto(new URL('computer/primary/adjacent-swap-sort.html', release.base).href);
    expect(response.status()).toBe(200);
    await page.locator('#prediction-select').selectOption('3');
    await compare(page, 4);
    await expect(page.locator('#prediction-status')).toContainText('预测正确');
    expect(failures).toEqual([]);
  } finally { await release.close(); }
});
