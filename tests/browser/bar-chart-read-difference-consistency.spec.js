const {test, expect} = require('@playwright/test');
const url = '/math/topics/bar-charts/index.html';

test('相等数据的差值读图题题意对称、选项齐全且可作答', async ({page}) => {
  await page.goto(url);
  await page.evaluate(() => {
    window.generateReadData = () => ({
      title: '相同数量测试',
      items: ['苹果', '香蕉', '橘子'],
      values: [4, 4, 4],
      unit: '人',
      count: 3
    });
    Math.random = () => 0.6;
  });
  await page.locator('.mode-tab[data-mode="read"]').click();

  const options = page.locator('#read-options .read-opt');
  await expect(options).toHaveCount(4);
  const labels = await options.allTextContents();
  expect(new Set(labels).size).toBe(4);
  await expect(page.locator('#read-question')).toContainText('相差');
  await page.getByRole('button', {name: '0', exact: true}).click();
  await expect(page.locator('#read-feedback')).toContainText('答对了');
  await expect(page.locator('#read-correct')).toHaveText('1');
});
