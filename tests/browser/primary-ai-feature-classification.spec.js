const {test, expect} = require('@playwright/test');

test('颜色与形状线索产生可复核的预测，揭示标签后持续说明样例已看过', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/ai/primary/feature-classification-lab.html');

  await expect(page.locator('#training-examples li')).toHaveCount(6);
  await expect(page.locator('#test-examples li')).toHaveCount(4);
  await expect(page.locator('#feature-color')).toBeChecked();
  await expect(page.locator('#rule-list')).toContainText('绿色 → 无法判断（苹果 1，香蕉 1）');
  await expect(page.locator('#test-examples')).toContainText('规则预测：香蕉');
  await expect(page.locator('#test-examples')).toContainText('规则预测：还不能判断');
  await expect(page.locator('#test-examples')).not.toContainText('真实标签：');
  await expect(page.locator('#test-summary')).toHaveText('真实标签尚未查看。当前只显示规则预测。');

  await page.getByRole('button', {name: '查看真实标签'}).click();
  await expect(page.locator('#test-summary')).toHaveText('颜色线索：预测正确 2/4，判断错误 1，票数相同而不确定 1。');
  await expect(page.locator('#test-examples')).toContainText('真实标签：苹果；预测错误');
  await expect(page.locator('#test-examples')).toContainText('真实标签：香蕉；票数相同，需要更多样例');
  await expect(page.locator('#seen-warning')).toBeVisible();
  await expect(page.getByRole('button', {name: '真实标签已查看'})).toBeDisabled();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-ai-primary-progress'))))
    .toEqual({'feature-classification-lab': true});

  await page.locator('#feature-color').focus();
  await page.locator('#feature-color').press('ArrowRight');
  await expect(page.locator('#feature-shape')).toBeChecked();
  await expect(page.locator('#test-summary')).toHaveText('形状线索：预测正确 4/4，判断错误 0，票数相同而不确定 0。');
  await expect(page.locator('#seen-warning')).toBeVisible();
  await page.getByRole('button', {name: '恢复颜色线索'}).click();
  await expect(page.locator('#feature-color')).toBeChecked();
  await expect(page.locator('#test-examples')).toContainText('真实标签：');
  expect(errors).toEqual([]);
});

test('本机进度存储被拒绝时分类实验仍可完成', async ({page}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'kv-ai-primary-progress') throw new Error('storage denied');
      return original.call(this, key, value);
    };
  });
  await page.goto('/ai/primary/feature-classification-lab.html');
  await page.getByRole('button', {name: '查看真实标签'}).click();
  await expect(page.locator('#test-summary')).toContainText('颜色线索：预测正确 2/4');
  await expect(page.locator('#progress-status')).toContainText('进度未能保存');
  expect(await page.evaluate(() => localStorage.getItem('kv-ai-primary-progress'))).toBeNull();
});

test('小学 AI 目录、首页搜索和进度统计可以直达新主题', async ({page}) => {
  await page.goto('/ai/primary/index.html');
  await expect(page.locator('#stage-progress')).toContainText('已完成 0/1');
  await page.goto('/');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('ai');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('primary');
  await page.getByRole('searchbox', {name: '关键词'}).fill('线索分类');
  const result = page.locator('#site-results a[href="ai/primary/feature-classification-lab.html"]');
  await expect(result).toBeVisible();
  await expect(result).toContainText('人工智能 · 小学');
  await result.click();
  await page.getByRole('button', {name: '查看真实标签'}).click();
  await page.goto('/ai/primary/index.html');
  await expect(page.locator('#stage-progress')).toContainText('本机已记录完成 1/1');
  await expect(page.locator('[data-topic-slug="feature-classification-lab"] [data-completion]'))
    .toHaveText('✓ 已完成');
  await page.goto('/');
  await expect(page.locator('[data-subject="ai"] .sp-label')).toContainText('已学 1/8');
});

test('小学人工智能主题在 320px 下无横向溢出且主要控件可见', async ({page}) => {
  await page.setViewportSize({width: 320, height: 760});
  await page.goto('/ai/primary/feature-classification-lab.html');
  await expect(page.getByRole('radio', {name: '颜色'})).toBeVisible();
  await expect(page.getByRole('radio', {name: '形状'})).toBeVisible();
  await expect(page.getByRole('button', {name: '查看真实标签'})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
