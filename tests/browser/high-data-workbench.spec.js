const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('computer/high/data-workbench.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/computer/high/data-workbench.html';
const siteRoot = process.env.KV_PUBLISHED_BASE_URL
  ? process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/') : '/';
const progressKey = 'kv-computer-high-progress';

async function encodeAll(page) {
  for (const [symbol, bytes] of [['A', '1'], ['han', '3'], ['seedling', '4']]) {
    await page.locator('#symbol-select').selectOption(symbol);
    await page.locator('#byte-prediction').selectOption(bytes);
    await page.locator('#check-encoding').click();
    await expect(page.locator('#encoding-status')).toContainText('预测正确');
  }
}

async function correctPlan(page) {
  await page.locator('#unit-decision').selectOption('divide-1000');
  await page.locator('#missing-decision').selectOption('exclude');
  await page.locator('#duplicate-decision').selectOption('single');
  await page.locator('#check-plan').click();
  await expect(page.locator('#analysis-panel')).toBeVisible();
}

async function finish(page) {
  await encodeAll(page);
  await correctPlan(page);
  await page.locator('#mean-prediction').fill('20.75');
  await page.locator('#check-mean').click();
  await page.locator('#report-decision').selectOption('bounded');
  await page.locator('#check-report').click();
}

test('three UTF-8 examples reveal real bytes and wrong guesses do not count', async ({page}) => {
  await page.goto(topic);
  await page.locator('#symbol-select').selectOption('han');
  await page.locator('#byte-prediction').selectOption('2');
  await page.locator('#check-encoding').click();
  await expect(page.locator('#encoding-status')).toContainText('实际占 3 字节');
  await expect(page.locator('#byte-list')).toContainText('E4₁₆');
  await expect(page.locator('#byte-list')).toContainText('11100100₂');
  await expect(page.locator('#encoding-tally')).toContainText('0/3');
  await page.locator('#byte-prediction').selectOption('3');
  await page.locator('#check-encoding').click();
  await expect(page.locator('#encoding-tally')).toContainText('1/3');
  await page.locator('#symbol-select').selectOption('A');
  await page.locator('#byte-prediction').selectOption('1');
  await page.locator('#check-encoding').click();
  await expect(page.locator('#byte-list')).toContainText('41₁₆');
  await page.locator('#symbol-select').selectOption('seedling');
  await page.locator('#byte-prediction').selectOption('4');
  await page.locator('#check-encoding').click();
  await expect(page.locator('#byte-list li')).toHaveCount(4);
  await expect(page.locator('#byte-list')).toContainText('F0₁₆');
  await expect(page.locator('#encoding-tally')).toContainText('3/3');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
});

test('cleanup excludes missing and duplicate records, then supports a bounded report', async ({page}) => {
  await page.goto(topic);
  await page.locator('#unit-decision').selectOption('as-is');
  await page.locator('#missing-decision').selectOption('zero');
  await page.locator('#duplicate-decision').selectOption('both');
  await page.locator('#check-plan').click();
  await expect(page.locator('#analysis-panel')).toBeHidden();
  await expect(page.locator('#decision-feedback li')).toHaveCount(3);
  await correctPlan(page);
  await expect(page.locator('#chart-rows .chart-row')).toHaveCount(5);
  await expect(page.locator('#chart-rows')).toContainText('周三');
  await expect(page.locator('#chart-rows')).toContainText('21 L');
  await expect(page.locator('#chart-rows .missing')).toContainText('缺失 · 不计');
  await expect(page.locator('#chart-rows')).toContainText('23 L');
  await expect(page.locator('#chart-axis')).toContainText('25 L');
  await page.locator('#mean-prediction').fill('16.60');
  await page.locator('#check-mean').click();
  await expect(page.locator('#mean-status')).toContainText('未通过');
  await expect(page.locator('#report-decision')).toBeDisabled();
  await page.locator('#mean-prediction').fill('20.75');
  await page.locator('#check-mean').click();
  await expect(page.locator('#mean-status')).toContainText('20.75 L');
  await page.locator('#report-decision').selectOption('zero');
  await page.locator('#check-report').click();
  await expect(page.locator('#report-status')).toContainText('超出了现有记录');
  await page.locator('#report-decision').selectOption('bounded');
  await page.locator('#check-report').click();
  await expect(page.locator('#report-status')).toContainText('判断正确');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
});

test('editing a reading changes the scale and invalidates the old answer', async ({page}) => {
  await page.goto(topic);
  await correctPlan(page);
  await page.locator('#mean-prediction').fill('20.75');
  await page.locator('#check-mean').click();
  await page.locator('#report-decision').selectOption('bounded');
  await page.locator('#check-report').click();
  await page.locator('#monday-reading').fill('50');
  await expect(page.locator('#chart-axis')).toContainText('50 L');
  await expect(page.locator('#chart-rows')).toContainText('50 L');
  await expect(page.locator('#report-decision')).toBeDisabled();
  await expect(page.locator('#challenge-list')).toContainText('○ 待完成 · 当前四个有效日的均值');
  await page.locator('#mean-prediction').fill('20.75');
  await page.locator('#check-mean').click();
  await expect(page.locator('#mean-status')).toContainText('未通过');
  await page.locator('#mean-prediction').fill('28.75');
  await page.locator('#check-mean').click();
  await expect(page.locator('#mean-status')).toContainText('28.75 L');
  await page.locator('#wednesday-reading').fill('21001');
  await expect(page.locator('#chart')).toBeHidden();
  await expect(page.locator('#data-status')).toContainText('1000 的倍数');
  await expect(page.locator('#check-mean')).toBeDisabled();
  await page.locator('#wednesday-reading').fill('21000');
  await expect(page.locator('#chart')).toBeVisible();
  await expect(page.locator('#report-decision')).toBeDisabled();
});

test('all challenges save progress and directory and home counts stay consistent', async ({page}) => {
  await page.goto(topic);
  await finish(page);
  await expect(page.locator('#progress-status')).toContainText('已保存');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'data-workbench': true});
  await page.locator('.footer-nav a[href="index.html"]').click();
  await expect(page.locator('#stage-progress')).toContainText('1/6');
  await expect(page.locator('[data-topic-slug="data-workbench"] [data-completion]')).toContainText('已完成');
  await page.goto(siteRoot);
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total', '19');
  await expect(page.locator('[data-subject="computer"] .sp-label')).toContainText('已学 1/19');
});

test('a changed reading shows saved completion as history while the current challenge resets', async ({page}) => {
  await page.goto(topic);
  await finish(page);
  await expect(page.locator('#progress-status')).toContainText('已保存');
  await page.locator('#monday-reading').fill('50');
  await expect(page.locator('#challenge-list')).toContainText('○ 待完成 · 当前四个有效日的均值');
  await expect(page.locator('#progress-status')).toContainText('本机已有这个主题的完成记录');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'data-workbench': true});
});

test('corrupt storage remains intact and earned completion can be retried', async ({page}) => {
  await page.addInitScript(key => localStorage.setItem(key, '{broken'), progressKey);
  await page.goto(topic);
  await finish(page);
  await expect(page.locator('#retry-save')).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBe('{broken');
  await page.evaluate(key => localStorage.removeItem(key), progressKey);
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('已保存');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'data-workbench': true});
});

test('write rejection is visible and retry succeeds when writes recover', async ({page}) => {
  await page.addInitScript(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new Error('write rejected');
      return original.call(this, name, value);
    };
    window.restoreProgressWrites = () => { Storage.prototype.setItem = original; };
  }, progressKey);
  await page.goto(topic);
  await finish(page);
  await expect(page.locator('#progress-status')).toContainText('未能保存');
  await page.evaluate(() => window.restoreProgressWrites());
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('已保存');
});

test('home search discovers the new topic', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网搜索由部署后验收');
  await page.goto(siteRoot);
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('high');
  await page.getByRole('searchbox', {name: '关键词'}).fill('数据编码');
  await page.locator('#site-results a[href="computer/high/data-workbench.html"]').click();
  await expect(page).toHaveURL(/computer\/high\/data-workbench\.html/);
  await expect(page.getByRole('heading', {name: '数据编码与分析工作台'})).toBeVisible();
});

test('320px keyboard operation keeps chart readable without horizontal overflow', async ({page}) => {
  await page.setViewportSize({width: 320, height: 720});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(topic);
  await page.locator('#byte-prediction').selectOption('1');
  await page.locator('#check-encoding').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#encoding-status')).toContainText('预测正确');
  const outline = await page.locator('#check-encoding').evaluate(button => getComputedStyle(button).outlineStyle);
  expect(outline).not.toBe('none');
  await correctPlan(page);
  const sizes = await page.evaluate(() => ({content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth}));
  expect(sizes.content).toBeLessThanOrEqual(sizes.viewport);
  await expect(page.locator('#chart-rows .missing')).toBeVisible();
});

test('direct file mode works without external runtime requests', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项不检查本地文件');
  const remote = [], errors = [];
  page.on('request', request => { if (/^https?:/.test(request.url())) remote.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(resolve(__dirname, '../../computer/high/data-workbench.html')).href);
  await correctPlan(page);
  await expect(page.locator('#chart-rows')).toContainText('21 L');
  expect(remote).toEqual([]);
  expect(errors).toEqual([]);
});

test('built release keeps the workbench functional under the project subpath', async ({page}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop' || !!process.env.KV_PUBLISHED_BASE_URL, '发布包单次桌面检查');
  const release = await startReleaseServer(), failures = [];
  try {
    page.on('requestfailed', request => failures.push(request.url()));
    const response = await page.goto(new URL('computer/high/data-workbench.html', release.base).href);
    expect(response.status()).toBe(200);
    await correctPlan(page);
    await expect(page.locator('#chart-rows .missing')).toContainText('缺失');
    expect(failures).toEqual([]);
  } finally { await release.close(); }
});
