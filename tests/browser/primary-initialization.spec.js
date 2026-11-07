const {test, expect} = require('@playwright/test');

async function observeErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  return errors;
}

test('负数主题初始化温度演示', async ({page}) => {
  const errors = await observeErrors(page);
  await page.goto('/math/topics/negative-numbers/index.html');
  await expect(page.locator('#temp-slider')).toBeVisible();
  await expect(page.locator('#temp-label')).toContainText('零下');
  expect(errors).toEqual([]);
});

test('序数主题完成初始化并可打开填空', async ({page}) => {
  const errors = await observeErrors(page);
  await page.goto('/math/topics/ordinal-numbers/index.html');
  await expect(page.locator('#learnItems .item-card').first()).toBeVisible();
  await expect(page.locator('#fillItems .item-card').first()).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('平均分边界题目生成有效选项且可以答对', async ({page}) => {
  const errors = await observeErrors(page);
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto('/math/topics/equal-sharing/index.html');
  await page.locator('.mode-tab[data-mode="share"]').click();
  const options = page.locator('#share-options .share-opt');
  await expect(options).toHaveCount(4);
  expect(new Set(await options.allTextContents()).size).toBe(4);
  await page.locator('#share-options .share-opt[data-value="2"]').click();
  await expect(page.locator('#share-feedback')).toContainText('答对');
  await page.locator('.mode-tab[data-mode="fill"]').click();
  const fillOptions = page.locator('#fill-options .fill-opt');
  await expect(fillOptions).toHaveCount(4);
  expect(new Set(await fillOptions.allTextContents()).size).toBe(4);
  await page.locator('#fill-options .fill-opt[data-value="2"]').click();
  await expect(page.locator('#fill-feedback')).toContainText('答对');
  expect(errors).toEqual([]);
});

test('质量换算 500 克生成四个选项且 0.5 千克正确', async ({page}) => {
  const errors = await observeErrors(page);
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto('/math/topics/weight-units/index.html');
  await page.locator('.mode-tab[data-mode="convert"]').click();
  await expect(page.locator('.convert-problem')).toContainText('500 克');
  const options = page.locator('#convert-opts .convert-opt');
  await expect(options).toHaveCount(4);
  expect(new Set(await options.allTextContents()).size).toBe(4);
  await page.locator('.convert-opt[data-val="0.5"]').click();
  await expect(page.locator('#convert-result')).toContainText('答对');
  expect(errors).toEqual([]);
});
