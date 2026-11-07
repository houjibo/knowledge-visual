const {test, expect} = require('@playwright/test');

const answers = [2, 1, 1, 1, 2];
async function openQuiz(page) {
  await page.goto('/physics/middle/sound.html');
  await page.locator('[data-tab="tone"]').click();
}
async function answerAll(page) {
  for (let i = 0; i < answers.length; i++) {
    await page.locator('#quizOpts button').nth(answers[i]).click();
    if (i < answers.length - 1) await page.locator('#quizNext').click();
  }
}

test('键盘作答、重复计数、错题重试与完成持久化', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await openQuiz(page);
  const options = page.locator('#quizOpts button');
  await options.nth(0).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#quizResult')).toContainText('再想想');
  await options.nth(2).focus();
  await page.keyboard.press('Space');
  await options.nth(2).click();
  await expect(page.locator('#quizProgress')).toContainText('1 / 5');
  await page.waitForTimeout(2700);
  await expect(page.locator('#quizQ')).toContainText('声速示例');
  for (let i = 1; i < answers.length; i++) {
    await page.locator('#quizNext').click();
    await options.nth(answers[i]).click();
  }
  await expect(page.locator('#quizProgress')).toContainText('5 / 5');
  await expect(page.locator('#quizProgress')).toContainText('已保存');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-physics-middle-progress')).sound)).toBeTruthy();
  await page.reload();
  await page.locator('[data-tab="tone"]').click();
  await expect(page.locator('#quizProgress')).toContainText('0 / 5');
  await expect(page.locator('#quizProgress')).toContainText('已保存');
  expect(errors).toEqual([]);
});

test('保存失败时不声称成功，恢复后可重试', async ({page}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(...args) {
      if (!window.allowProgressSave) throw new Error('denied');
      return original.apply(this, args);
    };
  });
  await openQuiz(page);
  await answerAll(page);
  await expect(page.locator('#quizProgress')).toContainText('未保存');
  expect(await page.evaluate(() => localStorage.getItem('kv-physics-middle-progress'))).toBeNull();
  await page.evaluate(() => { window.allowProgressSave = true; });
  await page.locator('#quizSave').click();
  await expect(page.locator('#quizProgress')).toContainText('已保存');
  await page.reload();
  await page.locator('[data-tab="tone"]').click();
  await expect(page.locator('#quizProgress')).toContainText('已保存');
});
