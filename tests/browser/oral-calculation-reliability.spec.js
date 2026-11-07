const { test, expect } = require('@playwright/test');
const url = '/math/topics/oral-calculation/index.html';

for (const seed of [0, 0.5, 0.999999]) {
  test(`重复随机值 ${seed} 下填数和闯关均可出题`, async ({ page }) => {
    await page.addInitScript(value => { Math.random = () => value; }, seed);
    await page.goto(url, { timeout: 10000 });
    await page.locator('[data-mode="fill"]').click();
    const fillOptions = page.locator('#fill-options button');
    const values = await fillOptions.allTextContents();
    expect(values).toHaveLength(4);
    expect(new Set(values).size).toBe(4);
    const answer = await page.evaluate(() => fillState.current.answer);
    expect(values).toContain(answer);
    await fillOptions.filter({ hasText: new RegExp(`^${answer}$`) }).dispatchEvent('click');
    await fillOptions.filter({ hasText: new RegExp(`^${answer}$`) }).dispatchEvent('click');
    await expect(page.locator('#fill-correct-count')).toHaveText('1');

    await page.locator('[data-mode="challenge"]').click();
    await page.locator('#challenge-start').click();
    const challengeOptions = page.locator('#challenge-options button');
    const options = await challengeOptions.allTextContents();
    expect(options).toHaveLength(4);
    expect(new Set(options).size).toBe(4);
    const correct = String(await page.evaluate(() => challengeState.current.answer));
    const wrong = options.find(value => value !== correct);
    await challengeOptions.filter({ hasText: new RegExp(`^${wrong}$`) }).click();
    await expect(challengeOptions.filter({ hasText: new RegExp(`^${correct}$`) })).toHaveClass(/correct/);
    await expect(page.locator('#challenge-feedback')).toContainText(`正确答案是 ${correct}`);
  });
}

test('限时练习记录对错，结束时取消旧题回调，重开显示 60 秒', async ({ page }) => {
  await page.clock.install();
  await page.clock.pauseAt(Date.now());
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="speed"]').click();
  await page.locator('#speed-start').click();
  const input = page.getByRole('spinbutton', { name: '口算答案' });
  await input.fill('2');
  await page.locator('#speed-submit').click();
  await expect(page.locator('#speed-progress .done')).toHaveCount(1);
  await page.clock.runFor(900);
  await input.fill('9');
  await page.locator('#speed-submit').click();
  await expect(page.locator('#speed-progress .wrong-dot')).toHaveCount(1);
  await page.clock.runFor(57000);
  await expect(page.locator('#speed-timer')).toHaveText('3');
  await page.clock.runFor(2000);
  await expect(page.locator('#speed-timer')).toHaveText('1');
  const answer = await page.evaluate(() => speedState.current.answer);
  await input.fill(String(answer + 1));
  await page.locator('#speed-submit').click();
  await page.clock.runFor(1100);
  await expect(page.locator('#speed-result')).toBeVisible();
  expect(await page.evaluate(() => [speedState.running, speedState.current])).toEqual([false, null]);
  await page.clock.runFor(2000);
  expect(await page.evaluate(() => [speedState.running, speedState.current])).toEqual([false, null]);
  await page.getByRole('button', { name: '🔄 再来一次' }).click();
  await page.locator('#speed-start').click();
  await expect(page.locator('#speed-timer')).toHaveText('60');
  await expect(page.locator('#speed-progress .done')).toHaveCount(0);
});
