const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('simulation-world/warehouse-sort.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/simulation-world/warehouse-sort.html';

async function step(page, count) {
  for (let index = 0; index < count; index++) await page.locator('#step-button').click();
}

async function finish(page) {
  for (let index = 0; index < 80; index++) {
    if (await page.locator('#step-button').isDisabled()) return;
    await page.locator('#step-button').click();
  }
  throw new Error('finite sorting batch did not complete');
}

test('仓储分拣可从分类与搜索发现且无学科进度', async ({page}) => {
  await page.goto(process.env.KV_PUBLISHED_BASE_URL || '/');
  const category = page.locator('[data-subject-category="simulation-world"]');
  await expect(category).toHaveAttribute('data-total', '9');
  await expect(category.locator('.subject-badge')).toHaveText('9 个模拟');
  await expect(category.locator('.subject-progress')).toHaveCount(0);
  await page.getByRole('combobox', {name:'学科', exact:true}).selectOption('simulation-world');
  await page.getByRole('searchbox', {name:'关键词'}).fill('分拣');
  await page.locator('#site-results a[href="simulation-world/warehouse-sort.html"]').click();
  await expect(page.getByRole('heading', {name:'仓储分拣模拟'})).toBeVisible();
  await page.getByRole('navigation', {name:'导航'}).getByRole('link', {name:'返回模拟世界'}).click();
  await expect(page.locator('.topic-card')).toHaveCount(9);
});

test('默认先预测A口，逐秒看见等待而B口空闲', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(topic);
  await expect(page.locator('#step-button')).toBeEnabled();
  await expect(page.locator('#clock')).toHaveText('未开始');
  await expect(page.locator('#incoming-items .parcel')).toHaveCount(12);
  await page.locator('#step-button').click();
  await expect(page.locator('#clock')).toHaveText('未开始');
  await expect(page.locator('#simulation-status')).toContainText('先选');
  await page.locator('#prediction-select').selectOption('A');
  await step(page, 2);
  await expect(page.locator('#clock')).toHaveText('1 秒');
  await expect(page.locator('#a-active')).toContainText('P1');
  await expect(page.locator('#a-queue .parcel')).toContainText('P2 · A');
  await expect(page.locator('#b-active')).toHaveText('空闲');
  await expect(page.locator('#b-queue .parcel')).toHaveCount(0);
  await expect(page.locator('#first-queue')).toHaveText('A 口');
  await expect(page.locator('#prediction-status')).toContainText('预测正确');
  await expect(page.locator('#prediction-select')).toBeDisabled();
  expect(errors).toEqual([]);
});

test('B口受压与无等待示例给出不同预测结果', async ({page}) => {
  await page.goto(topic);
  await page.locator('#preset-b').click();
  await page.locator('#prediction-select').selectOption('B');
  await step(page, 6);
  await expect(page.locator('#clock')).toHaveText('5 秒');
  await expect(page.locator('#first-queue')).toHaveText('B 口');
  await expect(page.locator('#b-queue .parcel')).toContainText('P6 · B');
  await expect(page.locator('#a-peak')).toHaveText('0');
  await expect(page.locator('#prediction-status')).toContainText('预测正确');
  await page.locator('#preset-clear').click();
  await page.locator('#prediction-select').selectOption('none');
  await finish(page);
  await expect(page.locator('#clock')).toHaveText('12 秒');
  await expect(page.locator('#first-queue')).toHaveText('都不排队');
  await expect(page.locator('#a-peak')).toHaveText('0');
  await expect(page.locator('#b-peak')).toHaveText('0');
  await expect(page.locator('#prediction-status')).toContainText('预测正确');
});

test('两次完整运行可比较批次时间，重置不覆盖完整记录', async ({page}) => {
  await page.goto(topic);
  await page.locator('#prediction-select').selectOption('A');
  await finish(page);
  await expect(page.locator('#clock')).toHaveText('24 秒');
  await expect(page.locator('#completed-count')).toHaveText('12 / 12');
  await expect(page.locator('#comparison-old')).toContainText('整批 24 秒');
  await page.locator('#reset-button').click();
  await expect(page.locator('#clock')).toHaveText('未开始');
  await expect(page.locator('#comparison-old')).toContainText('整批 24 秒');
  await page.locator('#preset-clear').click();
  await page.locator('#prediction-select').selectOption('none');
  await finish(page);
  await expect(page.locator('#comparison-new')).toContainText('整批 12 秒');
  await expect(page.locator('#comparison-result')).toContainText('快 12 秒');
  await expect(page.locator('#comparison-result')).toContainText('A 口最大等待');
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => /warehouse|sort/.test(key)))).toEqual([]);
});

test('参数变化与动态偏好变化都会停掉旧计时器', async ({page}) => {
  await page.clock.install();
  await page.goto(topic);
  await page.locator('#prediction-select').selectOption('A');
  await page.locator('#run-button').click();
  await page.clock.runFor(700);
  await expect(page.locator('#clock')).toHaveText('1 秒');
  await page.locator('#service-a').selectOption('2');
  await expect(page.locator('#clock')).toHaveText('未开始');
  await page.clock.runFor(1050);
  await expect(page.locator('#clock')).toHaveText('未开始');
  await page.locator('#prediction-select').selectOption('A');
  await page.locator('#run-button').click();
  await page.clock.runFor(350);
  await expect(page.locator('#clock')).toHaveText('0 秒');
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('#pause-button')).toBeDisabled();
  await page.clock.runFor(1050);
  await expect(page.locator('#clock')).toHaveText('0 秒');
});

test('file直开和320px宽度下仍能用键盘完成单步', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项已覆盖发布路径');
  await page.setViewportSize({width:320, height:700});
  await page.goto(pathToFileURL(resolve(__dirname, '../../simulation-world/warehouse-sort.html')).href);
  await expect(page.locator('#step-button')).toBeEnabled();
  const prediction = page.getByRole('combobox', {name:'哪一口会先出现等待？'});
  await prediction.selectOption('A');
  await expect(prediction).toHaveValue('A');
  await page.getByRole('button', {name:'前进 1 秒'}).focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(page.locator('#first-queue')).toHaveText('A 口');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('发布包子路径中的模型与控制器均可加载', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项已覆盖发布路径');
  test.setTimeout(60_000);
  const server = await startReleaseServer();
  try {
    const failed = [];
    page.on('pageerror', error => failed.push(error.message));
    page.on('response', response => {
      if (response.url().startsWith(server.base) && response.status() >= 400)
        failed.push(`${response.status()} ${response.url()}`);
    });
    const response = await page.goto(server.base + 'simulation-world/warehouse-sort.html', {waitUntil:'domcontentloaded'});
    expect(response.status()).toBe(200);
    await page.locator('#preset-b').click();
    await page.locator('#prediction-select').selectOption('B');
    await step(page, 6);
    await expect(page.locator('#prediction-status')).toContainText('预测正确');
    await page.getByRole('navigation', {name:'导航'}).getByRole('link', {name:'返回模拟世界'}).click();
    await expect(page).toHaveURL(server.base + 'simulation-world/index.html');
    await page.waitForLoadState('domcontentloaded');
    expect(failed).toEqual([]);
  } finally {
    try { await page.close(); }
    finally { await server.close(); }
  }
});
