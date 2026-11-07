const {test, expect} = require('@playwright/test');

test('练习逐题锁定、显示成绩并支持保存失败重试', async ({page}) => {
  await page.addInitScript(() => {
    window.rejectProgress = true;
    const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value) {
      if (window.rejectProgress && key==='kv-math-progress-v2') throw new Error('unavailable');
      return original.call(this,key,value);
    };
  });
  await page.goto('/math/high/sets.html');
  await page.getByRole('button',{name:'互动练习',exact:true}).click();
  const opts=page.locator('#quizContainer button.quiz-option');
  await opts.nth(2).focus();
  await page.keyboard.press('Enter');
  await expect(opts.nth(2)).toBeDisabled();
  await page.getByRole('button',{name:'集合概念',exact:true}).click();
  await page.getByRole('button',{name:'互动练习',exact:true}).click();
  await expect(opts.nth(2)).toBeDisabled();
  for (const answer of [1,1,1,1]) {
    await page.locator('#nextBtn').click();
    await opts.nth(answer).click();
  }
  await expect(page.locator('#quizFeedback')).toContainText('总得分 2/5');
  await expect(page.locator('#quizFeedback')).toContainText('至少答对 3 题');
  expect(await page.evaluate(() => localStorage.getItem('kv-math-progress-v2'))).toBeNull();
  await page.locator('#retryBtn').click();
  for (const [i, answer] of [2,1,0,1,1].entries()) {
    if (i) await page.locator('#nextBtn').click();
    await opts.nth(answer).click();
  }
  await expect(page.locator('#quizFeedback')).toContainText('总得分 3/5');
  await expect(page.locator('#quizFeedback')).toContainText('未保存');
  await expect(page.locator('#saveRetryBtn')).toBeVisible();
  await page.evaluate(() => {window.rejectProgress=false;});
  await page.locator('#saveRetryBtn').click();
  await expect(page.locator('#quizFeedback')).toContainText('已保存');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-math-progress-v2'))['high:sets'])).toBeTruthy();
});
