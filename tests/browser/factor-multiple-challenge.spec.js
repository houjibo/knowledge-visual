const {test, expect} = require('@playwright/test');
const url = '/math/topics/factors-and-multiples/index.html';

test('六类题目在固定随机值下结束，选项不同且包含答案', async ({page}) => {
  await page.goto(url);
  const questions = await page.evaluate(() => {
    const results = [];
    for (let type = 0; type < 6; type++) {
      const values = [(type + 0.1) / 6];
      Math.random = () => values.length ? values.shift() : 0.999999;
      results.push(generateChallengeProblem());
    }
    return results;
  });
  for (const q of questions) {
    expect(new Set(q.options).size).toBe(q.options.length);
    expect(q.options).toContain(q.answer);
  }
  const [testNum, factorTarget] = questions[1].question.match(/\d+/g).map(Number);
  expect(questions[1].answer).toBe('否');
  expect(factorTarget % testNum).not.toBe(0);
  const multipleBase = Number(questions[3].question.match(/\d+/)[0]);
  expect(questions[3].options.filter(option => option % multipleBase === 0)).toEqual([questions[3].answer]);
  expect(questions[5].question).toContain('最小正倍数');
});

test('答题后按钮不可用，重复提交和超时不增加记录', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="challenge"]').click();
  await page.locator('#startChallenge').click();
  const options = page.locator('#qOptions button');
  await options.getByText('6', {exact: true}).focus();
  await page.keyboard.press('Enter');
  await expect(options.first()).toBeDisabled();
  await page.keyboard.press('Enter');
  await page.evaluate(() => handleTimeout('重复', 6));
  expect(await page.evaluate(() => challengeHistory.length)).toBe(1);
  await expect(page.locator('#qCorrect')).toHaveText('1');
});

test('完整十题正确完成并在刷新后保留进度', async ({page}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
    const original = window.setTimeout;
    window.setTimeout = (fn, delay, ...args) => original(fn, delay === 1500 ? 20 : delay, ...args);
  });
  await page.goto(url);
  await page.locator('[data-mode="challenge"]').click();
  await page.locator('#startChallenge').click();
  for (let i = 1; i <= 10; i++) {
    await expect(page.locator('#qNum')).toHaveText(String(i));
    await page.locator('#qOptions button').getByText('6', {exact: true}).click();
  }
  await expect(page.locator('#resultScore')).toHaveText('答对 10 / 10 题');
  await page.reload();
  expect(await page.evaluate(() => PageProgress.isDone('factors-and-multiples'))).toBe(true);
});
