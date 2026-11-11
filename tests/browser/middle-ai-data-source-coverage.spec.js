const {test, expect} = require('@playwright/test');

test('同样四条样例的跨条件预设扩大覆盖且不声称模型准确率', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/ai/middle/data-source-coverage.html');

  await expect(page.locator('#sample-count')).toHaveText('4 / 8');
  await expect(page.locator('#label-count')).toHaveText('圆形 2 · 三角形 2');
  await expect(page.locator('#condition-count')).toHaveText('明亮 4 · 低照度 0');
  await expect(page.locator('#coverage-total')).toHaveText('本演示集合已覆盖 2 / 4 个条件组合。');
  await expect(page.locator('#cell-dim-circle')).toHaveText('0 / 2 · 缺少');
  await expect(page.locator('#missing-combinations')).toContainText('低照度桌面');

  await page.getByRole('button', {name: '明暗各取样，仍选 4 条'}).click();
  await expect(page.locator('#sample-count')).toHaveText('4 / 8');
  await expect(page.locator('#label-count')).toHaveText('圆形 2 · 三角形 2');
  await expect(page.locator('#condition-count')).toHaveText('明亮 2 · 低照度 2');
  await expect(page.locator('#coverage-total')).toHaveText('本演示集合已覆盖 4 / 4 个条件组合。');
  await expect(page.locator('#missing-combinations')).toHaveText('四种条件组合都有已选样例。');
  await expect(page.locator('.scope-note')).toContainText('不能说明真实模型的准确率');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-ai-middle-progress'))))
    .toEqual({'data-source-coverage': true});
  expect(errors).toEqual([]);
});

test('手动更改样例后同步更新标签、条件和覆盖矩阵', async ({page}) => {
  await page.goto('/ai/middle/data-source-coverage.html');
  await page.locator('#sample-05').check();
  await expect(page.locator('#sample-count')).toHaveText('5 / 8');
  await expect(page.locator('#label-count')).toHaveText('圆形 3 · 三角形 2');
  await expect(page.locator('#condition-count')).toHaveText('明亮 4 · 低照度 1');
  await expect(page.locator('#cell-dim-circle')).toHaveText('1 / 2 · 已覆盖');
  await expect(page.locator('#coverage-total')).toHaveText('本演示集合已覆盖 3 / 4 个条件组合。');
  await expect(page.locator('#missing-combinations')).toContainText('低照度桌面—三角形');

  await page.locator('#sample-01').uncheck();
  await expect(page.locator('#sample-count')).toHaveText('4 / 8');
  await expect(page.locator('#label-count')).toHaveText('圆形 2 · 三角形 2');
  expect(await page.evaluate(() => localStorage.getItem('kv-ai-middle-progress'))).toBeNull();
});

test('空样本集合显示无覆盖且不生成推断', async ({page}) => {
  await page.goto('/ai/middle/data-source-coverage.html');
  for (const id of ['01', '02', '03', '04', '05', '06', '07', '08']) {
    await page.locator(`#sample-${id}`).uncheck();
  }
  await expect(page.locator('#sample-count')).toHaveText('0 / 8');
  await expect(page.locator('#label-count')).toHaveText('圆形 0 · 三角形 0');
  await expect(page.locator('#coverage-total')).toHaveText('本演示集合已覆盖 0 / 4 个条件组合。');
  await expect(page.locator('#missing-combinations')).toContainText('明亮桌面—圆形');
  await expect(page.locator('#selection-status')).toContainText('无法观察任何条件组合');
  expect(await page.evaluate(() => localStorage.getItem('kv-ai-middle-progress'))).toBeNull();
});

test('学段目录、首页查找和学习进度包含新主题', async ({page}) => {
  await page.goto('/ai/middle/index.html');
  await expect(page.locator('#stage-progress')).toHaveText('已完成 0/3 个主题');
  await expect(page.locator('[data-topic-slug="data-source-coverage"]'))
    .toContainText('数据来源与覆盖实验室');

  await page.goto('/');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('ai');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('middle');
  await page.getByRole('searchbox', {name: '关键词'}).fill('数据来源');
  const result = page.locator('#site-results a[href="ai/middle/data-source-coverage.html"]');
  await expect(result).toBeVisible();
  await result.click();
  await page.getByRole('button', {name: '明暗各取样，仍选 4 条'}).click();

  await page.goto('/ai/middle/index.html');
  await expect(page.locator('#stage-progress')).toHaveText('本机已记录完成 1/3 个主题。');
  await expect(page.locator('[data-topic-slug="data-source-coverage"] [data-completion]'))
    .toHaveText('✓ 已完成');
  await page.goto('/');
  await expect(page.locator('[data-subject="ai"] .sp-label')).toHaveText('已学 1/7');
});

test('进度存储被拒绝时覆盖实验仍可操作并如实提示', async ({page}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'kv-ai-middle-progress') throw new Error('storage denied');
      return original.call(this, key, value);
    };
  });
  await page.goto('/ai/middle/data-source-coverage.html');
  await page.getByRole('button', {name: '明暗各取样，仍选 4 条'}).click();
  await expect(page.locator('#coverage-total')).toContainText('4 / 4');
  await expect(page.locator('#progress-status')).toContainText('进度未能保存');
  expect(await page.evaluate(() => localStorage.getItem('kv-ai-middle-progress'))).toBeNull();
});

test('键盘能调整样例并在 320px 窄屏完成覆盖检查', async ({page}) => {
  await page.setViewportSize({width: 320, height: 800});
  await page.goto('/ai/middle/data-source-coverage.html');
  for (const id of ['sample-05', 'sample-07']) {
    const checkbox = page.locator(`#${id}`);
    await expect(checkbox).toBeVisible();
    await checkbox.focus();
    await page.keyboard.press('Space');
  }
  await expect(page.locator('#coverage-total')).toHaveText('本演示集合已覆盖 4 / 4 个条件组合。');
  await expect(page.locator('#sample-count')).toHaveText('6 / 8');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
