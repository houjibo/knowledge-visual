const { test, expect } = require('@playwright/test');
const url = '/math/topics/ordinal-numbers/index.html';

for (const seed of [0, 0.5, 0.999999]) {
  test(`重复随机值 ${seed} 下各模式可出题并准确计数`, async ({ page }) => {
    await page.clock.install({time: new Date('2026-01-01T00:00:00Z')}); await page.clock.pauseAt(new Date('2026-01-01T00:00:00Z'));
    await page.addInitScript(value => { Math.random = () => value; }, seed);
    await page.goto(url, { timeout: 10000 });
    const fruits = await page.evaluate(() => learnData);
    expect(new Set(fruits).size).toBe(fruits.length);
    expect(fruits.filter(f => f === '🍌')).toHaveLength(1);
    await page.getByRole('spinbutton', { name: '水果总数' }).first().fill(String(fruits.length));
    await page.getByRole('spinbutton', { name: '香蕉的位置' }).fill(String((fruits.indexOf('🍌') + 1) % fruits.length + 1));
    await page.getByRole('button', { name: '✓ 检查答案' }).click();
    await expect(page.locator('#learnFeedback')).toContainText('再数一数');
    await page.getByRole('spinbutton', { name: '香蕉的位置' }).fill(String(fruits.indexOf('🍌') + 1));
    await page.getByRole('button', { name: '✓ 检查答案' }).click();
    await expect(page.locator('#learnFeedback')).toContainText('完全正确');

    await page.locator('.mode-tab[data-mode="choose"]').click();
    const options = page.locator('#chooseOptions button');
    const values = await options.allTextContents();
    expect(values).toHaveLength(4); expect(new Set(values).size).toBe(4);
    await page.locator('#chooseOptions button[data-correct="false"]').first().dispatchEvent('click');
    await expect(page.locator('#chooseFeedback')).toContainText('正确答案是');
    await expect(page.locator('#chooseCount')).toHaveText('1');
    await page.clock.runFor(2600);
    await expect(page.locator('#chooseOptions button')).toHaveCount(4);
    await expect(page.locator('#chooseOptions button').first()).toBeEnabled();

    await page.locator('.mode-tab[data-mode="circle"]').click();
    const circles = page.locator('#circleItems button');
    for (let i = 0; i < await circles.count(); i++) {
      await circles.nth(i).focus(); await page.keyboard.press('Enter');
    }
    await page.getByRole('button', { name: '✓ 检查', exact: true }).click();
    await expect(page.locator('#circleFeedback')).toContainText('再想想');
    await page.getByRole('button', { name: '🔄 清除' }).click();
    const instruction = await page.locator('#circleInstruction').innerText();
    const count = Number(instruction.match(/\d+/)[0]);
    const indexes = instruction.includes('第') ? [count - 1] : Array.from({length: count}, (_, i) => i);
    for (const index of indexes) await circles.nth(index).click();
    await expect(circles.nth(indexes[0])).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: '✓ 检查', exact: true }).click();
    await page.getByRole('button', { name: '✓ 检查', exact: true }).click();
    await expect(page.locator('#circleCount')).toHaveText('1');
    await expect(page.locator('#circleCorrect')).toHaveText('0');

    await page.locator('.mode-tab[data-mode="fill"]').click();
    const answer = await page.evaluate(() => fillAnswer);
    const input = page.locator('#fillInput');
    await input.fill(String(answer + 1)); await page.locator('#fillCheckBtn').click();
    await input.fill(String(answer)); await page.locator('#fillCheckBtn').click();
    await page.locator('#fillCheckBtn').click();
    await expect(page.locator('#fillCount')).toHaveText('1');
    await expect(page.locator('#fillCorrect')).toHaveText('0');
    await expect(page.locator('#fillFeedback')).toContainText('答对');
  });
}
