const {test, expect} = require('@playwright/test');

test('性质题锁定、解析正确及完成记录可重试', async ({page}) => {
  await page.addInitScript(() => {
    window.rejectProgress=true;
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value) {
      if (window.rejectProgress && key === 'kv-math-progress-v2') throw new Error('unavailable');
      return original.call(this,key,value);
    };
  });
  await page.goto('/math/high/function.html');
  await page.getByRole('button',{name:'性质判定'}).click();
  const property = page.locator('#parityCards .property-card').nth(3);
  await property.getByRole('button',{name:'偶函数'}).focus();
  await page.keyboard.press('Enter');
  await expect(property.locator('button')).toHaveCount(3);
  for (const button of await property.locator('button').all()) await expect(button).toBeDisabled();
  await expect(property.locator('.feedback')).toContainText('偶函数');
  await page.getByRole('button',{name:'互动练习'}).click();
  const opts = page.locator('#quizArea button.quiz-opt');
  await opts.nth(0).focus();
  await page.keyboard.press('Enter');
  await expect(opts.nth(0)).toBeDisabled();
  await page.locator('#quizNextBtn').click();
  await opts.nth(1).click();
  await expect(page.locator('#quizFeedback')).toContainText('|x|是偶函数');
  for (const answer of [0,0,0,1]) {
    await page.locator('#quizNextBtn').click();
    await opts.nth(answer).click();
  }
  await expect(page.locator('#quizFeedback')).toContainText('总得分 2/6');
  expect(await page.evaluate(() => localStorage.getItem('kv-math-progress-v2'))).toBeNull();
  await page.locator('#quizRetryBtn').click();
  for (const [i,answer] of [0,1,1,1,0,1].entries()) {
    if (i) await page.locator('#quizNextBtn').click();
    await opts.nth(answer).click();
  }
  await expect(page.locator('#quizFeedback')).toContainText('总得分 4/6');
  await expect(page.locator('#quizFeedback')).toContainText('未保存');
  await expect(page.locator('#quizSaveRetry')).toBeVisible();
  await page.evaluate(() => {window.rejectProgress=false;});
  await page.locator('#quizSaveRetry').click();
  await expect(page.locator('#quizFeedback')).toContainText('已保存');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-math-progress-v2'))['high:function'])).toBeTruthy();
});
