const {test, expect} = require('@playwright/test');
const url = '/math/topics/angles/index.html';

async function key(page, locator) { await locator.focus(); await page.keyboard.press('Enter'); }

test('五道比角题的正确答案与图中两射线夹角一致，可重新开始', async ({page}) => {
  await page.goto(url);
  const questions = await page.evaluate(() => compareQuestions);
  const angle = cfg => {
    const a = [cfg.x2 - 20, cfg.y2 - 70], b = [cfg.x3 - 20, cfg.y3 - 70];
    return Math.acos((a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b)));
  };
  for (const q of questions) expect(angle(q.a) > angle(q.b) ? 'A' : 'B').toBe(q.bigger);
  await page.locator('[data-mode="compare"]').click();
  for (let i = 0; i < questions.length; i++) {
    const selected = page.locator('#cmp' + questions[i].bigger);
    await key(page, selected);
    await expect(page.locator('#cmpResult')).toContainText('正确');
    await expect(selected).toBeDisabled();
    await expect(page.locator('#cmpCorrect')).toHaveText(String(i + 1));
    await key(page, page.locator('#cmpNext'));
  }
  await expect(page.locator('#cmpResult')).toContainText('5 / 5');
  await page.locator('[data-mode="learn"]').click();
  await page.locator('[data-mode="compare"]').click();
  await expect(page.locator('#cmpAngles')).toBeVisible();
  await expect(page.locator('#cmpQuestion')).toHaveText('哪个角更大？');
  await expect(page.locator('#cmpTotal')).toHaveText('0');
});

test('找角可用键盘操作，错误和完成后重玩有反馈', async ({page}) => {
  await page.goto(url);
  await page.locator('[data-mode="find"]').click();
  await key(page, page.locator('.find-item[data-has="no"]').first());
  await expect(page.locator('#findScore')).toContainText('再看看');
  const correct = page.locator('.find-item[data-has="yes"]');
  for (const button of await correct.all()) {
    await key(page, button);
    await expect(button).toBeDisabled();
  }
  await expect(page.locator('#findProgress')).toContainText('5 / 5');
  await expect(page.locator('#findScore')).toContainText('全部找到');
  await key(page, page.locator('#findReset'));
  await expect(correct.first()).toBeEnabled();
  await expect(page.locator('#findProgress')).toContainText('0 / 5');
});

test('挑战达标时保存失败可重试并刷新恢复', async ({page}) => {
  await page.addInitScript(() => {
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('denied'); };
  });
  await page.goto(url);
  await page.locator('[data-mode="challenge"]').click();
  for (const answer of [0, 1, 1, 2, 2]) {
    const choice = page.locator('#chOptions button').nth(answer);
    await key(page, choice);
    await expect(choice).toBeDisabled();
    await key(page, page.locator('#chNext'));
  }
  await expect(page.locator('#chResult')).toContainText('5 / 5');
  await expect(page.locator('#math-progress-save-notice')).toContainText('暂未保存');
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
  await page.locator('#math-progress-save-notice button').click();
  await expect(page.locator('#math-progress-save-notice')).toContainText('已保存');
  await page.reload();
  expect(await page.evaluate(() => PageProgress.isDone('angles'))).toBe(true);
});
