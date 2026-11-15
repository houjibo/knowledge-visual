const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const siteRoot = process.env.KV_PUBLISHED_BASE_URL
  ? process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/') : '/';
const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('computer/high/information-system.html', siteRoot).href : '/computer/high/information-system.html';
const progressKey = 'kv-computer-high-progress';

async function correctElements(page) {
  for (const [id, value] of [['input', 'request'], ['rule', 'policy'], ['data', 'inventory'], ['output', 'decision']])
    await page.locator(`#element-${id}`).selectOption(value);
  await page.locator('#check-elements').click();
  await expect(page.locator('#elements-status')).toContainText('四项要素判断正确');
}

async function run(page, actor, action, prediction) {
  await page.locator('#request-actor').selectOption(actor);
  await page.locator('#request-action').selectOption(action);
  await page.locator('#outcome-prediction').selectOption(prediction);
  await page.locator('#run-request').click();
}

async function finish(page) {
  await correctElements(page);
  await run(page, 'S-01', 'borrow', 'borrowed');
  await run(page, 'S-01', 'borrow', 'limit');
  await run(page, 'S-01', 'restock', 'forbidden');
  await page.locator('#access-check').selectOption('off');
  await run(page, 'S-01', 'restock', 'restocked');
  await page.locator('#risk-decision').selectOption('server-control');
  await page.locator('#check-risk').click();
  await page.locator('#connection').selectOption('offline');
  await run(page, 'S-02', 'borrow', 'offline');
}

test('system elements require all four input/process/output identifications', async ({page}) => {
  await page.goto(topic);
  await expect(page.getByRole('heading', {name: '图书借阅信息系统工作台'})).toBeVisible();
  await expect(page.locator('#stock-count')).toHaveText('2 本');
  await expect(page.locator('#stock-visual .book:not(.empty)')).toHaveCount(2);
  await page.locator('#element-input').selectOption('request');
  await page.locator('#element-rule').selectOption('inventory');
  await page.locator('#element-data').selectOption('policy');
  await page.locator('#element-output').selectOption('decision');
  await page.locator('#check-elements').click();
  await expect(page.locator('#elements-status')).toContainText('尚未放对');
  await expect(page.locator('#element-feedback li')).toHaveCount(4);
  await expect(page.locator('#challenge-list')).toContainText('○ 待完成 · 识别输入');
  await correctElements(page);
  await expect(page.locator('#challenge-list')).toContainText('✓ 已完成 · 识别输入');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
});

test('normal borrowing, limit and changed policy produce distinct data states', async ({page}) => {
  await page.goto(topic);
  await run(page, 'S-01', 'borrow', 'borrowed');
  await expect(page.locator('#prediction-status')).toContainText('预测正确');
  await expect(page.locator('#stock-count')).toHaveText('1 本');
  await expect(page.locator('#loans-s01')).toHaveText('1 本');
  await expect(page.locator('#revision-count')).toHaveText('1');
  await expect(page.locator('#flow [data-stage="data"]')).toHaveClass(/changed/);
  await run(page, 'S-01', 'borrow', 'limit');
  await expect(page.locator('#prediction-status')).toContainText('超过借阅上限');
  await expect(page.locator('#stock-count')).toHaveText('1 本');
  await expect(page.locator('#revision-count')).toHaveText('1');
  await expect(page.locator('#flow [data-stage="data"]')).toHaveClass(/unchanged/);
  await page.locator('#loan-limit').selectOption('2');
  await run(page, 'S-01', 'borrow', 'borrowed');
  await expect(page.locator('#stock-count')).toHaveText('0 本');
  await expect(page.locator('#loans-s01')).toHaveText('2 本');
  await expect(page.locator('#revision-count')).toHaveText('2');
  await expect(page.locator('#request-history li')).toHaveCount(3);
});

test('permission check blocks student write and unsafe configuration exposes a counterfactual', async ({page}) => {
  await page.goto(topic);
  await run(page, 'S-01', 'restock', 'forbidden');
  await expect(page.locator('#prediction-status')).toContainText('预测正确');
  await expect(page.locator('#stock-count')).toHaveText('2 本');
  await expect(page.locator('#flow [data-stage="rules"]')).toHaveClass(/blocked/);
  await expect(page.locator('#risk-decision')).toBeDisabled();
  await page.locator('#access-check').selectOption('off');
  await expect(page.locator('#configuration-warning')).toBeVisible();
  await run(page, 'S-01', 'restock', 'forbidden');
  await expect(page.locator('#prediction-status')).toContainText('预测未通过');
  await expect(page.locator('#stock-count')).toHaveText('3 本');
  await expect(page.locator('#challenge-list')).toContainText('○ 待完成 · 预测关闭权限');
  await page.locator('#reset-state').click();
  await run(page, 'S-01', 'restock', 'restocked');
  await expect(page.locator('#prediction-status')).toContainText('错误放行');
  await expect(page.locator('#stock-count')).toHaveText('3 本');
  await expect(page.locator('#risk-decision')).toBeEnabled();
  await page.locator('#risk-decision').selectOption('hide-button');
  await page.locator('#check-risk').click();
  await expect(page.locator('#risk-status')).toContainText('不能阻止');
  await page.locator('#risk-decision').selectOption('server-control');
  await page.locator('#check-risk').click();
  await expect(page.locator('#risk-status')).toContainText('判断正确');
});

test('offline never reaches rules and boundary stock cases do not fabricate writes', async ({page}) => {
  await page.goto(topic);
  await page.locator('#connection').selectOption('offline');
  await run(page, 'S-01', 'borrow', 'offline');
  await expect(page.locator('#flow [data-stage="network"]')).toHaveClass(/blocked/);
  await expect(page.locator('#flow [data-stage="rules"]')).toHaveClass(/skipped/);
  await expect(page.locator('#stock-count')).toHaveText('2 本');
  await expect(page.locator('#revision-count')).toHaveText('0');
  await page.locator('#connection').selectOption('online');
  await page.locator('#stock-start').selectOption('0');
  await run(page, 'S-02', 'borrow', 'out-of-stock');
  await expect(page.locator('#stock-count')).toHaveText('0 本');
  await page.locator('#stock-start').selectOption('3');
  await run(page, 'L-01', 'restock', 'restocked');
  await expect(page.locator('#stock-count')).toHaveText('4 本');
  await run(page, 'L-01', 'restock', 'stock-full');
  await expect(page.locator('#stock-count')).toHaveText('4 本');
  await expect(page.locator('#revision-count')).toHaveText('1');
});

test('seven verified challenges save progress and match stage and home totals', async ({page}) => {
  await page.goto(topic);
  await finish(page);
  await expect(page.locator('#challenge-list li')).toHaveCount(7);
  await expect(page.locator('#challenge-list')).not.toContainText('○ 待完成');
  await expect(page.locator('#progress-status')).toContainText('已保存');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'information-system': true});
  await page.locator('.footer-nav a[href="index.html"]').click();
  await expect(page.locator('#stage-progress')).toContainText('1/4');
  await expect(page.locator('[data-topic-slug="information-system"] [data-completion]')).toContainText('已完成');
  await page.goto(siteRoot);
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total', '17');
  await expect(page.locator('[data-subject="computer"] .sp-label')).toContainText('已学 1/17');
});

test('corrupt progress stays intact until retry after storage repair', async ({page}) => {
  await page.addInitScript(key => localStorage.setItem(key, '{broken'), progressKey);
  await page.goto(topic);
  await finish(page);
  await expect(page.locator('#retry-save')).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBe('{broken');
  await page.evaluate(key => localStorage.removeItem(key), progressKey);
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('已保存');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'information-system': true});
});

test('write rejection is visible and completion can be saved when writes recover', async ({page}) => {
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

test('home search finds the system from computer and high school filters', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网搜索由部署后综合验收');
  await page.goto(siteRoot);
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('high');
  await page.getByRole('searchbox', {name: '关键词'}).fill('信息系统');
  await page.locator('#site-results a[href="computer/high/information-system.html"]').click();
  await expect(page).toHaveURL(/computer\/high\/information-system\.html/);
  await expect(page.getByRole('heading', {name: '图书借阅信息系统工作台'})).toBeVisible();
});

test('320px keyboard route shows a readable vertical flow without overflow', async ({page}) => {
  await page.setViewportSize({width: 320, height: 720});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(topic);
  await page.locator('#outcome-prediction').selectOption('borrowed');
  await page.locator('#run-request').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#prediction-status')).toContainText('预测正确');
  const outline = await page.locator('#run-request').evaluate(button => getComputedStyle(button).outlineStyle);
  expect(outline).not.toBe('none');
  const sizes = await page.evaluate(() => ({content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth}));
  expect(sizes.content).toBeLessThanOrEqual(sizes.viewport);
  await expect(page.locator('#flow [data-stage="output"]')).toBeVisible();
});

test('direct file mode runs without remote runtime requests', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项不检查本地文件');
  const remote = [], errors = [];
  page.on('request', request => { if (/^https?:/.test(request.url())) remote.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(resolve(__dirname, '../../computer/high/information-system.html')).href);
  await run(page, 'S-01', 'borrow', 'borrowed');
  await expect(page.locator('#stock-count')).toHaveText('1 本');
  expect(remote).toEqual([]);
  expect(errors).toEqual([]);
});

test('release subpath includes page, model and controller', async ({page}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop' || !!process.env.KV_PUBLISHED_BASE_URL, '发布包单次桌面检查');
  const release = await startReleaseServer(), failures = [];
  try {
    page.on('requestfailed', request => failures.push(request.url()));
    const response = await page.goto(new URL('computer/high/information-system.html', release.base).href);
    expect(response.status()).toBe(200);
    await run(page, 'S-01', 'borrow', 'borrowed');
    await expect(page.locator('#stock-count')).toHaveText('1 本');
    expect(failures).toEqual([]);
  } finally { await release.close(); }
});
