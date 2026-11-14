const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/middle/scientific-notation-approximation.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/middle/scientific-notation-approximation.html';

async function science(page, id, coefficient, exponent) {
  await page.locator('#science-case').selectOption(id);
  await page.locator('#coefficient').fill(coefficient);
  await page.locator('#exponent').fill(exponent);
  await page.locator('#science-submit').click();
}

async function approx(page, id, answer) {
  await page.locator('#approx-case').selectOption(id);
  await page.locator('#approx-answer').fill(answer);
  await page.locator('#approx-submit').click();
}

async function complete(page) {
  await science(page, 'large', '7.25', '7');
  await science(page, 'tiny', '5.6', '-5');
  await approx(page, 'length', '12.3');
  await approx(page, 'distance', '8.00');
}

test('scientific notation distinguishes exact equality from normalized coefficient', async ({page}) => {
  await page.goto(topic);
  await science(page, 'large', '72.5', '6');
  await expect(page.locator('#science-feedback')).toContainText('数值相等');
  await expect(page.locator('#progress-detail')).toContainText('正指数 0/1');
  await page.locator('#coefficient').fill('7.25');
  await page.locator('#exponent').fill('7');
  await page.locator('#science-expand').click();
  await expect(page.locator('#science-feedback')).toContainText('展开为 72500000');
  await page.locator('#science-submit').click();
  await expect(page.locator('#science-feedback')).toContainText('等值且系数规范');
  await expect(page.locator('#shift-steps span').first()).toHaveText('7.25');
  await expect(page.locator('#shift-steps span').last()).toHaveText('72500000');
  await expect(page.locator('#progress-detail')).toContainText('正指数 1/1');

  await science(page, 'tiny', '5.6', '-5');
  await expect(page.locator('#shift-caption')).toContainText('向左移动 5 位');
  await expect(page.locator('#shift-steps span').last()).toHaveText('0.000056');
  await science(page, 'negative', '-3.84', '5');
  await expect(page.locator('#science-feedback')).toContainText('= -384000');
  await page.locator('#science-case').selectOption('tiny2');
  await page.locator('#science-example').click();
  await expect(page.locator('#science-feedback')).toContainText('不计入独立完成');
  await page.locator('#coefficient').fill('7.2');
  await page.locator('#exponent').fill('-7');
  await page.locator('#science-submit').click();
  await expect(page.locator('#science-feedback')).toContainText('不计入独立完成');
});

test('rounding gives a number line, handles a half-way carry and preserves precision', async ({page}) => {
  await page.goto(topic);
  await expect(page.locator('#axis-low')).toHaveText('12.3');
  await expect(page.locator('#axis-high')).toHaveText('12.4');
  await approx(page, 'distance', '7.99');
  await expect(page.locator('#axis-low')).toHaveText('7.99');
  await expect(page.locator('#axis-high')).toHaveText('8.00');
  await expect(page.locator('#axis-track')).toHaveAttribute('aria-label', /7.995.*7.99.*8.00/);
  await expect(page.locator('#approx-feedback')).toContainText('紧跟的一位：这里是 5');
  await page.locator('#approx-answer').fill('8');
  await page.locator('#approx-submit').click();
  await expect(page.locator('#approx-feedback')).toContainText('保留指定位数');
  await page.locator('#approx-answer').fill('8.00');
  await page.locator('#approx-submit').click();
  await expect(page.locator('#approx-feedback')).toContainText('7.995 km ≈ 8.00 km');
  await expect(page.locator('#approx-explanation')).toContainText('向上进位');
  await approx(page, 'people', '125000');
  await expect(page.locator('#approx-feedback')).toContainText('124650 人 ≈ 125000 人');
  await approx(page, 'mass', '0.005');
  await expect(page.locator('#approx-feedback')).toContainText('0.00476 g ≈ 0.005 g');
});

test('four independently answered classes save completion and appear in both directories', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项不模拟存储故障');
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'kv-math-progress-v2') throw new Error('denied');
      return original.call(this, key, value);
    };
    window.restoreProgressWrites = () => { Storage.prototype.setItem = original; };
  });
  await page.goto(topic);
  await complete(page);
  await expect(page.locator('#learningProgress')).toContainText('暂未保存');
  await expect(page.locator('#math-progress-save-notice')).toContainText('暂未保存');
  await page.evaluate(() => window.restoreProgressWrites());
  await page.locator('#math-progress-save-notice button').click();
  await expect(page.locator('#learningProgress')).toContainText('已保存在当前浏览器');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-math-progress-v2'))['middle:scientific-notation-approximation'])).toBeTruthy();
  await page.reload();
  await expect(page.locator('#learningProgress')).toContainText('已保存在当前浏览器');
  await expect(page.locator('#progress-detail')).toContainText('本机已有完成记录');
  await page.goto('/math/middle/index.html');
  await expect(page.locator('a[href="scientific-notation-approximation.html"] .progress-badge')).toHaveText('✓');
  await page.goto('/math/index.html');
  await expect(page.locator('#stageProgress')).toContainText('初中 ✓ 1/30');
  await page.goto('/');
  await expect(page.locator('[data-subject="math"]')).toHaveAttribute('data-total', '200');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('math');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('middle');
  await page.getByRole('searchbox', {name: '关键词'}).fill('科学记数法');
  await expect(page.locator('#site-results a[href="math/middle/scientific-notation-approximation.html"]')).toHaveCount(1);
});

test('320px keyboard, local file and release subpath keep both labs usable', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(topic);
  await page.locator('#coefficient').fill('7.25');
  await page.locator('#exponent').fill('7');
  await page.locator('#science-submit').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#science-feedback')).toContainText('等值且系数规范');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  if (process.env.KV_PUBLISHED_BASE_URL) return;

  await page.goto(pathToFileURL(resolve(__dirname, '../../math/middle/scientific-notation-approximation.html')).href);
  await science(page, 'tiny', '5.6', '-5');
  await expect(page.locator('#science-feedback')).toContainText('等值且系数规范');
  await approx(page, 'distance', '8.00');
  await expect(page.locator('#approx-feedback')).toContainText('≈ 8.00 km');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('math/middle/scientific-notation-approximation.html', release.base).href);
    expect(response.status()).toBe(200);
    await science(page, 'tiny2', '7.2', '-7');
    await expect(page.locator('#shift-steps span').last()).toHaveText('0.00000072');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  } finally { await release.close(); }
});
