const { test, expect } = require('@playwright/test');
const url = '/math/topics/figure-movement/index.html';

for (const seed of [0, 0.5, 0.999999]) {
  test(`固定随机值 ${seed} 下挑战选项互异且关键题意正确`, async ({ page }) => {
    await page.addInitScript(value => { Math.random = () => value; }, seed);
    await page.goto(url);
    const questions = await page.evaluate(() => generateChallengeQuestions());
    expect(questions).toHaveLength(8);
    for (const q of questions) {
      expect(q.opts).toHaveLength(4);
      expect(new Set(q.opts).size).toBe(4);
      expect(q.ans).toBeGreaterThanOrEqual(0);
      expect(q.ans).toBeLessThan(4);
      if (q.q.includes('两段路线')) {
        const n = Number(q.q.match(/\d+/)[0]);
        expect(q.opts[q.ans]).toBe(`${2 * n} 格`);
      }
      if (q.q.includes('逆时针旋转了多少度')) {
        const angle = Number(q.q.match(/\d+/)[0]);
        expect(q.opts[q.ans]).toBe(`${360 - angle}°`);
      }
      if (q.q.includes('汽车')) expect(q.q).toContain('车身');
    }
    await page.locator('[data-mode="challenge"]').click();
    const answer = await page.evaluate(() => chQuestions[0].ans);
    await page.locator('#chOptions button').nth(answer).click();
    await expect(page.locator('#chResult')).toContainText('正确');
    await expect(page.locator('#chScore')).toHaveText('1');
  });
}

test('键盘移动到目标后离开，提示随位置更新', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="explore"]').click();
  for (const name of ['向右移动一格', '向下移动一格']) {
    await page.getByRole('button', { name }).focus();
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('#exploreMsg')).toContainText('到达目标');
  await page.getByRole('button', { name: '向左移动一格' }).click();
  await expect(page.locator('#exploreMsg')).toHaveText('');
  await expect(page.locator('#moveInfo')).toContainText('3');
});

test('重开判断和挑战时不会触发旧题回调', async ({ page }) => {
  await page.clock.install(); await page.clock.pauseAt(Date.now());
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="judge"]').click();
  await page.locator('.judge-opt').nth(1).click();
  await page.locator('[data-mode="judge"]').click();
  await page.clock.runFor(1600);
  await expect(page.locator('#judgeNum')).toHaveText('1');
  await expect(page.locator('.judge-opt').first()).toBeEnabled();
  await page.locator('[data-mode="challenge"]').click();
  await page.locator('#chOptions button').first().click();
  await page.locator('[data-mode="challenge"]').click();
  await page.clock.runFor(1600);
  await expect(page.locator('#chTotal')).toHaveText('0');
  await expect(page.locator('#chQuestion')).toContainText('第1题');
});
