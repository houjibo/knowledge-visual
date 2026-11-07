const {test, expect} = require('@playwright/test');

test('百分数挑战保留 1/8 的小数，反馈在作答后出现', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto('/math/topics/percentage/index.html');
  await page.locator('.mode-tab[data-mode="challenge"]').click();
  await page.locator('#challenge-options button').first().click();
  await page.evaluate(() => {
    Random.int = (min, max) => min === 1 && max === 5 ? 1 : min;
    Random.pick = list => list.includes(8) && list.includes(50) ? 8 : list[0];
  });
  await page.locator('#challenge-next').click();
  await expect(page.locator('#challenge-problem')).toHaveText('1/8 化成百分数 = ?');
  await expect(page.locator('#challenge-feedback')).toHaveText('');
  const options = page.locator('#challenge-options button');
  await expect(options).toHaveCount(4);
  expect(new Set(await options.allTextContents()).size).toBe(4);
  const correct = options.getByText('12.5%', {exact: true});
  await correct.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#challenge-feedback')).toContainText('正确');
  await expect(page.locator('#challenge-feedback')).toContainText('0.125');
  await expect(correct).toBeDisabled();
  await expect(page.locator('#challenge-next')).toBeEnabled();
});

test('增长题只生成增长并解释取整，答错后可查看解析', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto('/math/topics/percentage/index.html');
  await page.locator('.mode-tab[data-mode="challenge"]').click();
  await page.locator('#challenge-options button').first().click();
  await page.evaluate(() => {
    Random.int = (min, max) => min === 1 && max === 5 ? 4 : min === 20 ? 79 : min;
  });
  await page.locator('#challenge-next').click();
  await expect(page.locator('#challenge-problem')).toContainText('从 79 增加到 80');
  await expect(page.locator('#challenge-problem')).toContainText('四舍五入到整数');
  await expect(page.locator('#challenge-feedback')).toHaveText('');
  const options = page.locator('#challenge-options button');
  const values = await options.allTextContents();
  expect(new Set(values).size).toBe(4);
  await options.filter({hasText: /^(?!1%$)/}).first().click();
  await expect(page.locator('#challenge-feedback')).toContainText('正确答案：1%');
  await expect(page.locator('#challenge-feedback')).toContainText('79');
  await expect(options.first()).toBeDisabled();
});
