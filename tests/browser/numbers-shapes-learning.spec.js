const { test, expect } = require('@playwright/test');
const url = '/math/topics/numbers-and-shapes/index.html';

for (const seed of [0, 0.5, 0.999999]) {
  test(`固定随机数 ${seed} 的练习及挑战可答题`, async ({ page }) => {
    await page.addInitScript(value => { Math.random = () => value; }, seed);
    await page.goto(url, { timeout: 10000 });
    await page.locator('[data-mode="practice"]').click();
    await page.locator('#practiceNext').click();
    const options = page.locator('#practiceOpts button');
    const values = await options.allTextContents();
    expect(values).toHaveLength(4);
    expect(new Set(values).size).toBe(4);
    const correct = String(await page.evaluate(() => pQ.ans));
    await options.filter({ hasText: new RegExp(`^${correct}$`) }).click();
    await expect(page.locator('#practiceFb')).toContainText('答对');
    await page.locator('[data-mode="challenge"]').click();
    await page.locator('#challengeStart').click();
    const challengeOptions = page.locator('#chOpts button');
    const answers = await challengeOptions.allTextContents();
    expect(answers).toHaveLength(4);
    expect(new Set(answers).size).toBe(4);
    const challengeAnswer = String(await page.evaluate(() => chQ.ans));
    const wrong = answers.find(v => v !== challengeAnswer);
    await challengeOptions.filter({ hasText: new RegExp(`^${wrong}$`) }).click();
    await expect(page.locator('#chFb')).toContainText(`正确答案 ${challengeAnswer}`);
    await expect(challengeOptions.filter({ hasText: new RegExp(`^${challengeAnswer}$`) })).toHaveClass(/correct/);
    await expect(page.locator('#chWrong')).toHaveText('1');
    await expect(challengeOptions.first()).toBeDisabled();
  });
}

test('有限取半显示精确分数、近似值与剩余面积', async ({ page }) => {
  await page.goto(url);
  await page.locator('[data-mode="explore"]').click();
  await page.locator('[data-demo="half"]').click();
  const slider = page.getByRole('slider', { name: '取的轮数' });
  await slider.fill('8');
  await expect(page.locator('#factLine')).toContainText('255/256 ≈ 0.9961');
  await expect(page.locator('#factLine')).toContainText('白色还剩 1/256');
  await slider.fill('1');
  await expect(page.locator('#factLine')).toContainText('1/2 ≈ 0.5000');
  await page.locator('[data-demo="square"]').click();
  await expect(page.getByRole('slider', { name: '层数 n' })).toBeVisible();
  await expect(page.locator('#factLine')).toHaveText('1 = 1 = 1²');
});
