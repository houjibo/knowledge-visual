const { test, expect } = require('@playwright/test');

const url = '/math/topics/tree-planting/index.html';
const randomValues = [0, 0.5, 0.999999];

async function readQuiz(page) {
  const question = await page.locator('#quizQuestion').innerText();
  const match = question.match(/总长\s*(\d+)\s*米[，,]\s*每隔\s*(\d+)\s*米/u);
  if (!match) throw new Error(`无法解析植树题：${question}`);

  const length = Number(match[1]);
  const distance = Number(match[2]);
  const intervals = length / distance;
  if (!Number.isInteger(intervals)) throw new Error(`题目间隔数不是整数：${question}`);

  const answer = question.includes('两端都种')
    ? intervals + 1
    : question.includes('两端不种')
      ? intervals - 1
      : intervals;
  const options = page.locator('#quizOptions .quiz-opt');
  const values = (await options.evaluateAll(nodes => nodes.map(node => Number(node.dataset.val))));

  expect(values).toHaveLength(4);
  expect(new Set(values).size).toBe(4);
  expect(values.every(value => Number.isInteger(value) && value > 0)).toBe(true);
  expect(values.filter(value => value === answer)).toHaveLength(1);
  expect(values.every(value => Math.abs(value - answer) <= 4)).toBe(true);

  return { answer, options };
}

for (const randomValue of randomValues) {
  test(`固定随机值 ${randomValue} 下植树练习能加载、答题并继续`, async ({ page }) => {
    await page.clock.install();
    await page.addInitScript(value => { Math.random = () => value; }, randomValue);
    const response = await page.goto(url, { timeout: 2500 });
    expect(response.status()).toBe(200);

    await page.locator('.mode-tab[data-mode="quiz"]').click();
    const { answer } = await readQuiz(page);
    await page.locator(`#quizOptions .quiz-opt[data-val="${answer}"]`).click();
    await expect(page.locator('#quizFeedback')).toContainText('答对');
    await expect(page.locator('#quizCorrect')).toHaveText('1');

    await page.clock.fastForward(1500);
    await expect(page.locator('#quizTotal')).toHaveText('2');
    const next = await readQuiz(page);
    expect(next.answer).toBe(answer);
  });
}

for (const [label, sequence, expectedAnswer] of [
  ['最小答案', [0.4, 0, 0, 0], 2],
  ['最大答案', [0, 0, 0.999999, 0], 16]
]) {
  test(`${label}边界仍能生成互异正整数选项`, async ({ page }) => {
    await page.addInitScript(values => {
      let index = 0;
      Math.random = () => values[index++] ?? 0.4;
    }, sequence);
    const response = await page.goto(url, { timeout: 2500 });
    expect(response.status()).toBe(200);
    await page.locator('.mode-tab[data-mode="quiz"]').click();
    const { answer } = await readQuiz(page);
    expect(answer).toBe(expectedAnswer);
  });
}

test('320px 窄屏下植树练习选项保持可见', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.addInitScript(() => { Math.random = () => 0.999999; });
  await page.goto(url, { timeout: 2500 });
  await page.locator('.mode-tab[data-mode="quiz"]').click();

  const boxes = await page.locator('#quizOptions .quiz-opt').evaluateAll(nodes => nodes.map(node => {
    const box = node.getBoundingClientRect();
    return { left: box.left, right: box.right, height: box.height };
  }));
  expect(boxes).toHaveLength(4);
  for (const box of boxes) {
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(320);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
});
