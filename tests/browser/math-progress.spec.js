const {test, expect} = require('@playwright/test');
const path = require('node:path');
const {pathToFileURL} = require('node:url');

const badge = (page, href) => page.locator(`a[href="${href}"] .progress-badge`);

test('数学新进度按学段区分同名主题并在刷新后保留', async ({page}) => {
  await page.goto('/math/high/derivative.html');
  await page.evaluate(() => PageProgress.markDone('derivative'));
  expect(await page.evaluate(() => localStorage.getItem('kv-math-progress'))).toBeNull();
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('kv-math-progress-v2')))['high:derivative']).toBeTruthy();
  await page.goto('/math/high/index.html');
  await expect(badge(page, 'derivative.html')).toHaveCount(1);
  await page.goto('/math/uni/index.html');
  await expect(badge(page, 'derivative.html')).toHaveCount(0);
  await page.goto('/math/index.html');
  await expect(page.locator('#stageProgress')).toContainText('高中 ✓ 1/19');
  await expect(page.locator('#stageProgress')).toContainText('大学 尚未开始');
  await page.reload();
  await expect(page.locator('#stageProgress')).toContainText('高中 ✓ 1/19');
  await page.goto('/math/uni/derivative.html');
  await page.evaluate(() => PageProgress.markDone('derivative'));
  expect(await page.evaluate(() => PageProgress.count())).toBe(2);
  await page.goto('/');
  await expect(page.locator('[data-subject="math"] .sp-label')).toContainText('已学 2/198');
});

test('旧记录保留：无冲突可读，同名记录不猜测学段', async ({page}) => {
  await page.goto('/');
  const old = JSON.stringify({derivative: 101, 'linear-equation': 123});
  await page.evaluate(data => localStorage.setItem('kv-math-progress', data), old);
  await page.goto('/math/index.html');
  await expect(page.locator('#mathLegacyWarning')).toBeVisible();
  await expect(page.locator('#mathLegacyWarning')).toContainText('导数');
  await expect(page.locator('#stageProgress')).toContainText('初中 ✓ 1/28');
  await expect(page.locator('#stageProgress')).toContainText('高中 尚未开始');
  await expect(page.locator('#stageProgress')).toContainText('大学 尚未开始');
  await page.goto('/math/middle/index.html');
  await expect(badge(page, 'linear-equation.html')).toHaveCount(1);
  await page.goto('/math/high/index.html');
  await expect(badge(page, 'derivative.html')).toHaveCount(0);
  await page.goto('/math/uni/derivative.html');
  expect(await page.evaluate(() => PageProgress.isDone('derivative'))).toBe(false);
  await page.evaluate(() => PageProgress.markDone('derivative'));
  expect(await page.evaluate(() => localStorage.getItem('kv-math-progress'))).toBe(old);
  await page.goto('/');
  await expect(page.locator('[data-subject="math"] .sp-label')).toContainText('学段不明旧记录');
  await expect(page.locator('[data-subject="math"]')).toHaveAttribute('aria-label', /学段不明/);
});

test('清除旧进度回退不删除原记录', async ({page}) => {
  await page.goto('/');
  const old = JSON.stringify({'linear-equation': 123});
  await page.evaluate(data => localStorage.setItem('kv-math-progress', data), old);
  await page.goto('/math/middle/linear-equation.html');
  expect(await page.evaluate(() => PageProgress.isDone('linear-equation'))).toBe(true);
  await page.evaluate(() => PageProgress.clear('linear-equation'));
  expect(await page.evaluate(() => localStorage.getItem('kv-math-progress'))).toBe(old);
  await page.goto('/math/middle/index.html');
  await expect(badge(page, 'linear-equation.html')).toHaveCount(0);
  await page.goto('/');
  await expect(page.locator('[data-subject="math"] .sp-label')).toHaveText('尚未开始');
});

test('存储不可用时数学目录仍可使用', async ({page}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('storage denied'); };
    Storage.prototype.setItem = () => { throw new Error('storage denied'); };
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/math/index.html');
  await expect(page.locator('#topic-query')).toBeVisible();
  await expect(page.locator('#stageProgress')).toContainText('小学 尚未开始');
  expect(errors).toEqual([]);
});

test('小学与初中分数独立，学段公共脚本可读写', async ({page}) => {
  await page.goto('/math/topics/fractions/index.html');
  await page.evaluate(() => PageProgress.markDone('fractions'));
  await page.goto('/math/middle/fractions.html');
  expect(await page.evaluate(() => PageProgress.isDone('fractions'))).toBe(false);
  await page.goto('/math/middle/probability-intro.html');
  await page.evaluate(() => PageProgress.markDone('probability-intro'));
  await page.goto('/math/middle/index.html');
  await expect(badge(page, 'probability-intro.html')).toHaveCount(1);
  await expect(badge(page, 'fractions.html')).toHaveCount(0);
});

test('直接打开文件时学段进度可区分', async ({page}) => {
  const file = name => pathToFileURL(path.resolve(__dirname, '../..', name)).href;
  await page.goto(file('math/high/derivative.html'));
  await page.evaluate(() => PageProgress.markDone('derivative'));
  await page.goto(file('math/high/index.html'));
  await expect(badge(page, 'derivative.html')).toHaveCount(1);
  await page.goto(file('math/uni/derivative.html'));
  expect(await page.evaluate(() => PageProgress.isDone('derivative'))).toBe(false);
});

test('两个学习标签页依次记录完成时不会被旧缓存覆盖', async ({context, page}) => {
  const other = await context.newPage();
  await page.goto('/math/high/derivative.html');
  await other.goto('/math/uni/derivative.html');
  expect(await page.evaluate(() => PageProgress.isDone('derivative'))).toBe(false);
  expect(await other.evaluate(() => PageProgress.isDone('derivative'))).toBe(false);
  await page.evaluate(() => PageProgress.markDone('derivative'));
  await other.evaluate(() => PageProgress.markDone('derivative'));
  const stored = JSON.parse(await page.evaluate(() => localStorage.getItem('kv-math-progress-v2')));
  expect(stored['high:derivative']).toBeTruthy();
  expect(stored['uni:derivative']).toBeTruthy();
  expect(await page.evaluate(() => PageProgress.count())).toBe(2);
  await other.close();
});

test('允许读取但写入失败时本页进度不丢失', async ({page}) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('quota exceeded'); }; });
  await page.goto('/math/high/derivative.html');
  await page.evaluate(() => PageProgress.markDone('derivative'));
  expect(await page.evaluate(() => PageProgress.isDone('derivative'))).toBe(true);
  expect(await page.evaluate(() => PageProgress.count())).toBe(1);
  await page.reload();
  expect(await page.evaluate(() => PageProgress.isDone('derivative'))).toBe(false);
});
