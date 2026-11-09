const { test, expect } = require('@playwright/test');

const url = '/math/topics/multi-digit-multiplication/index.html';
const difficulties = ['easy', 'medium', 'hard'];

for (const seed of [0, 0.5, 0.999999]) {
  for (const difficulty of difficulties) {
    test(`多位数乘法 ${difficulty} 档在固定随机值 ${seed} 下有限生成选项并推进`, async ({ page }) => {
      await page.clock.install();
      await page.addInitScript(value => { Math.random = () => value; }, seed);
      await page.goto(url);
      await page.locator('.mode-tab[data-mode="challenge"]').click();
      await page.locator(`.diff-btn[data-diff="${difficulty}"]`).click();
      await page.locator('#btn-start-challenge').click();

      const problem = await page.locator('#challenge-problem').innerText();
      const [a, b] = problem.match(/\d+/g).map(Number);
      const answer = a * b;
      const options = page.locator('#challenge-options .challenge-opt');
      const values = (await options.allTextContents()).map(Number);

      expect(values).toHaveLength(4);
      expect(new Set(values).size).toBe(4);
      expect(values.filter(value => value === answer)).toHaveLength(1);

      await options.filter({ hasText: new RegExp(`^${answer}$`) }).click();
      await expect(page.locator('#ch-correct')).toHaveText('1');
      await page.clock.fastForward(1500);
      await expect(page.locator('#challenge-options .challenge-opt')).toHaveCount(4);
      await expect(page.locator('#challenge-options .challenge-opt.correct')).toHaveCount(0);
    });
  }
}
