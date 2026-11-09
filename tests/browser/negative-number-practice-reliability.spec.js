const { test, expect } = require('@playwright/test');

const url = '/math/topics/negative-numbers/index.html';
const randomValues = [0, 0.5, 0.625, 0.999999];

async function readComparison(page) {
  const left = Number((await page.locator('#cmp-left').innerText()).replace('+', ''));
  const right = Number((await page.locator('#cmp-right').innerText()).replace('+', ''));
  expect(Number.isInteger(left)).toBe(true);
  expect(Number.isInteger(right)).toBe(true);
  expect(right).not.toBe(left);

  const correct = left > right ? '>' : left < right ? '<' : '=';
  return { left, right, correct };
}

async function readNumberLineQuestion(page) {
  const question = await page.locator('#nl-question').innerText();
  const answerMatch = question.match(/找到\s*([+-]?\d+)/u);
  expect(answerMatch).not.toBeNull();
  const answer = Number(answerMatch[1]);
  const values = await page.locator('#nl-controls .nl-btn').evaluateAll(buttons =>
    buttons.map(button => Number(button.dataset.val)));

  expect(values).toHaveLength(4);
  expect(new Set(values).size).toBe(4);
  expect(values.every(value => Number.isInteger(value) && value >= -10 && value <= 10)).toBe(true);
  expect(values.filter(value => value === answer)).toHaveLength(1);
  return { question, answer, values };
}

for (const randomValue of randomValues) {
  test(`固定随机值 ${randomValue} 下负数比较和数轴练习可完成`, async ({ page }) => {
    await page.clock.install();
    await page.addInitScript(value => { Math.random = () => value; }, randomValue);
    const response = await page.goto(url, { timeout: 2500 });
    expect(response.status()).toBe(200);

    await page.locator('.mode-tab[data-mode="compare"]').click();
    const first = await readComparison(page);
    await page.locator(`.compare-opt[data-val="${first.correct}"]`).click();
    await expect(page.locator('#cmp-explain')).toContainText('正确');
    await expect(page.locator('#compare-correct')).toHaveText('1');
    await page.clock.fastForward(1200);
    const next = await readComparison(page);
    expect(next.left).not.toBe(next.right);
    await expect(page.locator('#compare-correct')).toHaveText('1');

    await page.locator('.mode-tab[data-mode="numberline"]').click();
    const numberLine = await readNumberLineQuestion(page);
    await page.locator(`#nl-controls .nl-btn[data-val="${numberLine.answer}"]`).click();
    await page.locator('#nl-check-btn').click();
    await expect(page.locator('#nl-feedback')).toContainText('正确');
    await page.clock.fastForward(1200);
    await readNumberLineQuestion(page);
  });
}

test('320px 窄屏下数轴练习四个选项均在可视边界内', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.addInitScript(() => { Math.random = () => 0.5; });
  await page.goto(url, { timeout: 2500 });
  await page.locator('.mode-tab[data-mode="numberline"]').click();
  const question = await readNumberLineQuestion(page);
  const boxes = await page.locator('#nl-controls .nl-btn').evaluateAll(buttons => buttons.map(button => {
    const box = button.getBoundingClientRect();
    return { left: box.left, right: box.right, height: box.height };
  }));
  expect(boxes).toHaveLength(4);
  for (const box of boxes) {
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(320);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
  expect(question.answer).toBe(-10);
});
