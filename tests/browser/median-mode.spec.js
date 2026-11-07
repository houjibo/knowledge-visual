const {test, expect} = require('@playwright/test');

for (const random of [0, .999999]) {
  test(`固定随机值 ${random} 可完成中位数和唯一众数练习`, async ({page}) => {
    await page.addInitScript(value => { Math.random = () => value; }, random);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/math/topics/median-and-mode/index.html');
    await page.locator('.mode-tab[data-mode="median"]').click();
    const medianArea = page.locator('#median-area');
    const data = (await medianArea.locator('.data-item').allTextContents()).map(Number).sort((a,b) => a-b);
    const mid = Math.floor(data.length / 2);
    const median = data.length % 2 ? data[mid] : (data[mid - 1] + data[mid]) / 2;
    const medianOptions = medianArea.locator('.opt-btn');
    await expect(medianOptions).toHaveCount(4);
    expect(new Set(await medianOptions.allTextContents()).size).toBe(4);
    await medianOptions.filter({hasText: new RegExp(`^${median}$`)}).click();
    await expect(page.locator('#median-correct')).toHaveText('1');
    await expect(medianOptions.first()).toBeDisabled();
    await page.locator('.mode-tab[data-mode="mode"]').click();
    const area = page.locator('#mode-area');
    const values = (await area.locator('.data-item').allTextContents()).map(Number);
    const counts = new Map();
    for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
    const max = Math.max(...counts.values());
    const modes = [...counts].filter(([, count]) => count === max).map(([value]) => value);
    expect(modes).toHaveLength(1);
    expect(max).toBeGreaterThan(1);
    const options = area.locator('.opt-btn');
    await expect(options).toHaveCount(4);
    expect(new Set(await options.allTextContents()).size).toBe(4);
    await options.filter({hasText: new RegExp(`^${modes[0]}$`)}).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#mode-correct')).toHaveText('1');
    await expect(options.first()).toBeDisabled();
    expect(errors).toEqual([]);
  });
}

test('固定随机值上限时挑战可生成唯一众数并计分', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => .999999; });
  await page.goto('/math/topics/median-and-mode/index.html');
  await page.locator('.mode-tab[data-mode="challenge"]').click();
  await page.locator('#challenge-start').click();
  await expect(page.locator('#ch-question')).toContainText('众数');
  const values = (await page.locator('#ch-question .challenge-num').allTextContents()).map(Number);
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  const max = Math.max(...counts.values());
  const modes = [...counts].filter(([, count]) => count === max).map(([value]) => value);
  expect(modes).toHaveLength(1);
  const options = page.locator('#ch-question .opt-btn');
  await expect(options).toHaveCount(4);
  expect(new Set(await options.allTextContents()).size).toBe(4);
  await options.filter({hasText: new RegExp(`^${modes[0]}$`)}).click();
  await expect(page.locator('#ch-score')).toHaveText('1');
  await expect(options.first()).toBeDisabled();
});

test('固定随机值下限时挑战可生成中位数题并计分', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto('/math/topics/median-and-mode/index.html');
  await page.locator('.mode-tab[data-mode="challenge"]').click();
  await page.locator('#challenge-start').click();
  await expect(page.locator('#ch-question')).toContainText('中位数');
  const options = page.locator('#ch-question .opt-btn');
  await expect(options).toHaveCount(4);
  expect(new Set(await options.allTextContents()).size).toBe(4);
  await options.filter({hasText: /^1$/}).click();
  await expect(page.locator('#ch-score')).toHaveText('1');
});
