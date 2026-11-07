const { test, expect } = require('@playwright/test');
const url = '/math/topics/measurements/index.html';

for (const seed of [0, 0.999999]) {
  test(`重复随机值 ${seed} 生成换算题并仅记录一次`, async ({ page }) => {
    await page.clock.install();
    await page.addInitScript(value => { Math.random = () => value; }, seed);
    await page.goto(url, { timeout: 10000 });
    await page.locator('[data-mode="convert"]').click();
    const question = await page.locator('.convert-problem').innerText();
    const number = Number(question.match(/\d+/)[0]);
    const answer = question.includes('米 =') && !question.includes('厘米 =') ? number * 100 : number / 100;
    const options = page.locator('.convert-opt');
    const values = (await options.allTextContents()).map(Number);
    expect(values).toHaveLength(4);
    expect(new Set(values).size).toBe(4);
    expect(values).toContain(answer);
    const wrong = values.find(value => value !== answer);
    await page.locator(`.convert-opt[data-val="${wrong}"]`).dispatchEvent('click');
    await page.locator(`.convert-opt[data-val="${answer}"]`).dispatchEvent('click');
    await expect(page.locator('#convert-result')).toContainText(`正确答案是 ${answer}`);
    expect(await page.evaluate(() => [challengeCorrect, challengeWrong])).toEqual([0, 1]);
    await page.evaluate(() => { Math.random = () => 0.5; });
    await page.locator('#btn-new-convert').click();
    const newQuestion = await page.locator('.convert-problem').innerText();
    await page.clock.fastForward(2200);
    await expect(page.locator('.convert-problem')).toHaveText(newQuestion);
    await expect(page.locator('#convert-result')).toHaveText('');
  });
}

test('估算题每次提交仅记录一次，换题后可继续', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="game"]').click();
  const slider = page.getByRole('slider', { name: '估计长度（厘米）' });
  await slider.fill('15');
  await page.locator('#btn-check-measure').click();
  await page.locator('#btn-check-measure').click();
  expect(await page.evaluate(() => [challengeCorrect, challengeWrong])).toEqual([1, 0]);
  await expect(page.locator('#measure-hint')).toContainText('参考长度约 15 厘米');
  await expect(page.locator('#measure-hint')).toContainText('实际物体的长度会不同');
  await page.locator('#btn-new-measure').click();
  await slider.fill('1');
  await page.locator('#btn-check-measure').click();
  expect(await page.evaluate(() => [challengeCorrect, challengeWrong])).toEqual([1, 1]);
});

test('尺子明确为示意且末尾刻度可见', async ({ page }) => {
  await page.goto(url);
  await expect(page.locator('#mode-cm .page-subtitle')).toContainText('不是实物尺');
  const ruler = await page.locator('#ruler-cm').boundingBox();
  const last = await page.locator('#cm-mark-15').boundingBox();
  expect(last.x + last.width).toBeLessThanOrEqual(ruler.x + ruler.width);
  await page.locator('[data-mode="m"]').click();
  await expect(page.locator('#mode-m')).toContainText('柱形高度为便于观察的示意');
});
