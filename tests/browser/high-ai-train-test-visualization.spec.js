const {test, expect} = require('@playwright/test');

test('训练集指标先更新，测试集揭示后再调参会持续显示独立性警示', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/ai/high/train-test-generalization.html');

  const threshold = page.getByRole('slider', {name: /分类阈值/});
  await expect(threshold).toHaveValue('8');
  await expect(page.locator('#training-accuracy')).toHaveText('100%');
  await expect(page.locator('#training-count')).toHaveText('正确 8 / 8');
  await expect(page.locator('#test-accuracy')).toHaveText('尚未查看');
  await expect(page.locator('#test-hidden')).toBeVisible();
  await expect(page.locator('#test-results')).toBeHidden();

  await page.getByRole('button', {name: '查看留出测试结果'}).click();
  await expect(page.locator('#test-accuracy')).toHaveText('50%');
  await expect(page.locator('#test-count')).toHaveText('正确 2 / 4');
  await expect(page.locator('#test-results')).toBeVisible();
  await expect(page.locator('#test-results')).toContainText('真实类别 A');
  await expect(page.locator('#test-warning')).toBeHidden();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-ai-high-progress'))))
    .toEqual({'train-test-generalization': true});

  await threshold.focus();
  await threshold.press('ArrowLeft');
  await expect(threshold).toHaveValue('7');
  await expect(page.locator('#training-accuracy')).toHaveText('87.5%');
  await expect(page.locator('#training-count')).toHaveText('正确 7 / 8');
  await expect(page.locator('#test-accuracy')).toHaveText('75%');
  await expect(page.locator('#test-count')).toHaveText('正确 3 / 4');
  await expect(page.locator('#test-warning')).toBeVisible();
  await expect(page.locator('#experiment-feedback')).toContainText('已使用这组测试样本调整规则');

  await page.getByRole('button', {name: '恢复初始阈值'}).click();
  await expect(threshold).toHaveValue('8');
  await expect(page.locator('#test-accuracy')).toHaveText('50%');
  await expect(page.locator('#test-warning')).toBeVisible();
  expect(errors).toEqual([]);
});

test('测试结果可见但人工智能进度存储被拒绝时不阻断实验', async ({page}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'kv-ai-high-progress') throw new Error('storage denied');
      return original.call(this, key, value);
    };
  });
  await page.goto('/ai/high/train-test-generalization.html');
  await page.getByRole('button', {name: '查看留出测试结果'}).click();
  await expect(page.locator('#test-accuracy')).toHaveText('50%');
  await expect(page.locator('#progress-status')).toContainText('进度未能保存');
  expect(await page.evaluate(() => localStorage.getItem('kv-ai-high-progress'))).toBeNull();
});

test('高中人工智能目录能直达训练与测试集实验室并显示独立进度', async ({page}) => {
  await page.goto('/ai/high/index.html');
  await expect(page.locator('#stage-progress')).toContainText('已完成 0/2');
  await page.goto('/');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('ai');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('high');
  await page.getByRole('searchbox', {name: '关键词'}).fill('训练集');
  const result = page.locator('#site-results a[href="ai/high/train-test-generalization.html"]');
  await expect(result).toBeVisible();
  await expect(result).toContainText('人工智能 · 高中');
  await result.click();
  await expect(page).toHaveURL(/ai\/high\/train-test-generalization\.html$/);
  await page.getByRole('button', {name: '查看留出测试结果'}).click();
  await page.goto('/ai/high/index.html');
  await expect(page.locator('#stage-progress')).toContainText('本机已记录完成 1/2');
  await expect(page.locator('[data-topic-slug="train-test-generalization"] [data-completion]'))
    .toHaveText('✓ 已完成');
});
