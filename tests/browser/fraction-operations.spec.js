const {test, expect} = require('@playwright/test');
const url = '/math/topics/fraction-operations/index.html';

test('异分母减法题面、提示和判分一致', async ({page}) => {
  await page.goto(url);
  await page.evaluate(() => {
    const values = [.9, 0, 0, 0, .999, .9];
    Math.random = () => values.length ? values.shift() : 0;
  });
  await page.locator('[data-mode="practice"]').click();
  const fractions = page.locator('#prac-problem .frac');
  await expect(fractions.nth(0).locator('.num')).toHaveText('2');
  await expect(fractions.nth(0).locator('.den')).toHaveText('3');
  await expect(fractions.nth(1).locator('.num')).toHaveText('1');
  await expect(fractions.nth(1).locator('.den')).toHaveText('2');
  await page.getByRole('button', {name: '💡 提示'}).filter({visible: true}).click();
  await expect(page.locator('#prac-hint-box')).toContainText('LCM(3, 2) = 6');
  await page.getByLabel('答案分子').fill('1');
  await page.getByLabel('答案分母').fill('6');
  await page.locator('#prac-submit').click();
  await expect(page.locator('#prac-feedback')).toContainText('完全正确');
});

test('固定随机值可进入异分母并完成五关、重新开始', async ({page}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
    const original = window.setTimeout;
    window.setTimeout = (fn, delay, ...args) => original(fn, delay === 1500 ? 20 : delay, ...args);
  });
  await page.goto(url);
  await page.locator('[data-mode="diff-den"]').click();
  await expect(page.locator('#diff-options button')).toHaveCount(4);
  await page.locator('[data-mode="challenge"]').click();
  for (let level = 1; level <= 5; level++) {
    await expect(page.locator('#level-info')).toContainText(`第 ${level} 关`);
    const correctIndex = await page.evaluate(() => {
      const fraction = el => [Number(el.querySelector('.num').textContent), Number(el.querySelector('.den').textContent)];
      const [a, b] = [...document.querySelectorAll('#ch-problem .frac')].map(fraction);
      const sign = document.querySelector('#ch-problem .op').textContent.trim() === '+' ? 1 : -1;
      const numerator = a[0] * b[1] + sign * b[0] * a[1];
      const denominator = a[1] * b[1];
      return [...document.querySelectorAll('#ch-options button')].findIndex(btn => {
        const [n, d] = fraction(btn);
        return n * denominator === numerator * d;
      });
    });
    expect(correctIndex).toBeGreaterThanOrEqual(0);
    await page.locator('#ch-options button').nth(correctIndex).click();
  }
  await expect(page.locator('#ch-complete')).toContainText('闯关完成');
  expect(await page.evaluate(() => PageProgress.isDone('fraction-operations'))).toBe(true);
  await page.locator('#ch-restart').click();
  await expect(page.locator('#level-info')).toContainText('第 1 关');
  await expect(page.locator('#ch-options button')).toHaveCount(4);
});

test('探索器表示假分数、负数并拒绝无效输入', async ({page}) => {
  await page.goto(url);
  const n1 = page.getByLabel('第一个分数的分子');
  const d1 = page.getByLabel('第一个分数的分母');
  const n2 = page.getByLabel('第二个分数的分子');
  const d2 = page.getByLabel('第二个分数的分母');
  const calc = page.locator('#exp-calc');
  await n1.fill('5'); await d1.fill('3'); await n2.fill('1'); await d2.fill('3');
  await calc.click();
  const rows = page.locator('#exp-visual .bar-row');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText('完整整体 × 1');
  await expect(rows.nth(0).locator('.bar-track')).toHaveCount(2);
  await expect(rows.nth(0).locator('.bar-track').nth(1).locator('.bar-seg.a')).toHaveCount(2);
  await expect(rows.nth(2)).toContainText('完整整体 × 2');
  await n1.fill('1'); await n2.fill('2');
  await page.getByLabel('运算符').selectOption('-');
  await calc.click();
  await expect(rows.nth(2)).toContainText('=-1/3（绝对值示意）');
  await expect(rows.nth(2).locator('.bar-seg.result')).toHaveCount(1);
  for (const value of ['', '0', '1.5', '21']) {
    await d1.fill(value);
    await calc.click();
    await expect(page.locator('#exp-error')).toContainText('请输入整数');
    await expect(page.locator('#exp-result')).toBeEmpty();
    await expect(rows).toHaveCount(0);
  }
  await d1.fill('7'); await d2.fill('11');
  await page.getByLabel('运算符').selectOption('+');
  await calc.click();
  await expect(page.locator('#exp-error')).toBeEmpty();
  await expect(page.locator('#exp-visual')).toContainText('结果分母大于 30');
});
