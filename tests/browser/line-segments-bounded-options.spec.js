const { test, expect } = require('@playwright/test');

const url = '/math/topics/line-segments/index.html';
const randomValues = [0, 0.25, 0.5, 0.999999];

async function readCountQuestion(page) {
  const pointCount = await page.locator('#count-svg-wrap circle').count();
  const answer = pointCount * (pointCount - 1) / 2;
  const options = page.locator('#count-options .count-opt');
  const values = await options.evaluateAll(nodes => nodes.map(node => Number(node.dataset.val)));

  expect(pointCount).toBeGreaterThanOrEqual(2);
  expect(values).toHaveLength(4);
  expect(new Set(values).size).toBe(4);
  expect(values.every(value => Number.isInteger(value) && value > 0)).toBe(true);
  expect(values.filter(value => value === answer)).toHaveLength(1);

  return { answer };
}

for (const randomValue of randomValues) {
  test(`固定随机值 ${randomValue} 下数线段练习能加载、答题并继续`, async ({ page }) => {
    await page.clock.install();
    await page.addInitScript(value => { Math.random = () => value; }, randomValue);
    const response = await page.goto(url, { timeout: 2500 });
    expect(response.status()).toBe(200);

    await page.locator('.mode-tab[data-mode="count"]').click();
    const { answer } = await readCountQuestion(page);
    await page.locator(`#count-options .count-opt[data-val="${answer}"]`).click();
    await expect(page.locator('#count-feedback')).toContainText('正确');
    await expect(page.locator('#count-score')).toHaveText('1');
    await expect(page.locator('#count-total')).toHaveText('1');

    await page.clock.fastForward(1500);
    await expect(page.locator('#count-feedback')).toHaveText('');
    const next = await readCountQuestion(page);
    expect(next.answer).toBe(answer);
    await page.locator(`#count-options .count-opt[data-val="${next.answer}"]`).click();
    await expect(page.locator('#count-score')).toHaveText('2');
    await expect(page.locator('#count-total')).toHaveText('2');
  });
}

test('四种线段总数答案都生成唯一的正整数选项', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url, { timeout: 2500 });
  const questions = await page.evaluate(() => [1, 3, 6, 10].map(answer => ({
    answer,
    options: buildCountOptions(answer)
  })));

  for (const { answer, options } of questions) {
    expect(options).toHaveLength(4);
    expect(new Set(options).size).toBe(4);
    expect(options.every(value => Number.isInteger(value) && value > 0)).toBe(true);
    expect(options.filter(value => value === answer)).toHaveLength(1);
  }
});

test('320px 窄屏下数线段选项保持可见', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url, { timeout: 2500 });
  await page.locator('.mode-tab[data-mode="count"]').click();

  const boxes = await page.locator('#count-options .count-opt').evaluateAll(nodes => nodes.map(node => {
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
