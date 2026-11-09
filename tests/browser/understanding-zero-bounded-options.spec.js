const { test, expect } = require('@playwright/test');

const url = '/math/topics/understanding-zero/index.html';
const randomValues = [0, 0.5, 0.999999];

async function readCalculation(page) {
  const question = await page.locator('#calcProblem').innerText();
  const match = question.match(/(\d+)\s*([+×-])\s*(\d+)\s*=/u);
  if (!match) throw new Error(`无法解析 0 的运算题：${question}`);

  const left = Number(match[1]);
  const operator = match[2];
  const right = Number(match[3]);
  const answer = operator === '+' ? left + right : operator === '×' ? left * right : left - right;
  const options = page.locator('#calcOptions .calc-opt');
  const values = await options.evaluateAll(nodes => nodes.map(node => Number(node.textContent.trim())));

  expect(values).toHaveLength(4);
  expect(new Set(values).size).toBe(4);
  expect(values.every(value => Number.isInteger(value) && value >= 0 && value <= 10)).toBe(true);
  expect(values.filter(value => value === answer)).toHaveLength(1);

  return { question, answer };
}

for (const randomValue of randomValues) {
  test(`固定随机值 ${randomValue} 下 0 的运算练习能加载、答题并继续`, async ({ page }) => {
    await page.clock.install();
    await page.addInitScript(value => { Math.random = () => value; }, randomValue);
    const response = await page.goto(url, { timeout: 2500 });
    expect(response.status()).toBe(200);

    await page.locator('.mode-tab[data-mode="calc"]').click();
    const first = await readCalculation(page);
    await page.getByRole('button', { name: String(first.answer), exact: true }).click();
    await expect(page.locator('#calcResult')).toContainText('答对');
    await expect(page.locator('#calcCorrect')).toHaveText('1');

    await page.clock.fastForward(1500);
    await expect(page.locator('#calcResult')).toHaveText('');
    const next = await readCalculation(page);
    await page.getByRole('button', { name: String(next.answer), exact: true }).click();
    await expect(page.locator('#calcCorrect')).toHaveText('2');
    await expect(page.locator('#calcStreak')).toHaveText('2');
  });
}

test('320px 窄屏下 0 的运算选项保持可见', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url, { timeout: 2500 });
  await page.locator('.mode-tab[data-mode="calc"]').click();

  const boxes = await page.locator('#calcOptions .calc-opt').evaluateAll(nodes => nodes.map(node => {
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
