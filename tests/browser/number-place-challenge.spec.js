const { test, expect } = require('@playwright/test');
const url = '/math/topics/numbers-within-10000/index.html';

for (const [type, seed] of [0, 0.17, 0.34, 0.51, 0.68, 0.84].entries()) {
  test(`固定随机值下第 ${type + 1} 类挑战题可完成`, async ({ page }) => {
    await page.addInitScript(value => { Math.random = () => value; }, seed);
    await page.goto(url, { timeout: 10000 });
    await page.locator('[data-mode="challenge"]').click({ timeout: 10000 });
    const questions = await page.evaluate(() => generateChallenge());
    expect(questions).toHaveLength(10);
    for (const item of questions) {
      expect(item.opts).toHaveLength(type === 5 ? 3 : 4);
      expect(new Set(item.opts.map(String)).size).toBe(item.opts.length);
      expect(item.opts.map(String)).toContain(String(item.ans));
      const text = item.q.replace(/<[^>]+>/g, '');
      const number = +(text.match(/[\d,]+/) || ['0'])[0].replaceAll(',', '');
      if (type === 0) {
        const place = { 个位: 1, 十位: 10, 百位: 100, 千位: 1000 }[text.match(/(个位|十位|百位|千位)/)[1]];
        expect(item.ans).toBe(Math.floor(number / place) % 10);
        if (place === 1000) expect(number).toBeGreaterThanOrEqual(1000);
      } else if (type === 1) {
        const digits = [...item.ans.matchAll(/(\d)个[千百十一]/g)].map(m => +m[1]);
        expect(digits[0] * 1000 + digits[1] * 100 + digits[2] * 10 + digits[3]).toBe(number);
      } else if (type === 4) expect(item.ans).toBe(number + (text.includes('前面') ? -1 : 1));
      else if (type === 5) {
        const [a, b] = text.match(/[\d,]+/g).map(v => +v.replaceAll(',', ''));
        expect(item.ans).toBe(a > b ? '>' : a < b ? '<' : '=');
      }
    }
    const current = await page.evaluate(() => ({ answer: chQuestions[0].ans }));
    await page.locator('#chOptions button').filter({ hasText: new RegExp(`^${String(current.answer).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).click();
    await expect(page.locator('#chFeedback')).toContainText('正确');
    await expect(page.locator('#chScore')).toHaveText('1');
  });
}

test('读数边界和拨珠键盘操作及重置', async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  const readings = await page.evaluate(() => [10, 11, 101, 1001, 1010, 1009, 9999].map(toChinese));
  expect(readings).toEqual(['十', '十一', '一百零一', '一千零一', '一千零一十', '一千零九', '九千九百九十九']);
  await page.locator('[data-mode="abacus"]').click();
  const ones = page.getByRole('button', { name: '个位：0，点击加一' });
  await ones.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: '个位：1，点击加一' })).toBeVisible();
  await page.getByRole('button', { name: '✅ 确认' }).click();
  await expect(page.locator('#abCorrect')).toHaveText('1');
  await page.getByRole('button', { name: '🔄 重置' }).click();
  await page.clock.fastForward(1600);
  await expect(page.locator('#abTarget')).toHaveText('1');
  await expect(page.getByRole('button', { name: '个位：0，点击加一' })).toBeVisible();
});

test('重开挑战会取消上一题的延时', async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="challenge"]').click();
  const answer = await page.evaluate(() => String(chQuestions[0].ans));
  await page.locator('#chOptions button').filter({ hasText: new RegExp(`^${answer}$`) }).click();
  await page.locator('[data-mode="challenge"]').click();
  await page.clock.fastForward(1600);
  await expect(page.locator('#chTotal')).toHaveText('0');
  await page.locator('#chOptions button').filter({ hasText: new RegExp(`^${answer}$`) }).click();
  await expect(page.locator('#chTotal')).toHaveText('1');
});

test('全部答错时不显示奖励星', async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="challenge"]').click();
  for (let i = 0; i < 10; i++) {
    const answer = await page.evaluate(() => String(chQuestions[chIdx].ans));
    const options = page.locator('#chOptions button');
    const texts = await options.allTextContents();
    const wrong = texts.find(text => text !== answer);
    await options.filter({ hasText: new RegExp(`^${wrong}$`) }).click();
    await page.clock.fastForward(1600);
  }
  await expect(page.locator('#chFeedback')).toHaveText('得分 0 / 10');
  await expect(page.locator('#chStars')).toHaveText('');
});
