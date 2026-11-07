const {test, expect} = require('@playwright/test');

test('随机空格仍能生成图形并可比较，点线示例可键盘操作', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => .999999; });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/math/topics/understanding-area/index.html');
  const line = page.getByRole('button', {name: /数学中的线段/});
  await line.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#surface-feedback')).toContainText('理想化');
  await expect(page.locator('#surface-feedback')).toContainText('真实物体有表面');
  await page.locator('.mode-tab[data-mode="compare"]').click();
  const shapes = page.locator('.compare-shape');
  await expect(shapes).toHaveCount(2);
  await expect(shapes.nth(0).locator('.filled')).toHaveCount(2);
  await expect(shapes.nth(1).locator('.filled')).toHaveCount(2);
  await page.locator('.compare-opt[data-answer="equal"]').click();
  await expect(page.locator('#cmp-score')).toHaveText('✅1');
  await expect(page.locator('.compare-opt[data-answer="equal"]')).toBeDisabled();
  expect(errors).toEqual([]);
});

test('铺格支持键盘且正确答案只计一次', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto('/math/topics/understanding-area/index.html');
  await page.locator('.mode-tab[data-mode="tile"]').click();
  const cell = page.locator('#tile-grid button.tile-cell').first();
  await cell.focus();
  await page.keyboard.press('Space');
  await expect(cell).toHaveAttribute('aria-pressed', 'true');
  const count = await page.locator('#tile-grid button.tile-cell').count();
  await page.locator('#tile-answer').fill('2.5');
  await page.locator('#btn-check-tile').click();
  await expect(page.locator('#toast')).toContainText('大于零的整数');
  await page.locator('#tile-answer').fill(String(count));
  await page.locator('#btn-check-tile').click();
  await page.locator('#btn-check-tile').click();
  await expect(page.locator('#tile-score')).toHaveText('✅1');
  await page.locator('#btn-next-tile').click();
  await expect(page.locator('#tile-answer')).toHaveValue('');
});
