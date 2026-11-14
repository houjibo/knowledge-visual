const {test, expect} = require('@playwright/test');

test('初始冲突标签产生平票，复核更正后预测和进度同步更新', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/ai/middle/data-label-quality.html');

  await expect(page.locator('#included-count')).toHaveText('4 / 4');
  await expect(page.locator('#group-a-count')).toHaveText('类别甲 1 票 · 类别乙 1 票');
  await expect(page.locator('#group-a-prediction')).toHaveText('暂时无法判断');
  await expect(page.locator('#group-b-count')).toHaveText('类别甲 0 票 · 类别乙 2 票');
  await expect(page.locator('#group-b-prediction')).toHaveText('预测类别乙');

  const correct = page.getByRole('radio', {name: /按合成复核记录更正为/});
  await page.getByRole('radio', {name: /沿用录入标签/}).focus();
  await page.keyboard.press('ArrowDown');
  await expect(correct).toBeChecked();
  await expect(page.locator('#group-a-count')).toHaveText('类别甲 2 票 · 类别乙 0 票');
  await expect(page.locator('#group-a-prediction')).toHaveText('预测类别甲');
  await expect(page.locator('#lab-status')).toContainText('更正后');
  await expect(page.locator('#progress-status')).toContainText('已在本机记录完成');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-ai-middle-progress'))))
    .toEqual({'data-label-quality': true});

  await page.getByRole('button', {name: '恢复原始标签'}).click();
  await expect(page.locator('#group-a-count')).toHaveText('类别甲 1 票 · 类别乙 1 票');
  await expect(page.locator('#group-a-prediction')).toHaveText('暂时无法判断');
  expect(errors).toEqual([]);
});

test('暂不纳入存疑样例只从当前分组计数中排除', async ({page}) => {
  await page.goto('/ai/middle/data-label-quality.html');
  await page.getByRole('radio', {name: /暂不纳入/}).check();
  await expect(page.locator('#disputed-label')).toHaveText('暂不纳入计数');
  await expect(page.locator('#included-count')).toHaveText('3 / 4');
  await expect(page.locator('#conflict-count')).toHaveText('0 条待处理');
  await expect(page.locator('#group-a-count')).toHaveText('类别甲 1 票 · 类别乙 0 票');
  await expect(page.locator('#group-a-prediction')).toHaveText('预测类别甲');
  await expect(page.locator('#group-b-count')).toHaveText('类别甲 0 票 · 类别乙 2 票');
  await expect(page.locator('#group-b-prediction')).toHaveText('预测类别乙');
});

test('初中目录、首页搜索和学段进度可以到达标签实验', async ({page}) => {
  await page.goto('/ai/middle/index.html');
  await expect(page.locator('#stage-progress')).toHaveText('已完成 0/4 个主题');
  await expect(page.locator('[data-topic-slug="data-label-quality"]')).toContainText('数据标签侦察实验室');
  await page.goto('/');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('ai');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('middle');
  await page.getByRole('searchbox', {name: '关键词'}).fill('数据标签侦察');
  const result = page.locator('#site-results a[href="ai/middle/data-label-quality.html"]');
  await expect(result).toBeVisible();
  await result.click();
  await page.getByRole('radio', {name: /按合成复核记录更正为/}).check();
  await page.goto('/ai/middle/index.html');
  await expect(page.locator('#stage-progress')).toHaveText('本机已记录完成 1/4 个主题。');
  await expect(page.locator('[data-topic-slug="data-label-quality"] [data-completion]')).toHaveText('✓ 已完成');
  await page.goto('/');
  await expect(page.locator('[data-subject="ai"] .sp-label')).toHaveText('已学 1/9');
});

test('旧计算机初中进度不会误计入人工智能初中', async ({page}) => {
  await page.addInitScript(() => {
    localStorage.setItem('kv-computer-ai-middle-progress', JSON.stringify({'binary-pixels': true}));
  });
  await page.goto('/');
  await expect(page.locator('[data-subject="computer"] .sp-label')).toHaveText('已学 1/14');
  await expect(page.locator('[data-subject="ai"] .sp-label')).toHaveText('尚未开始');
  await page.goto('/ai/middle/index.html');
  await expect(page.locator('#stage-progress')).toHaveText('已完成 0/4 个主题');
  expect(await page.evaluate(() => localStorage.getItem('kv-ai-middle-progress'))).toBeNull();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-computer-middle-progress'))))
    .toEqual({'binary-pixels': true});
});

test('存储写入被拒绝时实验仍可操作且如实提示', async ({page}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'kv-ai-middle-progress') throw new Error('storage denied');
      return original.call(this, key, value);
    };
  });
  await page.goto('/ai/middle/data-label-quality.html');
  await page.getByRole('radio', {name: /按合成复核记录更正为/}).check();
  await expect(page.locator('#group-a-prediction')).toHaveText('预测类别甲');
  await expect(page.locator('#progress-status')).toContainText('进度未能保存');
  expect(await page.evaluate(() => localStorage.getItem('kv-ai-middle-progress'))).toBeNull();
});

test('320px 窄屏下原生键盘控件和结果均可用且无横向溢出', async ({page}) => {
  await page.setViewportSize({width: 320, height: 800});
  await page.goto('/ai/middle/data-label-quality.html');
  const keep = page.getByRole('radio', {name: /沿用录入标签/});
  const correct = page.getByRole('radio', {name: /按合成复核记录更正为/});
  const exclude = page.getByRole('radio', {name: /暂不纳入/});
  await expect(keep).toBeVisible();
  await expect(correct).toBeVisible();
  await expect(exclude).toBeVisible();
  await expect(page.locator('#group-a-prediction')).toBeVisible();
  await keep.focus();
  await page.keyboard.press('ArrowDown');
  await expect(correct).toBeChecked();
  await expect(page.locator('#group-a-prediction')).toHaveText('预测类别甲');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
