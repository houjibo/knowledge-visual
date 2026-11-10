const {test, expect} = require('@playwright/test');

const url = '/math/topics/quadrilaterals/index.html';

test('固定随机值下长方形挑战有限生成并提供唯一答案', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url, {waitUntil: 'domcontentloaded'});
  await page.locator('.mode-tab[data-mode="challenge"]').click({timeout: 2500});

  const question = await page.locator('#chProblem').innerText();
  const match = question.match(/长方形的长是 (\d+)厘米，宽是 (\d+)厘米/);
  expect(match).not.toBeNull();
  const [length, width] = match.slice(1).map(Number);
  expect(length).not.toBe(width);

  const options = await page.locator('#chOptions .challenge-opt').allTextContents();
  expect(options).toHaveLength(4);
  expect(new Set(options).size).toBe(4);
  const correct = `${2 * (length + width)}厘米`;
  expect(options.filter(option => option === correct)).toHaveLength(1);
  await page.locator('#chOptions .challenge-opt').filter({hasText: new RegExp(`^${correct}$`)}).click();
  await expect(page.locator('#chResult')).toContainText('回答正确');
  expect(errors).toEqual([]);
});

for (const seed of [0.5, 0.999999]) {
  test(`固定随机值 ${seed} 下其他题型仍能生成四个互异选项`, async ({page}) => {
    await page.addInitScript(value => { Math.random = () => value; }, seed);
    await page.goto(url, {waitUntil: 'domcontentloaded'});
    await page.locator('.mode-tab[data-mode="challenge"]').click({timeout: 2500});
    await expect(page.locator('#chProblem')).not.toBeEmpty();
    const options = await page.locator('#chOptions .challenge-opt').allTextContents();
    expect(options).toHaveLength(4);
    expect(new Set(options).size).toBe(4);
  });
}

test('八类挑战生成器在重复随机值下都给出四个互异选项', async ({page}) => {
  await page.goto(url, {waitUntil: 'domcontentloaded'});
  const questions = await page.evaluate(() => {
    const indexValue = index => (index + 0.1) / 8;
    const intValue = (value, min, max) => (value - min + 0.01) / (max - min + 1);
    const parameterValues = [
      [0, 0],
      [intValue(4, 2, 12)],
      [0, 0],
      [intValue(4, 2, 10)],
      [intValue(6, 2, 10), intValue(6, 2, 10)],
      [], [], []
    ];
    return parameterValues.map((params, index) => {
      const sequence = [indexValue(index), ...params];
      let cursor = 0;
      Math.random = () => sequence[cursor++] ?? 0;
      const question = genChallengeQuestion();
      return {
        text: question.q,
        options: question.opts.map(String),
        answer: String(question.opts[question.ans])
      };
    });
  });

  expect(questions).toHaveLength(8);
  for (const question of questions) {
    expect(question.options, question.text).toHaveLength(4);
    expect(new Set(question.options).size, question.text).toBe(4);
    expect(question.options.filter(option => option === question.answer), question.text).toHaveLength(1);
  }
  expect(questions[1].options).toContain('16厘米');
  expect(questions[1].options).toHaveLength(4);
});
