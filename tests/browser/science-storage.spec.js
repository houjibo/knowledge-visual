const {test, expect} = require('@playwright/test');

for (const invalid of ['null', '[]', '42', '"bad"', '{broken']) {
  test(`科学进度异常数据 ${invalid} 不阻断页面且保留原文`, async ({page}) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/science/index.html');
    await page.evaluate(value => localStorage.setItem('kv-science-progress', value), invalid);
    await page.goto('/science/sink-float.html');
    await expect(page.locator('#sec-learn')).toBeVisible();
    expect(await page.evaluate(() => PageProgress.markDone('sink-float'))).toBe(false);
    expect(await page.evaluate(() => PageProgress.isDone('sink-float'))).toBe(true);
    expect(await page.evaluate(() => localStorage.getItem('kv-science-progress'))).toBe(invalid);
    expect(errors).toEqual([]);
  });
}

test('两个已打开的科学主题顺序写入不互相覆盖', async ({context, page}) => {
  await page.goto('/science/sink-float.html');
  const other = await context.newPage();
  await other.goto('/science/light.html');
  await page.evaluate(() => PageProgress.markDone('sink-float'));
  await other.evaluate(() => PageProgress.markDone('light'));
  await page.goto('/science/index.html');
  await expect(page.locator('a[href="sink-float.html"] .progress-badge')).toHaveCount(1);
  await expect(page.locator('a[href="light.html"] .progress-badge')).toHaveCount(1);
});

test('存储拒绝写入时通关明确提示进度未保存', async ({page}) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('denied'); }; });
  await page.goto('/science/sink-float.html');
  await page.locator('.tab[data-mode="quiz"]').click();
  await page.locator('#quizStart').click();
  for (const answer of [1, 1, 1, 0]) {
    await page.locator('#quizOpts button').nth(answer).click();
    await page.locator('#quizNext').click();
  }
  await page.locator('#quizNext').click();
  await expect(page.locator('#quizResult')).toContainText('4 / 5');
  await expect(page.locator('#done-mark')).toContainText('进度未保存');
  expect(await page.evaluate(() => PageProgress.isDone('sink-float'))).toBe(true);
  await page.reload();
  await expect(page.locator('#done-mark')).toHaveText('');
});

test('存储拒绝读取时科学目录和主题仍可使用', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error('denied'); }; });
  await page.goto('/science/index.html');
  await page.getByRole('link', {name: /沉与浮/}).click();
  await expect(page.locator('#sec-learn')).toBeVisible();
  expect(await page.evaluate(() => PageProgress.markDone('sink-float'))).toBe(false);
  expect(await page.evaluate(() => PageProgress.isDone('sink-float'))).toBe(true);
  expect(errors).toEqual([]);
});
