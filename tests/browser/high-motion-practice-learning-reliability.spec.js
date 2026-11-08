const {test, expect} = require('@playwright/test');

test('运动概念练习按题序锁题、可键盘作答且只累计不同题', async ({page, isMobile}) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    window.__motionCompletionWrites = 0;
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'kv-physics-high-progress' && JSON.parse(value).motion) window.__motionCompletionWrites++;
      return originalSetItem.call(this, key, value);
    };
  });
  await page.goto('/physics/high/motion.html');
  if (isMobile) await page.setViewportSize({width: 320, height: 844});
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(isMobile ? 320 : 1280);
  await page.locator('.tab[data-mode="quiz"]').click();

  const options = page.locator('#panelContent .quiz-opt');
  const disabledOptions = page.locator('#panelContent .quiz-opt:disabled');
  await expect(page.getByText('第 1 / 5 题')).toBeVisible();
  await expect(options).toHaveCount(4);
  await options.nth(0).focus();
  await page.keyboard.press('Enter');
  await expect(disabledOptions).toHaveCount(4);
  await expect(page.locator('#motionQuizFeedback')).toContainText('错误');
  await expect(page.locator('#motionQuizProgress')).toContainText('答对 0 / 3');

  await page.locator('.tab[data-mode="concept"]').click();
  await page.locator('.tab[data-mode="quiz"]').click();
  await expect(page.getByText('第 1 / 5 题')).toBeVisible();
  await expect(disabledOptions).toHaveCount(4);
  await expect(page.locator('#motionQuizFeedback')).toContainText('错误');

  for (const [questionIndex, correctIndex] of [[0, 0], [1, 1], [2, 2]]) {
    await page.getByRole('button', {name: '下一题'}).click();
    await expect(page.getByText(`第 ${questionIndex + 2} / 5 题`)).toBeVisible();
    const answer = options.nth(correctIndex);
    await answer.focus();
    await page.keyboard.press('Space');
    await expect(disabledOptions).toHaveCount(4);
    await expect(page.locator('#motionQuizFeedback')).toContainText('正确');
  }

  await expect(page.locator('#motionQuizProgress')).toContainText('知识地图已点亮');
  await expect.poll(() => page.evaluate(() => PageProgress.isDone('motion'))).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__motionCompletionWrites)).toBe(1);
  await options.nth(0).evaluate(button => button.dispatchEvent(new MouseEvent('click', {bubbles: true})));
  await expect.poll(() => page.evaluate(() => window.__motionCompletionWrites)).toBe(1);

  await page.getByRole('button', {name: '下一题'}).click();
  await options.nth(0).click();
  await expect(page.locator('#motionQuizFeedback')).toContainText('错误');
  await page.getByRole('button', {name: '查看本轮结果'}).click();
  await expect(page.getByText('本轮练习完成')).toBeVisible();
  await expect(page.getByText('本轮答对 3 / 5 题。掌握进度：知识地图已点亮')).toBeVisible();
  await page.getByRole('button', {name: '重新练习'}).click();
  await expect(page.getByText('第 1 / 5 题')).toBeVisible();
  await options.nth(2).click();
  await expect(page.locator('#motionQuizFeedback')).toContainText('正确');
  await expect.poll(() => page.evaluate(() => window.__motionCompletionWrites)).toBe(1);
  expect(pageErrors).toEqual([]);
});
