const {test, expect} = require('@playwright/test');

const url = '/math/topics/compound-charts/index.html';

test('复式统计图总量相等时零差值读图题保留四个唯一选项', async ({page}) => {
  await page.goto(url);
  await page.evaluate(() => {
    const sequence = Array(20).fill(0);
    sequence[10] = 0.5;
    let index = 0;
    Math.random = () => sequence[index++] ?? 0;
  });
  await page.locator('.mode-tab[data-mode="read"]').click();
  await expect(page.locator('#rd-question')).toContainText('总量相差多少？');

  const chartValues = (await page.locator('#rd-bars .read-bar').allTextContents()).map(Number);
  const firstGroupTotal = chartValues.filter((_, index) => index % 2 === 0).reduce((sum, value) => sum + value, 0);
  const secondGroupTotal = chartValues.filter((_, index) => index % 2 === 1).reduce((sum, value) => sum + value, 0);
  const expected = Math.abs(firstGroupTotal - secondGroupTotal);
  expect(expected).toBe(0);

  const options = page.locator('#rd-options .read-opt');
  const labels = await options.allTextContents();
  expect(labels).toHaveLength(4);
  expect(new Set(labels).size).toBe(4);
  for (const label of labels) expect(label).toMatch(/^\d+$/);
  expect(labels.filter(label => label === String(expected))).toHaveLength(1);

  await options.filter({hasText: /^0$/}).click();
  await expect(page.locator('#rd-feedback')).toContainText('答对');
  await expect(page.locator('#rd-correct')).toHaveText('1');
  await page.waitForTimeout(1550);
  await expect(page.locator('#rd-question')).not.toBeEmpty();
  await expect(page.locator('#rd-options .read-opt')).toHaveCount(4);
});
