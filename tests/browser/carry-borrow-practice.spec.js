const { test, expect } = require('@playwright/test');
const url = '/math/topics/20-within-addition-subtraction/index.html';

for (const seed of [0, 0.5, 0.999999]) {
  test(`随机值 ${seed} 时题目有效且答对只计一次`, async ({ page }) => {
    await page.addInitScript(value => { Math.random = () => value; }, seed);
    await page.goto(url, { timeout: 10000 });
    for (const [mode, op] of [['make10', '+'], ['break10', '−']]) {
      await page.locator(`[data-mode="${mode}"]`).click();
      const problem = await page.locator(`#${mode}-problem`).innerText();
      const numbers = problem.match(/\d+/g).map(Number);
      const answer = op === '+' ? numbers[0] + numbers[1] : numbers[0] - numbers[1];
      if (op === '+') expect(answer).toBeGreaterThan(10);
      else expect(numbers[1]).toBeGreaterThan(numbers[0] % 10);
      const options = page.locator(`#${mode}-options button`);
      const choices = (await options.allTextContents()).map(Number);
      expect(choices).toHaveLength(4);
      expect(new Set(choices).size).toBe(4);
      expect(choices).toContain(answer);
      const before = Number(await page.locator('#streak').innerText());
      const correct = options.filter({ hasText: new RegExp(`^${answer}$`) });
      await correct.dispatchEvent('click');
      await correct.dispatchEvent('click');
      await expect(page.locator('#streak')).toHaveText(String(before + 1));
    }
  });
}

test('闯关每题只记录一次，并可在完成后重新开始', async ({ page }) => {
  await page.clock.install();
  await page.goto(url);
  await page.locator('[data-mode="practice"]').click();
  const input = page.locator('#practice-answer');
  const check = page.locator('#btn-check-practice');
  await input.fill('1a');
  await check.click();
  await expect(page.locator('#practice-level')).toHaveText('第1关');
  for (let i = 1; i <= 10; i++) {
    const problem = await page.locator('#practice-problem').innerText();
    const [a, b] = problem.match(/\d+/g).map(Number);
    const answer = problem.includes('+') ? a + b : a - b;
    await input.fill(String(answer));
    await check.dispatchEvent('click');
    await check.dispatchEvent('click');
    await input.dispatchEvent('keydown', { key: 'Enter' });
    await page.clock.fastForward(1600);
    if (i < 10) await expect(page.locator('#practice-level')).toHaveText(`第${i + 1}关`);
  }
  await expect(page.locator('#practice-hint')).toContainText('答对 10/10');
  expect(await page.evaluate(() => PageProgress.isDone('20-within-addition-subtraction'))).toBe(true);
  await check.click();
  await expect(page.locator('#practice-level')).toHaveText('第1关');
  await expect(input).toBeVisible();
  await expect(input).toHaveValue('');
  await expect(check).toContainText('检查');
});
