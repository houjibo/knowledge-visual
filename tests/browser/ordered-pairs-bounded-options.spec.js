const {test, expect} = require('@playwright/test');
const url = '/math/topics/ordered-pairs/index.html';

test('随机值持续重复时低坐标挑战题仍有限完成且可作答', async ({page}) => {
  test.setTimeout(6000);
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('.mode-tab[data-mode="challenge"]').click();
  await page.locator('#challenge-start').click({timeout: 2500});

  await expect(page.locator('#challenge-question')).toHaveText('数对 (1, 1) 表示哪个位置？');
  const options = page.locator('#challenge-options button');
  await expect(options).toHaveCount(4);
  const labels = await options.allTextContents();
  expect(new Set(labels).size).toBe(4);
  await page.getByRole('button', {name: '第1列第1行', exact: true}).click();
  await expect(page.locator('#challenge-score')).toHaveText('1');
});

test('高坐标反向题提供四个不同数对并可在窄屏答题', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0.999999; });
  await page.goto(url);
  await page.locator('.mode-tab[data-mode="challenge"]').click();
  await page.locator('#challenge-start').click();

  await expect(page.locator('#challenge-question')).toHaveText('第5列第5行用数对怎么表示？');
  const options = page.locator('#challenge-options button');
  await expect(options).toHaveCount(4);
  const labels = await options.allTextContents();
  expect(new Set(labels).size).toBe(4);
  await page.getByRole('button', {name: '(5, 5)', exact: true}).click();
  await expect(page.locator('#challenge-score')).toHaveText('1');

  await page.setViewportSize({width: 320, height: 844});
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
