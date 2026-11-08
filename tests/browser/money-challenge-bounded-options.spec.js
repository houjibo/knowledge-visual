const { test, expect } = require('@playwright/test');

const url = '/math/topics/money/index.html';
const repeatedRandomCases = [
  { name: '元转角', random: 0.05, question: '1元 = ?角', answer: '10' },
  { name: '角转元', random: 0.2, question: '20角 = ?元', answer: '2' },
  { name: '角转分', random: 0.4, question: '4角 = ?分', answer: '40' },
  { name: '比较金额', random: 0.6, question: '13元与13元相比', answer: '两者相等' },
  { name: '购物找零', random: 0.7, question: '买11元的东西，付20元', answer: '9' },
  { name: '凑钱', random: 0.9, question: '凑出14元', answer: '10元+2元+2元' }
];

for (const scenario of repeatedRandomCases) {
  test(`${scenario.name}在重复随机值下生成唯一选项`, async ({ page }) => {
    await page.addInitScript(value => { Math.random = () => value; }, scenario.random);
    const response = await page.goto(url);
    expect(response.status()).toBe(200);
    await page.locator('.mode-tab[data-mode="challenge"]').click();
    await page.locator('#btn-start-challenge').click();

    await expect(page.locator('#ch-question')).toContainText(scenario.question);
    const options = await page.locator('#ch-options .challenge-opt').allTextContents();
    expect(options).toHaveLength(4);
    expect(new Set(options).size).toBe(4);
    expect(options.filter(option => option === scenario.answer)).toHaveLength(1);

    if (scenario.name === '凑钱') {
      await page.locator('#ch-options .challenge-opt').nth(options.indexOf(scenario.answer)).click();
      await expect(page.locator('#ch-correct')).toHaveText('1');
    }
  });
}

const comparisonCases = [
  { name: '前者较大', random: [0.6, 0.95, 0.05, 0.9], question: '20元与2元相比', answer: '前者大于后者' },
  { name: '前者较小', random: [0.6, 0.05, 0.95, 0.9], question: '2元与20元相比', answer: '前者小于后者' },
  { name: '金额相等', random: [0.6, 0.3, 0.3, 0.9], question: '7元与7元相比', answer: '两者相等' }
];

for (const scenario of comparisonCases) {
  test(`比较题${scenario.name}仅有一个正确关系选项`, async ({ page }) => {
    const response = await page.goto(url);
    expect(response.status()).toBe(200);
    await page.locator('.mode-tab[data-mode="challenge"]').click();
    await page.evaluate(values => {
      let index = 0;
      Math.random = () => values[index++] ?? 0.9;
    }, scenario.random);
    await page.locator('#btn-start-challenge').click();

    await expect(page.locator('#ch-question')).toContainText(scenario.question);
    const options = await page.locator('#ch-options .challenge-opt').allTextContents();
    expect(options).toHaveLength(4);
    expect(new Set(options).size).toBe(4);
    expect(options.filter(option => option === scenario.answer)).toHaveLength(1);
    await page.locator('#ch-options .challenge-opt').nth(options.indexOf(scenario.answer)).click();
    await expect(page.locator('#ch-correct')).toHaveText('1');
  });
}
