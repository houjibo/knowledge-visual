const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('computer/high/search-strategies.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/computer/high/search-strategies.html';
const progressKey = 'kv-computer-high-progress';
async function compare(page, count) {
  for (let index = 0; index < count; index++) await page.locator('#step-button').click();
}
async function round(page, {size = '15', scenario, prediction, steps}) {
  await page.locator('#size-select').selectOption(size);
  await page.locator('#target-select').selectOption(scenario);
  await page.locator('#prediction-select').selectOption(prediction);
  await compare(page, steps);
}
async function earnFour(page) {
  await round(page, {scenario: 'near', prediction: 'binary', steps: 14});
  await round(page, {scenario: 'front', prediction: 'linear', steps: 4});
  await round(page, {size: '7', scenario: 'missing', prediction: 'binary', steps: 7});
  await round(page, {size: '15', scenario: 'missing', prediction: 'binary', steps: 15});
}

test('prediction is required and the first binary comparison excludes the lower half', async ({page}) => {
  await page.goto(topic);
  await page.locator('#step-button').click();
  await expect(page.locator('#run-status')).toContainText('请先预测');
  await expect(page.locator('#linear-count')).toHaveText('0');
  await page.locator('#prediction-select').selectOption('binary');
  await compare(page, 1);
  await expect(page.locator('#linear-count')).toHaveText('1');
  await expect(page.locator('#binary-count')).toHaveText('1');
  await expect(page.locator('#linear-trace')).toContainText('第 1 项 1');
  await expect(page.locator('#binary-trace')).toContainText('中间第 8 项 8');
  await expect(page.locator('#binary-trace')).toContainText('排除第 1–8 项');
  await expect(page.locator('#binary-next')).toContainText('候选：第 9–15 项');
  await expect(page.locator('#binary-cards .data-card[data-state="excluded"]')).toHaveCount(8);
  await expect(page.locator('#prediction-status')).toContainText('暂不揭晓');
  await expect(page.locator('#prediction-select')).toBeDisabled();
});

test('near-end and first-position targets reverse which strategy compares less', async ({page}) => {
  await page.goto(topic);
  await page.locator('#prediction-select').selectOption('binary');
  await compare(page, 14);
  await expect(page.locator('#linear-count')).toHaveText('14');
  await expect(page.locator('#binary-count')).toHaveText('3');
  await expect(page.locator('#linear-next')).toContainText('第 14 项找到');
  await expect(page.locator('#binary-next')).toContainText('第 14 项找到');
  await expect(page.locator('#prediction-status')).toContainText('预测正确');
  await expect(page.locator('#challenge-list')).toContainText('✓ 已完成 · 15 项：靠后');
  await page.locator('#target-select').selectOption('front');
  await page.locator('#prediction-select').selectOption('linear');
  await compare(page, 4);
  await expect(page.locator('#linear-count')).toHaveText('1');
  await expect(page.locator('#binary-count')).toHaveText('4');
  await expect(page.locator('#prediction-status')).toContainText('预测正确');
  await expect(page.locator('#challenge-list')).toContainText('✓ 已完成 · 15 项：首位');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
});

test('four sorted rounds and the unsorted prerequisite are required for saved completion', async ({page}) => {
  await page.goto(topic);
  await earnFour(page);
  await expect(page.locator('#scale-summary')).toContainText('7 项时顺序 7 次、二分 3 次');
  await expect(page.locator('#scale-summary')).toContainText('15 项时顺序 15 次、二分 4 次');
  await expect(page.locator('#challenge-list')).toContainText('○ 待完成 · 乱序');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
  await page.locator('#order-select').selectOption('shuffled');
  await expect(page.locator('#binary-count')).toHaveText('—');
  await expect(page.locator('#binary-next')).toContainText('不能直接使用');
  await page.locator('#prerequisite-select').selectOption('sorted');
  await page.locator('#check-prerequisite').click();
  await expect(page.locator('#challenge-list li')).toHaveCount(5);
  await expect(page.locator('#challenge-list')).toContainText('✓ 已完成 · 乱序');
  await expect(page.locator('#progress-status')).toContainText('已保存');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'search-strategies': true});
  await page.locator('#reset-button').click();
  await expect(page.locator('#progress-status')).toContainText('本机已有');
});

test('wrong predictions never qualify a completed round', async ({page}) => {
  await page.goto(topic);
  await page.locator('#prediction-select').selectOption('linear');
  await compare(page, 14);
  await expect(page.locator('#prediction-status')).toContainText('这次未猜对');
  await expect(page.locator('#challenge-list')).toContainText('○ 待完成 · 15 项：靠后');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
});

test('unsorted data never fabricates a binary result and wrong prerequisite answer is correctable', async ({page}) => {
  await page.goto(topic);
  await page.locator('#order-select').selectOption('shuffled');
  await expect(page.locator('#prediction-select')).toBeDisabled();
  await expect(page.locator('#binary-count')).toHaveText('—');
  await expect(page.locator('#binary-trace')).toContainText('本轮没有二分比较或结果');
  await compare(page, 2);
  await expect(page.locator('#linear-count')).toHaveText('2');
  await expect(page.locator('#binary-count')).toHaveText('—');
  await page.locator('#prerequisite-select').selectOption('size');
  await page.locator('#check-prerequisite').click();
  await expect(page.locator('#prerequisite-status')).toContainText('还不对');
  await expect(page.locator('#challenge-list')).toContainText('○ 待完成 · 乱序');
  await page.locator('#prerequisite-select').selectOption('sorted');
  await page.locator('#check-prerequisite').click();
  await expect(page.locator('#prerequisite-status')).toContainText('判断正确');
  await expect(page.locator('#challenge-list')).toContainText('✓ 已完成 · 乱序');
  await compare(page, 7);
  await expect(page.locator('#run-status')).toContainText('乱序数据不能直接二分');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
});

test('continuous run pauses and changing size cancels the old timer', async ({page}) => {
  await page.goto(topic);
  await page.locator('#prediction-select').selectOption('binary');
  await page.locator('#play-button').click();
  await expect(page.locator('#linear-count')).toHaveText('1');
  await page.locator('#pause-button').click();
  await page.waitForTimeout(650);
  await expect(page.locator('#linear-count')).toHaveText('1');
  await page.locator('#play-button').click();
  await page.locator('#size-select').selectOption('7');
  await expect(page.locator('#linear-count')).toHaveText('0');
  await expect(page.locator('#binary-next')).toContainText('第 1–7 项');
  await page.waitForTimeout(650);
  await expect(page.locator('#linear-count')).toHaveText('0');
  await page.locator('#target-select').selectOption('missing');
  await page.locator('#prediction-select').selectOption('binary');
  await page.locator('#play-button').click();
  await expect(page.locator('#linear-count')).toHaveText('7', {timeout: 8000});
  await expect(page.locator('#binary-count')).toHaveText('3');
  await expect(page.locator('#pause-button')).toBeDisabled();
  await page.locator('#example-button').click();
  await expect(page.locator('#size-select')).toHaveValue('15');
  await expect(page.locator('#target-select')).toHaveValue('near');
  await expect(page.locator('#linear-count')).toHaveText('0');
});

test('corrupt progress stays intact and earned completion can be retried after reset', async ({page}) => {
  await page.addInitScript(key => localStorage.setItem(key, '{broken'), progressKey);
  await page.goto(topic);
  await earnFour(page);
  await page.locator('#order-select').selectOption('shuffled');
  await page.locator('#prerequisite-select').selectOption('sorted');
  await page.locator('#check-prerequisite').click();
  await expect(page.locator('#retry-save')).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBe('{broken');
  await page.locator('#reset-button').click();
  await page.evaluate(key => localStorage.removeItem(key), progressKey);
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('此前赢得');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'search-strategies': true});
});

test('write rejection is reported and retry succeeds after writes recover', async ({page}) => {
  await page.addInitScript(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new Error('write rejected');
      return original.call(this, name, value);
    };
    window.restoreProgressWrites = () => { Storage.prototype.setItem = original; };
  }, progressKey);
  await page.goto(topic);
  await earnFour(page);
  await page.locator('#order-select').selectOption('shuffled');
  await page.locator('#prerequisite-select').selectOption('sorted');
  await page.locator('#check-prerequisite').click();
  await expect(page.locator('#progress-status')).toContainText('未能保存');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
  await page.locator('#reset-button').click();
  await page.evaluate(() => window.restoreProgressWrites());
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('此前赢得');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'search-strategies': true});
});

test('home search and high-stage directory count the new topic', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网发现由发布后浏览器验收');
  await page.goto('/');
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total', '14');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('high');
  await page.getByRole('searchbox', {name: '关键词'}).fill('查找策略');
  await page.locator('#site-results a[href="computer/high/search-strategies.html"]').click();
  await expect(page).toHaveURL(/computer\/high\/search-strategies\.html/);
  await earnFour(page);
  await page.locator('#order-select').selectOption('shuffled');
  await page.locator('#prerequisite-select').selectOption('sorted');
  await page.locator('#check-prerequisite').click();
  await page.locator('.footer-nav a[href="index.html"]').click();
  await expect(page.locator('#stage-progress')).toContainText('1/1');
  await expect(page.locator('[data-topic-slug="search-strategies"] [data-completion]')).toContainText('已完成');
  await page.goto('/');
  await expect(page.locator('[data-subject="computer"] .sp-label')).toContainText('已学 1/14');
});

test('320px keyboard and reduced motion preserve a readable manual comparison', async ({page}) => {
  await page.setViewportSize({width: 320, height: 720});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(topic);
  await page.locator('#prediction-select').selectOption('binary');
  await expect(page.locator('#prediction-select')).toHaveValue('binary');
  await page.locator('#step-button').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#binary-count')).toHaveText('1');
  const dimensions = await page.evaluate(() => ({width: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
    outline: getComputedStyle(document.querySelector('#step-button')).outlineStyle}));
  expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.outline).not.toBe('none');
});

test('direct file works offline with no runtime network requests', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项不检查本地文件');
  const remote = [], errors = [];
  page.on('request', request => { if (/^https?:/.test(request.url())) remote.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(resolve(__dirname, '../../computer/high/search-strategies.html')).href);
  await page.locator('#prediction-select').selectOption('binary');
  await compare(page, 3);
  await expect(page.locator('#binary-next')).toContainText('第 14 项找到');
  expect(remote).toEqual([]);
  expect(errors).toEqual([]);
});

test('built release works under the project subpath', async ({page}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop' || !!process.env.KV_PUBLISHED_BASE_URL, '发布包单次桌面检查');
  const release = await startReleaseServer(), failures = [];
  try {
    page.on('requestfailed', request => failures.push(request.url()));
    const response = await page.goto(new URL('computer/high/search-strategies.html', release.base).href);
    expect(response.status()).toBe(200);
    await page.locator('#prediction-select').selectOption('binary');
    await compare(page, 3);
    await expect(page.locator('#binary-next')).toContainText('第 14 项找到');
    expect(failures).toEqual([]);
  } finally { await release.close(); }
});
