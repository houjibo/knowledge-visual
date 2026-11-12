const {test, expect} = require('@playwright/test');

const pagePath = '/ai/middle/data-minimization.html';
const initialRecommendation = '11–13 岁 · 图文探索读物《太阳系观察手册》';

test('推荐只依赖年龄范围和兴趣，字段选择不保存也不发送', async ({page}) => {
  const errors = [];
  const externalRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:4183') externalRequests.push(request.url());
  });
  await page.goto(pagePath);

  await expect(page.getByRole('heading', {name: '信息最小化实验室'})).toBeVisible();
  await expect(page.getByText('请不要输入任何真实个人信息。', {exact: false})).toBeVisible();
  await expect(page.locator('#extra-fields input[type="checkbox"]')).toHaveCount(5);
  await expect(page.locator('input:not([type="checkbox"])')).toHaveCount(0);
  await expect(page.locator('#field-count')).toHaveText('当前计划收集 7 项：2 项用于推荐，5 项不会改变推荐结果。');
  await expect(page.locator('#recommendation-output')).toHaveText(initialRecommendation);

  await page.locator('#age-band').selectOption('14-16');
  await page.locator('#interest').selectOption('plants');
  await expect(page.locator('#recommendation-output')).toHaveText('14–16 岁 · 专题科普读物《植物观察手册》');
  await expect(page.locator('#comparison-status')).toContainText('兴趣主题改变后');
  await page.locator('#field-name').uncheck();
  await expect(page.locator('#field-count')).toHaveText('当前计划收集 6 项：2 项用于推荐，4 项不会改变推荐结果。');
  await expect(page.locator('#recommendation-output')).toHaveText('14–16 岁 · 专题科普读物《植物观察手册》');
  expect(await page.evaluate(() => localStorage.getItem('kv-ai-middle-progress'))).toBeNull();

  await page.reload();
  await expect(page.locator('#field-name')).toBeChecked();
  expect(externalRequests).toEqual([]);
  expect(errors).toEqual([]);
  await expect(page.getByRole('link', {name: /中华人民共和国个人信息保护法/})).toHaveAttribute('href', 'https://www.cac.gov.cn/2021-08/20/c_1631050028355286.htm');
  await expect(page.getByRole('link', {name: /UNICEF/})).toHaveAttribute('href', 'https://www.unicef.org/parenting/child-care/online-privacy');
});

test('逐项移除五个额外字段，推荐保持不变并完成本机进度', async ({page}) => {
  await page.goto(pagePath);
  const extras = page.locator('#extra-fields input[type="checkbox"]');
  const expected = await page.locator('#recommendation-output').textContent();
  for (let i = 0; i < await extras.count(); i++) {
    const input = extras.nth(i);
    const label = await input.evaluate(element => element.labels[0].innerText.trim().split('\n')[0]);
    await input.uncheck();
    await expect(input).not.toBeChecked();
    await expect(page.locator('#recommendation-output')).toHaveText(expected);
    await expect(page.locator('#comparison-status')).toContainText(`已移除「${label}」。 推荐结果保持不变`);
  }

  await expect(page.locator('#field-count')).toHaveText('当前计划收集 2 项：2 项用于推荐，0 项不会改变推荐结果。');
  await expect(page.locator('#completion-status')).toContainText('已移除全部 5 项额外字段');
  await expect(page.locator('#progress-status')).toContainText('已在本机记录此主题');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-ai-middle-progress'))))
    .toEqual({'data-minimization': true});

  await page.goto('/ai/middle/index.html');
  await expect(page.locator('#stage-progress')).toHaveText('本机已记录完成 1/4 个主题。');
  await expect(page.locator('[data-topic-slug="data-minimization"] [data-completion]')).toHaveText('✓ 已完成');
  await page.goto('/');
  await expect(page.locator('[data-subject="ai"] .sp-label')).toHaveText('已学 1/9');
});

test('存储被拒绝时仍能完成练习并如实提示', async ({page}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'kv-ai-middle-progress') throw new Error('storage denied');
      return original.call(this, key, value);
    };
  });
  await page.goto(pagePath);
  for (const input of await page.locator('#extra-fields input[type="checkbox"]').all()) await input.uncheck();
  await expect(page.locator('#completion-status')).toContainText('已移除全部 5 项额外字段');
  await expect(page.locator('#progress-status')).toContainText('本机进度未能保存');
  expect(await page.evaluate(() => localStorage.getItem('kv-ai-middle-progress'))).toBeNull();

});

test('损坏的进度不阻止练习且不会被覆盖', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('kv-ai-middle-progress', '{broken'));
  await page.goto(pagePath);
  await expect(page.locator('#progress-status')).toContainText('本机进度暂不可用');
  for (const input of await page.locator('#extra-fields input[type="checkbox"]').all()) await input.uncheck();
  await expect(page.locator('#progress-status')).toContainText('本机进度未能保存');
  expect(await page.evaluate(() => localStorage.getItem('kv-ai-middle-progress'))).toBe('{broken');
});

test('键盘可移除字段，320px 下完整练习无横向溢出', async ({page}) => {
  await page.setViewportSize({width: 320, height: 800});
  await page.goto(pagePath);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await expect(page.getByRole('heading', {name: '信息最小化实验室'})).toBeVisible();
  const extras = page.locator('#extra-fields input[type="checkbox"]');
  for (let i = 0; i < await extras.count(); i++) {
    await extras.nth(i).focus();
    await page.keyboard.press('Space');
  }
  await expect(page.locator('#completion-status')).toContainText('已移除全部 5 项额外字段');
  await expect(page.locator('#recommendation-output')).toHaveText(initialRecommendation);
  await expect(page.getByRole('link', {name: /UNICEF/})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('初中目录、AI 总进度和隐私关键词搜索包含新主题', async ({page}) => {
  await page.goto('/ai/middle/index.html');
  await expect(page.locator('#stage-progress')).toHaveText('已完成 0/4 个主题');
  await expect(page.locator('[data-topic-slug="data-minimization"]')).toContainText('信息最小化实验室');
  await page.goto('/');
  await expect(page.locator('.subject-card[href="ai/index.html"]')).toContainText('9 个知识点');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('ai');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('middle');
  await page.getByRole('searchbox', {name: '关键词'}).fill('个人信息');
  const result = page.locator('#site-results a[href="ai/middle/data-minimization.html"]');
  await expect(result).toBeVisible();
  await expect(result).toContainText('初中');
  await result.click();
  await expect(page).toHaveURL(/\/ai\/middle\/data-minimization\.html$/);
});
