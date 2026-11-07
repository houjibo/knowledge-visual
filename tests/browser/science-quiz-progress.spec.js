const {test, expect} = require('@playwright/test');

async function openQuiz(page) {
  await page.goto('/science/sink-float.html');
  await page.getByRole('button', {name: '🎯 测验'}).click();
  await page.locator('#quizStart').click();
}

test('往返同一题不会重复计分，重新答题清空本轮', async ({page}) => {
  await openQuiz(page);
  const option = page.locator('#quizOpts button').nth(1);
  await option.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#quizFb')).toContainText('✅');
  await expect(page.locator('#quizOpts button').nth(1)).toBeFocused();
  await expect(page.locator('#quizOpts button').nth(1)).toHaveAttribute('aria-pressed', 'true');
  for (let i = 0; i < 4; i++) {
    await page.locator('#quizNext').click();
    await page.locator('#quizPrev').click();
    await page.locator('#quizOpts button').nth(1).click();
    await expect(page.locator('#quizFb')).toContainText('✅');
  }
  for (let i = 0; i < 5; i++) await page.locator('#quizNext').click();
  await expect(page.locator('#quizResult')).toContainText('1 / 5');
  await expect(page.locator('#done-mark')).toHaveText('');
  await page.locator('#quizStart').click();
  await expect(page.locator('#quizFb')).toHaveText('');
  await expect(page.locator('#quizOpts button[aria-pressed="true"]')).toHaveCount(0);
});

test('四道不同题答对后完成状态在刷新和科学目录保留', async ({page}) => {
  await openQuiz(page);
  for (const answer of [1, 1, 1, 0]) {
    await page.locator('#quizOpts button').nth(answer).click();
    await page.locator('#quizNext').click();
  }
  await page.locator('#quizNext').click();
  await expect(page.locator('#quizResult')).toContainText('4 / 5');
  await expect(page.locator('#done-mark')).toContainText('已完成');
  await page.reload();
  await expect(page.locator('#done-mark')).toContainText('已完成');
  await page.goto('/science/index.html');
  await expect(page.locator('a[href="sink-float.html"] .progress-badge')).toHaveAttribute('aria-label', '已完成');
});
