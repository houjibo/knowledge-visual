const {test, expect} = require('@playwright/test');

test('截止频率上下及光强变化反馈一致', async ({page}) => {
  await page.goto('/physics/uni/photoelectric.html');
  const nu = page.getByRole('slider', {name: '光频率 ν (×10¹⁴ Hz)', exact: true});
  const work = page.getByRole('slider', {name: '逸出功 W₀ (eV)', exact: true});
  const intensity = page.getByRole('slider', {name: '光强档位（示意）', exact: true});
  await nu.fill('4'); await work.fill('3.0');
  await expect(page.locator('#calc-ek')).toHaveText('不适用');
  await expect(page.locator('#calc-u0')).toHaveText('不适用');
  await intensity.fill('10');
  await expect(page.locator('#calc-ek')).toHaveText('不适用');
  await nu.fill('7'); await work.fill('2.3');
  await expect(page.locator('#calc-ek')).toHaveText('0.60');
  await expect(page.locator('#calc-u0')).toHaveText('0.60');
  await intensity.fill('1');
  await expect(page.locator('#calc-ek')).toHaveText('0.60');
  const boundary = await page.evaluate(() => physics(5, 2.068));
  expect(boundary.atThreshold).toBe(true);
  expect(boundary.ek).toBe(0);
  expect(boundary.canEmit).toBe(false);
});

test('练习无发射不显示虚构动能，倍频题有唯一合理结果', async ({page}) => {
  await page.goto('/physics/uni/photoelectric.html');
  await page.locator('[data-mode="practice"]').click();
  await expect(page.locator('#p-ek')).toHaveText('不适用');
  await page.getByRole('slider', {name: '练习光频率 ν (×10¹⁴ Hz)'}).fill('10');
  await expect(page.locator('#p-status')).toContainText('达成');
  await page.locator('[data-mode="quiz"]').click();
  await page.locator('#quiz-next').click();
  await expect(page.locator('#quiz-q')).toContainText('截止频率');
  await page.getByRole('button', {name: 'D. W₀'}).click();
  await expect(page.locator('#quiz-fb')).toContainText('不能以它作为分母');
});
