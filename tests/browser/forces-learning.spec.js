const {test, expect} = require('@playwright/test');
const url = '/science/forces.html';

async function keyboardClick(page, locator) {
  await locator.focus();
  await page.keyboard.press('Enter');
}
async function visitModes(page) {
  await keyboardClick(page, page.locator('[data-section="pushpull"]'));
  await keyboardClick(page, page.locator('[data-section="effect"]'));
  await keyboardClick(page, page.locator('[data-section="quiz"]'));
}
async function answerQuiz(page) {
  for (const [i, answer] of [2, 2, 1, 1, 2].entries()) {
    await expect(page.locator('#quizQ')).toContainText(`${i + 1}.`);
    await keyboardClick(page, page.locator('#quizOpts button').nth(answer));
    await expect(page.locator('#quizFeedback')).toContainText('正确');
    if (i < 4) await keyboardClick(page, page.locator('#nextBtn'));
  }
}

test('键盘切换模式并操作推拉、形变及运动示范', async ({page}) => {
  await page.goto(url);
  await keyboardClick(page, page.locator('#canvasAction'));
  await expect(page.locator('#actionStatus')).toContainText('推动小球');
  await keyboardClick(page, page.locator('[data-section="pushpull"]'));
  await expect(page.locator('[data-section="pushpull"]')).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('推拉力大小：').fill('8');
  await expect(page.locator('#forceVal')).toHaveText('8 N');
  await keyboardClick(page, page.locator('#canvasAction'));
  await expect(page.locator('#actionStatus')).toContainText('推动箱子');
  await keyboardClick(page, page.locator('[data-mode="pull"]'));
  await expect(page.locator('[data-mode="pull"]')).toHaveAttribute('aria-pressed', 'true');
  await keyboardClick(page, page.locator('#canvasAction'));
  await expect(page.locator('#actionStatus')).toContainText('已拉伸');
  expect(await page.evaluate(() => manualSpringStretch)).toBe(64);
  await keyboardClick(page, page.locator('#canvasAction'));
  await expect(page.locator('#actionStatus')).toContainText('已松开');
  await keyboardClick(page, page.locator('[data-section="effect"]'));
  await keyboardClick(page, page.locator('#canvasAction'));
  await expect(page.locator('#actionStatus')).toContainText('挤压');
  await keyboardClick(page, page.locator('[data-exp="motion"]'));
  await keyboardClick(page, page.locator('#canvasAction'));
  await expect(page.locator('#actionStatus')).toContainText('发射');
  await keyboardClick(page, page.locator('[data-exp="gravity"]'));
  await keyboardClick(page, page.locator('#canvasAction'));
  await expect(page.locator('#actionStatus')).toContainText('释放苹果');
});

test('首次答错可重测，五题正确后保存并刷新', async ({page}) => {
  await page.goto(url);
  await visitModes(page);
  await keyboardClick(page, page.locator('#quizOpts button').first());
  await expect(page.locator('#quizFeedback')).toContainText('不对');
  await keyboardClick(page, page.locator('#retryQuiz'));
  await answerQuiz(page);
  await expect(page.locator('#done-mark')).toContainText('已完成');
  await page.reload();
  await expect(page.locator('#done-mark')).toBeVisible();
});

test('浏览器拒绝保存时不误报完成，恢复后可重试', async ({page}) => {
  await page.addInitScript(() => {
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('denied'); };
  });
  await page.goto(url);
  await visitModes(page);
  await answerQuiz(page);
  await expect(page.locator('#done-mark')).toContainText('进度未保存');
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
  await keyboardClick(page, page.locator('[data-section="concept"]'));
  await expect(page.locator('#done-mark')).toHaveText('✓ 已完成');
  await page.reload();
  await expect(page.locator('#done-mark')).toBeVisible();
});
