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

test('四类数值读图题在候选重复时保留正确答案和非负选项', async ({page}) => {
  await page.goto(url);
  const questions = await page.evaluate(() => {
    const shared = {cats: ['类别'], g1name: '甲组', g2name: '乙组'};
    const scenarios = [
      {type: 0, data: {...shared, vals1: [4], vals2: [3]}},
      {type: 1, data: {...shared, vals1: [3], vals2: [3]}},
      {type: 2, data: {...shared, vals1: [3], vals2: [3]}},
      {type: 3, data: {...shared, vals1: [3], vals2: [3]}}
    ];
    return scenarios.map(({type, data}) => {
      const sequence = [0, (type + 0.5) / 4, ...Array(12).fill(0)];
      let index = 0;
      Math.random = () => sequence[index++] ?? 0;
      return {type, ...genReadQuestion(data)};
    });
  });

  for (const question of questions) {
    expect(question.options, `type ${question.type}`).toHaveLength(4);
    expect(new Set(question.options).size, `type ${question.type}`).toBe(4);
    expect(question.options.filter(option => option === question.correct), `type ${question.type}`).toHaveLength(1);
    for (const option of question.options) expect(option).toMatch(/^\d+$/);
  }
});
