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

test('四学段保留损坏数据且本页可读待写进度', async ({page}) => {
  const paths = ['/math/topics/number-line/index.html', '/math/middle/linear-equation.html', '/math/high/derivative.html', '/math/uni/derivative.html'];
  for (const raw of ['{broken', '[]', 'null', '']) {
    for (const path of paths) {
      await page.goto('/');
      await page.evaluate(value => localStorage.setItem('kv-math-progress-v2', value), raw);
      await page.goto(path);
      expect(await page.evaluate(() => PageProgress.markDone('integrity-test'))).toBe(false);
      expect(await page.evaluate(() => PageProgress.isDone('integrity-test'))).toBe(true);
      expect(await page.evaluate(() => localStorage.getItem('kv-math-progress-v2'))).toBe(raw);
    }
  }
});

test('读取被拒绝时不能覆盖未知数据', async ({page}) => {
  await page.goto('/math/high/derivative.html');
  await page.evaluate(() => {
    localStorage.setItem('kv-math-progress-v2', '{"uni:derivative":123}');
    window.originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = function(key) { if (key === 'kv-math-progress-v2') throw new Error('denied'); return window.originalGetItem.call(this, key); };
  });
  expect(await page.evaluate(() => PageProgress.markDone('derivative'))).toBe(false);
  expect(await page.evaluate(() => PageProgress.isDone('derivative'))).toBe(true);
  await page.evaluate(() => { Storage.prototype.getItem = window.originalGetItem; });
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('kv-math-progress-v2')))).toEqual({'uni:derivative':123});
});

test('写入失败期间另一标签新增记录，重试时合并', async ({page, context}) => {
  const other = await context.newPage();
  await page.goto('/math/high/derivative.html');
  await other.goto('/math/uni/derivative.html');
  await page.evaluate(() => {
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('denied'); };
  });
  expect(await page.evaluate(() => PageProgress.markDone('derivative'))).toBe(false);
  expect(await other.evaluate(() => PageProgress.markDone('derivative'))).toBe(true);
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
  expect(await page.evaluate(() => PageProgress.markDone('conic-sections'))).toBe(true);
  const saved = JSON.parse(await page.evaluate(() => localStorage.getItem('kv-math-progress-v2')));
  expect(saved['high:derivative']).toBeTruthy();
  expect(saved['high:conic-sections']).toBeTruthy();
  expect(saved['uni:derivative']).toBeTruthy();
  await other.close();
});

test('损坏记录恢复后合并本页待保存变更', async ({page}) => {
  await page.goto('/math/high/derivative.html');
  await page.evaluate(() => localStorage.setItem('kv-math-progress-v2', '{broken'));
  expect(await page.evaluate(() => PageProgress.markDone('derivative'))).toBe(false);
  await page.evaluate(() => localStorage.setItem('kv-math-progress-v2', JSON.stringify({'uni:derivative': 123})));
  expect(await page.evaluate(() => PageProgress.markDone('conic-sections'))).toBe(true);
  const saved = JSON.parse(await page.evaluate(() => localStorage.getItem('kv-math-progress-v2')));
  expect(saved['high:derivative']).toBeTruthy();
  expect(saved['high:conic-sections']).toBeTruthy();
  expect(saved['uni:derivative']).toBe(123);
});

test('四个共享脚本在写入失败时显示提示，键盘重试后保存', async ({page}) => {
  const scripts = ['/math/assets/js/common.js', '/math/middle/assets/common.js', '/math/high/assets/common.js', '/math/uni/assets/common.js'];
  for (const script of scripts) {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('kv-math-progress-v2', JSON.stringify({'uni:existing': 123}));
      window.originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = () => { throw new Error('denied'); };
    });
    await page.addScriptTag({url: script});
    expect(await page.evaluate(() => PageProgress.markDone('retry-test'))).toBe(false);
    const notice = page.locator('#math-progress-save-notice');
    await expect(notice).toContainText('暂未保存');
    await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
    await notice.getByRole('button', {name: '重试保存'}).focus();
    await page.keyboard.press('Enter');
    await expect(notice).toContainText('已保存');
    const saved = JSON.parse(await page.evaluate(() => localStorage.getItem('kv-math-progress-v2')));
    expect(saved['uni:existing']).toBe(123);
    expect(Object.keys(saved).some(k => k.endsWith(':retry-test'))).toBe(true);
  }
});

test('损坏的记录重试不会覆盖原始数据', async ({page}) => {
  await page.goto('/math/high/derivative.html');
  await page.evaluate(() => localStorage.setItem('kv-math-progress-v2', '{broken'));
  await page.evaluate(() => PageProgress.markDone('derivative'));
  const notice = page.locator('#math-progress-save-notice');
  await notice.getByRole('button', {name: '重试保存'}).click();
  await expect(notice).toContainText('暂未保存');
  expect(await page.evaluate(() => localStorage.getItem('kv-math-progress-v2'))).toBe('{broken');
});
