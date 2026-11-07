const {test, expect} = require('@playwright/test');

test('探索滑块更新搭配数，固定随机值练习可答题并记录完成', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto('/math/topics/matching/index.html');
  await page.locator('.mode-tab[data-mode="explore"]').click();
  await page.getByLabel('👕 上衣件数').fill('3');
  await page.getByLabel('👖 裤子条数').fill('4');
  await expect(page.locator('#factLine')).toHaveText('3 × 4 = 12 种穿法');
  await page.locator('.mode-tab[data-mode="practice"]').click();
  for (let i = 0; i < 10; i++) {
    await page.locator('#practiceNext').click();
    const options = page.locator('#practiceOpts button');
    await expect(options).toHaveCount(4);
    expect(new Set(await options.allTextContents()).size).toBe(4);
    await options.getByText('4 种', {exact: true}).click();
    await expect(page.locator('#practiceFb')).toContainText('答对');
    await expect(options.first()).toBeDisabled();
  }
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('kv-math-progress-v2')))['primary:matching']).toBeTruthy();
  await page.reload();
  expect(await page.evaluate(() => PageProgress.isDone('matching'))).toBe(true);
});

test('四类题目在固定随机值下有不同选项，握手单位正确', async ({page}) => {
  await page.goto('/math/topics/matching/index.html');
  const questions = await page.evaluate(() => [0, .4, .7, .9].map(kind => {
    const values = [kind, 0, 0];
    Math.random = () => values.length ? values.shift() : 0;
    return genQ();
  }));
  expect(questions.map(q => q.ans)).toEqual([4, 4, 6, 3]);
  for (const q of questions) {
    expect(q.opts).toHaveLength(4);
    expect(new Set(q.opts).size).toBe(4);
    expect(q.opts).toContain(q.ans);
  }
  expect(questions[3].unit).toBe('次');
  await page.evaluate(() => { Math.random = () => .999999; });
  await page.locator('.mode-tab[data-mode="practice"]').click();
  await page.locator('#practiceNext').click();
  await expect(page.locator('#practiceText')).toContainText('握');
  expect((await page.locator('#practiceOpts button').allTextContents()).every(text => text.endsWith('次'))).toBe(true);
});

test('挑战答错后显示答案和解释并锁定选项', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto('/math/topics/matching/index.html');
  await page.locator('.mode-tab[data-mode="challenge"]').click();
  await page.locator('#challengeStart').click();
  const options = page.locator('#chOpts button');
  await options.filter({hasText: /^3 种$/}).first().click();
  await expect(page.locator('#chFeedback')).toContainText('正确答案 4 种');
  await expect(page.locator('#chFeedback')).toContainText('2 × 2');
  await expect(options.first()).toBeDisabled();
  await expect(page.locator('#chWrong')).toHaveText('1');
});
