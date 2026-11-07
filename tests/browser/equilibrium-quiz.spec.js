const {test, expect} = require('@playwright/test');

test('化学平衡练习按题计分，错题可重试并可完成', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/chemistry/uni/equilibrium.html');
  const tab = page.locator('.tab[data-tab="3"]');
  await tab.focus();
  await page.keyboard.press('Enter');
  await expect(tab).toHaveAttribute('aria-pressed', 'true');
  const options = page.locator('#q3opts button');
  await options.nth(1).focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#q3score')).toContainText('1/5');
  for (let i = 0; i < 4; i++) {
    await page.locator('#q3next').click();
    await page.locator('#q3prev').click();
    await options.nth(1).click();
  }
  await expect(page.locator('#q3score')).toContainText('1/5');
  await page.locator('#q3next').click();
  await options.nth(1).click();
  await expect(page.locator('#q3fb')).toContainText('错误');
  await page.locator('#q3next').click();
  await page.locator('#q3prev').click();
  await expect(page.locator('#q3fb')).toContainText('错误');
  await options.nth(0).click();
  await expect(page.locator('#q3score')).toContainText('2/5');
  for (const answer of [1, 1, 1]) {
    await page.locator('#q3next').click();
    await options.nth(answer).click();
  }
  await expect(page.locator('#q3score')).toContainText('5/5');
  await expect(page.locator('#done-mark')).toContainText('已完成');
  await page.reload();
  await expect(page.locator('#done-mark')).toContainText('已完成');
  expect(errors).toEqual([]);
});
