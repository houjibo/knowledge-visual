const {test, expect} = require('@playwright/test');

test('逐题锁定、保留回合成绩并在保存失败后重试', async ({page}) => {
  await page.addInitScript(() => {
    window.rejectProgress = true;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (window.rejectProgress && key === 'kv-math-progress-v2') throw new Error('storage unavailable');
      return original.call(this,key,value);
    };
  });
  await page.goto('/math/high/derivative.html');
  await page.getByRole('button',{name:'🎯 互动练习'}).click();
  const opts = page.locator('#quizOpts button');
  await opts.nth(1).focus();
  await page.keyboard.press('Enter');
  await expect(opts.nth(1)).toBeDisabled();
  await page.waitForTimeout(1700);
  await expect(page.locator('#quizQ')).toContainText('(1/6)');
  await page.getByRole('button',{name:'📐 几何意义'}).click();
  await page.getByRole('button',{name:'🎯 互动练习'}).click();
  await expect(opts.nth(1)).toBeDisabled();
  await expect(page.locator('#quizFb')).toContainText('已答对 1 题');
  for (const answer of [0,1,0,1,1]) {
    await page.locator('#quizNext').click();
    await opts.nth(answer).click();
  }
  await expect(page.locator('#quizFb')).toContainText('本轮得分 1/6');
  await expect(page.locator('#quizRetry')).toBeHidden();
  await page.getByRole('button',{name:'重新练习'}).click();
  for (const [index,answer] of [1,1,0,1,1,1].entries()) {
    if (index) await page.locator('#quizNext').click();
    await opts.nth(answer).click();
  }
  await expect(page.locator('#quizFb')).toContainText('本轮得分 4/6');
  await expect(page.locator('#quizFb')).toContainText('未保存');
  await expect(page.locator('#quizRetry')).toBeVisible();
  await page.evaluate(() => { window.rejectProgress = false; });
  await page.locator('#quizRetry').click();
  await expect(page.locator('#quizFb')).toContainText('已保存');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('kv-math-progress-v2')));
  expect(saved['high:derivative']).toBeTruthy();
});
