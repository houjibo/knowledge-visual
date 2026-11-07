const {test, expect} = require('@playwright/test');

test.beforeEach(async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
});

test('固定随机值可生成比值题，读写比拒绝无效输入并接受等价比', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/math/topics/understanding-ratio/index.html');
  await page.locator('.mode-tab[data-mode="value"]').click();
  const options = page.locator('#val-options button');
  await expect(options).toHaveCount(4);
  expect(new Set(await options.allTextContents()).size).toBe(4);
  await options.filter({hasText: /^1$/}).click();
  await expect(options.filter({hasText: /^1$/})).toHaveClass(/correct/);
  await expect(options.first()).toBeDisabled();
  await page.locator('.mode-tab[data-mode="readwrite"]').click();
  await page.locator('#rw-front').fill('-2');
  await page.locator('#rw-back').fill('-3');
  await page.locator('#rw-check').click();
  await expect(page.locator('#rw-hint')).toContainText('大于零的整数');
  await page.locator('#rw-front').fill('2.5');
  await page.locator('#rw-back').fill('3');
  await page.locator('#rw-check').click();
  await expect(page.locator('#rw-hint')).toContainText('大于零的整数');
  await page.locator('#rw-front').fill('4');
  await page.locator('#rw-back').fill('6');
  await page.locator('#rw-check').click();
  await expect(page.locator('#rw-hint')).toContainText('正确');
  const before = await page.evaluate(() => streak);
  await page.locator('#rw-check').click();
  expect(await page.evaluate(() => streak)).toBe(before);
  await page.locator('#rw-next').click();
  await expect(page.locator('#rw-front')).toHaveValue('');
  expect(errors).toEqual([]);
});

test('应用题接受未化简的等价比，挑战题无歧义', async ({page}) => {
  await page.goto('/math/topics/understanding-ratio/index.html');
  await page.locator('.mode-tab[data-mode="apply"]').click();
  await expect(page.locator('#apply-problem')).toContainText('15');
  const equivalent = page.locator('#apply-options button').getByText('15:10', {exact: true});
  await equivalent.click();
  await expect(equivalent).toHaveClass(/correct/);
  await expect(equivalent).toBeDisabled();
  await page.evaluate(() => { Random.pick = values => values[1]; });
  await page.locator('.mode-tab[data-mode="challenge"]').click();
  await expect(page.locator('#chal-problem')).toHaveText('3:2 的比值是多少？');
  const answer = page.locator('#chal-options button').getByText('1.5', {exact: true});
  await answer.click();
  await expect(answer).toHaveClass(/correct/);
});
