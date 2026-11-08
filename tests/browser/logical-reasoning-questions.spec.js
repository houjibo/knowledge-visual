const { test, expect } = require('@playwright/test');
const url = '/math/topics/logical-reasoning/index.html';

for (const seed of [0, 0.999999]) {
  test(`重复随机值 ${seed} 下练习和挑战不重复且给出解释`, async ({ page }) => {
    await page.clock.install({time: new Date('2026-01-01T00:00:00Z')}); await page.clock.pauseAt(new Date('2026-01-01T00:00:00Z'));
    await page.addInitScript(value => { Math.random = () => value; }, seed);
    await page.goto(url);
    await page.locator('[data-mode="practice"]').click();
    const practice = [];
    for (let i = 0; i < 10; i++) {
      await page.locator('#practiceNext').click();
      practice.push(await page.locator('#practiceText').innerText());
    }
    expect(new Set(practice).size).toBe(10);
    await page.locator('[data-mode="challenge"]').click();
    await page.locator('#challengeStart').click();
    const challenge = [];
    for (let i = 0; i < 10; i++) {
      const q = await page.evaluate(() => ({ question: chQ.q, answer: chQ.ans, explanation: chQ.ex }));
      challenge.push(q.question);
      const options = page.locator('#chOpts button');
      const selected = i === 0 ? (q.answer + 1) % 3 : q.answer;
      await options.nth(selected).click();
      await expect(page.locator('#chFeedback')).toContainText(q.explanation);
      await expect(options.nth(q.answer)).toHaveClass(/correct/);
      await expect(options.nth(selected)).toBeDisabled();
      await page.clock.runFor(i === 0 ? 1900 : 900);
    }
    expect(new Set(challenge).size).toBe(10);
    await expect(page.locator('#challengeStart')).toContainText('得分 9/10');
    expect(await page.evaluate(() => PageProgress.isDone('logical-reasoning'))).toBe(true);
  });
}

test('排队题线索唯一，表格推理过程与题库答案一致', async ({ page }) => {
  await page.goto(url);
  const bank = await page.evaluate(() => BANK.map(({q, opts, ans}) => ({q, answer: opts[ans]})));
  expect(bank.map(item => item.answer)).toEqual(['🍎','小明','丙','蓝球','小狗','属牛','英语','小娟','圆形','乌龟']);
  const queueQuestion = bank.find(item => item.q.includes('小猫、小狗、小兔排队'));
  expect(queueQuestion.q).toContain('小兔在小猫后面');
  const animals = ['小猫', '小狗', '小兔'];
  const possibilities = animals.flatMap(a => animals.filter(b => b !== a).map(b => [a, b, animals.find(c => c !== a && c !== b)]));
  const valid = possibilities.filter(order => order.indexOf('小狗') < order.indexOf('小猫') && order.indexOf('小猫') < order.indexOf('小兔'));
  expect(valid).toEqual([['小狗', '小猫', '小兔']]);
  await page.locator('[data-mode="explore"]').click();
  for (let i = 0; i < 5; i++) await page.locator('#stepBtn').click();
  await expect(page.locator('#gridTable td.hit')).toHaveCount(3);
  await expect(page.locator('#gridTable td.miss')).toHaveCount(6);
  await expect(page.locator('#factLine')).toContainText('小芳🍎、小明🍊、小红🍌');
  await page.locator('#stepBtn').click();
  await expect(page.locator('#gridTable td.hit')).toHaveCount(0);
  await expect(page.locator('#gridTable td.miss')).toHaveCount(0);
});
