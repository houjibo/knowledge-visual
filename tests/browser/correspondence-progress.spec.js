const {test, expect} = require('@playwright/test');

async function answerPractice(page, correct) {
  await page.locator(`#practice-area .opt-btn[data-val="${correct ? '=' : '>'}"]`).click();
}

test('十题且正确率达到八成后记录完成并在目录恢复', async ({page}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
    const timer = window.setTimeout;
    window.setTimeout = (callback, ms, ...args) => timer(callback, ms === 1500 ? 10 : ms, ...args);
  });
  await page.goto('/math/topics/one-to-one-correspondence/index.html');
  await expect(page.locator('#learning-progress')).toContainText('答满 10 题');
  await page.locator('.mode-tab[data-mode="practice"]').click();
  for (let i = 0; i < 10; i++) {
    await answerPractice(page, i < 8);
    if (i === 8) {
      await expect(page.locator('#learning-progress')).not.toContainText('已完成');
      expect(await page.evaluate(() => PageProgress.isDone('one-to-one-correspondence'))).toBe(false);
    }
    if (i < 9) await expect(page.locator('#practice-area .opt-btn[data-val="="]')).toBeEnabled();
  }
  await expect(page.locator('#learning-progress')).toContainText('已完成');
  await page.reload();
  await expect(page.locator('#learning-progress')).toContainText('已完成');
  await page.goto('/math/index.html');
  await expect(page.locator('a.topic-node[href="topics/one-to-one-correspondence/index.html"] .progress-badge')).toHaveCount(1);
});

test('十题正确率不足八成不标记，之后达标才标记', async ({page}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
    const timer = window.setTimeout;
    window.setTimeout = (callback, ms, ...args) => timer(callback, ms === 1500 ? 10 : ms, ...args);
  });
  await page.goto('/math/topics/one-to-one-correspondence/index.html');
  await page.locator('.mode-tab[data-mode="practice"]').click();
  for (let i = 0; i < 15; i++) {
    await answerPractice(page, i < 7 || i >= 10);
    if (i === 9 || i === 13) expect(await page.evaluate(() => PageProgress.isDone('one-to-one-correspondence'))).toBe(false);
    if (i < 14) await expect(page.locator('#practice-area .opt-btn[data-val="="]')).toBeEnabled();
  }
  await expect(page.locator('#learning-progress')).toContainText('已完成');
});

test('存储拒绝写入时提示本次达标但未保存', async ({page}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
    const timer = window.setTimeout;
    window.setTimeout = (callback, ms, ...args) => timer(callback, ms === 1500 ? 10 : ms, ...args);
    Storage.prototype.setItem = () => { throw new Error('denied'); };
  });
  await page.goto('/math/topics/one-to-one-correspondence/index.html');
  await page.locator('.mode-tab[data-mode="practice"]').click();
  for (let i = 0; i < 10; i++) {
    await answerPractice(page, true);
    if (i < 9) await expect(page.locator('#practice-area .opt-btn[data-val="="]')).toBeEnabled();
  }
  await expect(page.locator('#learning-progress')).toContainText('进度未保存');
  await page.reload();
  await expect(page.locator('#learning-progress')).not.toContainText('已完成');
});

test('练习、配对游戏和挑战的作答共同累计', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto('/math/topics/one-to-one-correspondence/index.html');
  await page.locator('.mode-tab[data-mode="practice"]').click();
  await answerPractice(page, true);
  await page.locator('.mode-tab[data-mode="game"]').click();
  await page.locator('#game-area .game-opt[data-val="yes"]').click();
  await page.locator('.mode-tab[data-mode="challenge"]').click();
  await page.locator('#btn-start-challenge').click();
  await page.locator('#ch-content .game-opt[data-val="一样多"]').click();
  await expect(page.locator('#learning-progress')).toContainText('本次已答 3 题，答对 3 题');
});

test('共享进度重试成功后同步完成状态', async ({page}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
    const timer = window.setTimeout;
    window.setTimeout = (callback, ms, ...args) => timer(callback, ms === 1500 ? 10 : ms, ...args);
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('denied'); };
  });
  await page.goto('/math/topics/one-to-one-correspondence/index.html');
  await page.locator('.mode-tab[data-mode="practice"]').click();
  for (let i = 0; i < 10; i++) {
    await answerPractice(page, true);
    if (i < 9) await expect(page.locator('#practice-area .opt-btn[data-val="="]')).toBeEnabled();
  }
  await expect(page.locator('#learning-progress')).toContainText('进度未保存');
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
  await page.locator('#math-progress-save-notice').getByRole('button', {name: '重试保存'}).click();
  await expect(page.locator('#learning-progress')).toContainText('已完成');
  await page.reload();
  await expect(page.locator('#learning-progress')).toContainText('已完成');
});
