const {test, expect} = require('@playwright/test');

const url = '/math/topics/circle/index.html';
const cases = [
  {type: 1, typeRoll: 0.05, name: '已知半径求周长'},
  {type: 2, typeRoll: 0.25, name: '已知直径求面积'},
  {type: 3, typeRoll: 0.45, name: '已知周长求半径'},
  {type: 4, typeRoll: 0.65, name: '半圆周长'},
  {type: 5, typeRoll: 0.85, name: '圆环面积'},
];

function answerFor(type, problem) {
  let answer;
  if (type === 1) {
    const radius = Number(problem.match(/半径 r = (\d+)/)[1]);
    answer = 2 * 3.14 * radius;
  } else if (type === 2) {
    const diameter = Number(problem.match(/直径 d = (\d+)/)[1]);
    answer = 3.14 * (diameter / 2) ** 2;
  } else if (type === 3) {
    const circumference = Number(problem.match(/圆的周长 = ([\d.]+)/)[1]);
    answer = circumference / 6.28;
  } else if (type === 4) {
    const radius = Number(problem.match(/半径 r = (\d+)，半圆的周长/)[1]);
    answer = 3.14 * radius + 2 * radius;
  } else {
    const [, outerRadius, innerRadius] = problem.match(/外圆半径 (\d+)，内圆半径 (\d+)/);
    answer = 3.14 * (Number(outerRadius) ** 2 - Number(innerRadius) ** 2);
  }
  return type === 3 ? Math.round(answer) : Number(answer.toFixed(2));
}

for (const {type, typeRoll, name} of cases) {
  for (const {radiusRoll, radiusName} of [
    {radiusRoll: 0, radiusName: '最小半径'},
    {radiusRoll: 0.999999, radiusName: '最大半径'},
  ]) {
    test(`固定随机序列下${name}（${radiusName}）有限生成四个唯一答案`, async ({page}) => {
      await page.addInitScript(({typeValue, radiusValue, type}) => {
        const sequence = [typeValue, radiusValue];
        if (type === 5) sequence.push(radiusValue);
        let index = 0;
        Math.random = () => sequence[index++] ?? 0.5;
      }, {typeValue: typeRoll, radiusValue: radiusRoll, type});
      await page.goto(url, {timeout: 2500});
      await page.locator('[data-mode="challenge"]').click();

      const problem = await page.locator('#challenge-problem').innerText();
      const expected = answerFor(type, problem);
      const options = page.locator('#challenge-options .challenge-opt');
      await expect(options).toHaveCount(4);
      const values = (await options.allTextContents()).map(text => Number(text.trim()));
      expect(values.every(Number.isFinite)).toBe(true);
      expect(new Set(values).size).toBe(4);
      expect(values.filter(value => value === expected)).toHaveLength(1);

      await options.nth(values.indexOf(expected)).click();
      await expect(page.locator('#streak')).toHaveText('1');
    });
  }
}

test('320px 窄屏挑战选项全部可见且页面不横向溢出', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.addInitScript(() => {
    const sequence = [0.25, 0];
    let index = 0;
    Math.random = () => sequence[index++] ?? 0.5;
  });
  await page.goto(url, {timeout: 2500});
  await page.locator('[data-mode="challenge"]').click();
  const options = page.locator('#challenge-options .challenge-opt');
  await expect(options).toHaveCount(4);
  await expect(options.first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
