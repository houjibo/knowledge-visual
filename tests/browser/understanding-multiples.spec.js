const {test, expect} = require('@playwright/test');
const url = '/math/topics/understanding-multiples/index.html';

test('固定随机值页面可加载，摆放数与倍数一致并锁定正确答案', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="build"]').click();
  const input = page.getByLabel('摆放倍数');
  await input.fill('2');
  await expect(page.locator('#build-display .build-group').nth(1).locator('.item')).toHaveCount(2);
  await page.getByRole('button', {name:'增加一个'}).click();
  await expect(input).toHaveValue('3');
  await page.getByRole('button', {name:'减少一个'}).click();
  await expect(input).toHaveValue('2');
  await page.locator('#btn-build-submit').click();
  await expect(page.locator('#build-feedback')).toContainText('太棒了');
  await expect(page.locator('#btn-build-submit')).toBeDisabled();
  await expect(page.locator('#streak')).toHaveText('1');
});

test('大基数不截断输入，挑战答题后锁定并解释乘除关系', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => .999999; });
  await page.goto(url);
  await page.locator('[data-mode="build"]').click();
  const input = page.getByLabel('摆放倍数');
  await expect(input).toHaveAttribute('max', '5');
  await input.fill('6');
  await expect(page.locator('#build-feedback')).toContainText('1～5');
  await expect(page.locator('#build-display .build-group').nth(1).locator('.item')).toHaveCount(4);
  await input.fill('5');
  await expect(page.locator('#build-display .build-group').nth(1).locator('.item')).toHaveCount(20);
  await page.locator('[data-mode="quiz"]').click();
  const options = page.locator('#quiz-options button');
  await expect(options).toHaveCount(4);
  expect(new Set(await options.allTextContents()).size).toBe(4);
  await options.first().click();
  await expect(options.first()).toBeDisabled();
  await expect(page.locator('#quiz-explain')).toContainText('×');
  await expect(page.locator('#quiz-explain')).toContainText('÷');
});

test('应用题每题只计一次，八次独立答对后记录进度', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await expect(page.locator('#learning-progress')).toContainText('累计答对 8 题');
  await page.locator('[data-mode="word"]').click();
  for (let i = 1; i <= 8; i++) {
    await page.getByLabel('应用题答案').fill('4');
    await page.locator('#btn-word-submit').click();
    await expect(page.locator('#btn-word-submit')).toBeDisabled();
    expect(await page.evaluate(() => PageProgress.isDone('understanding-multiples'))).toBe(i === 8);
    if (i < 8) await page.locator('#btn-word-next').click();
  }
  await expect(page.locator('#learning-progress')).toContainText('已完成');
  await page.reload();
  await expect(page.locator('#learning-progress')).toContainText('已完成');
  expect(await page.evaluate(() => PageProgress.isDone('understanding-multiples'))).toBe(true);
});


test('存储写入失败时提示已达标但未保存，刷新不显示完成', async ({page}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
    Storage.prototype.setItem = () => { throw new Error('denied'); };
  });
  await page.goto(url);
  await page.locator('[data-mode="word"]').click();
  for (let i = 0; i < 8; i++) {
    await page.getByLabel('应用题答案').fill('4');
    await page.locator('#btn-word-submit').click();
    if (i < 7) await page.locator('#btn-word-next').click();
  }
  await expect(page.locator('#learning-progress')).toContainText('已达标，但进度未保存');
  await page.reload();
  await expect(page.locator('#learning-progress')).toContainText('本次已答对 0 题');
});

test('保留旧格式完成记录', async ({page}) => {
  await page.goto(url);
  await page.evaluate(() => localStorage.setItem('kv-math-progress', JSON.stringify({'understanding-multiples': 1})));
  await page.reload();
  await expect(page.locator('#learning-progress')).toContainText('已完成');
});

test('进度重试保存后同步页面状态', async ({page}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('denied'); };
  });
  await page.goto(url);
  await page.locator('[data-mode="word"]').click();
  for (let i = 0; i < 8; i++) {
    await page.getByLabel('应用题答案').fill('4');
    await page.locator('#btn-word-submit').click();
    if (i < 7) await page.locator('#btn-word-next').click();
  }
  await expect(page.locator('#learning-progress')).toContainText('进度未保存');
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
  await page.locator('#math-progress-save-notice').getByRole('button', {name: '重试保存'}).click();
  await expect(page.locator('#learning-progress')).toContainText('已完成');
  await page.reload();
  await expect(page.locator('#learning-progress')).toContainText('已完成');
});
