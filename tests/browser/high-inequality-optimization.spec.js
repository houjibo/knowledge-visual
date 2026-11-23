const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/high/inequality.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/high/inequality.html';

async function openLab(page) {
  await page.goto(topic);
  await page.getByRole('button', {name: /均值不等式/}).click();
  await expect(page.locator('#optimization-lab')).toBeVisible();
}

async function setRange(page, id, value) {
  await page.locator(id).evaluate((el, next) => {
    el.value = String(next);
    el.dispatchEvent(new Event('input', {bubbles: true}));
  }, value);
}

test('非负零边界保留精确等号与退化图示', async ({page}) => {
  await openLab(page);
  await setRange(page, '#slA2', 0);
  await expect(page.locator('#amgm-gm')).toHaveText('0.000');
  await expect(page.locator('#amgm-equality')).toContainText('a≠b');
  await expect(page.locator('#amgm-boundary')).toContainText('一个数为 0');
  await setRange(page, '#slB2', 0);
  await expect(page.locator('#amgm-am')).toHaveText('0.000');
  await expect(page.locator('#amgm-equality')).toContainText('成立');
  await expect(page.locator('#amgm-boundary')).toContainText('半圆退化为点');
});

test('固定和与固定积区分等号界和实际可达最值', async ({page}) => {
  await openLab(page);
  await page.locator('#optimization-pair').selectOption('2-2');
  await page.locator('#optimization-answer').fill('4');
  await page.locator('#optimization-check').click();
  await expect(page.locator('#optimization-feedback')).toContainText('最大值 4 可以取到');

  await page.locator('#optimization-scenario').selectOption('sum-restricted');
  await page.locator('#optimization-pair').selectOption('1-3');
  await page.locator('#optimization-answer').fill('4');
  await page.locator('#optimization-check').click();
  await expect(page.locator('#optimization-feedback')).toContainText('不符合 a≤1');
  await expect(page.locator('#optimization-feedback')).toContainText('最大值 3');
  await page.locator('#optimization-answer').fill('3');
  await page.locator('#optimization-check').click();
  await expect(page.locator('#optimization-feedback')).toContainText('正确');
  await expect(page.locator('#optimization-feedback')).toContainText('(1−a)(3−a)');

  await page.locator('#optimization-scenario').selectOption('product-restricted');
  await page.locator('#optimization-pair').selectOption('1-4');
  await page.locator('#optimization-answer').fill('5');
  await page.locator('#optimization-check').click();
  await expect(page.locator('#optimization-feedback')).toContainText('最小值 5');
  await expect(page.locator('#optimization-feedback')).toContainText('(1−a)(4−a)/a');
});

test('两个零约束和固定积开放任务均可构造', async ({page}) => {
  await openLab(page);
  for (const [scenario, pair, answer, expected] of [
    ['product-open', '2-2', '4', '最小值 4'],
    ['sum-zero', '0-0', '0', '零边界成立'],
    ['product-zero', '0-0', '0', '没有最大值']
  ]) {
    await page.locator('#optimization-scenario').selectOption(scenario);
    await page.locator('#optimization-pair').selectOption(pair);
    await page.locator('#optimization-answer').fill(answer);
    await page.locator('#optimization-check').click();
    await expect(page.locator('#optimization-feedback')).toContainText(expected);
  }
});

test('320px 下键盘可完成受限任务且无横向溢出', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await openLab(page);
  await page.locator('#optimization-scenario').selectOption('product-restricted');
  await page.locator('#optimization-pair').selectOption('1-4');
  await page.locator('#optimization-answer').fill('5');
  await page.locator('#optimization-check').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#optimization-feedback')).toContainText('正确');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('文件直开和发布子路径均加载构造模型', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网路径由上方共用用例验证');
  await page.goto(pathToFileURL(resolve(__dirname, '../../math/high/inequality.html')).href);
  await page.getByRole('button', {name: /均值不等式/}).click();
  await expect(page.locator('#optimization-scenario option')).toHaveCount(6);
  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('math/high/inequality.html', release.base).href);
    expect(response.status()).toBe(200);
    await page.getByRole('button', {name: /均值不等式/}).click();
    await expect(page.locator('#optimization-scenario option')).toHaveCount(6);
  } finally { await release.close(); }
});
