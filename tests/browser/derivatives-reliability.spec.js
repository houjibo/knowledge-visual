const {test, expect} = require('@playwright/test');

const url = '/chemistry/high/10-derivatives.html';

test('四个模式 tab 可切换且无脚本错误', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await expect(page).toHaveTitle(/烃的衍生物/);
  await expect(page.locator('#panel-explore')).toBeVisible();

  for (const mode of ['test', 'synthesis', 'quiz']) {
    await page.locator(`.mode-tab[data-mode="${mode}"]`).click();
    await expect(page.locator(`.mode-tab[data-mode="${mode}"]`)).toHaveClass(/active/);
    await expect(page.locator(`#panel-${mode}`)).toHaveClass(/active/);
  }
  expect(errors).toEqual([]);
});

test('官能团卡片点击显示详情', async ({page}) => {
  await page.goto(url);
  const cards = page.locator('.func-card');
  expect(await cards.count()).toBeGreaterThan(0);
  await cards.first().click();
  await expect(page.locator('#detailPanel')).not.toBeEmpty();
});

test('鉴别实验网格渲染出鉴别卡片', async ({page}) => {
  await page.goto(url);
  await page.locator('.mode-tab[data-mode="test"]').click();
  await expect(page.locator('#testGrid .test-card').first()).toBeVisible();
});

test('互动问答答对三题以上记录完成且可刷新恢复', async ({page}) => {
  await page.goto(url);
  await page.locator('.mode-tab[data-mode="quiz"]').click();
  const isDone = () => page.evaluate(() => PageProgress.isDone('10-derivatives'));
  expect(await isDone()).toBe(false);
  // Completion is marked only at the end-of-quiz summary (threshold 60%).
  // Answer all five correctly: [1,1,1,2,1]; each auto-advances after 2s.
  const correct = [1, 1, 1, 2, 1];
  for (const index of correct) {
    await page.locator('#quizOptions .quiz-option').nth(index).click();
    await page.waitForTimeout(2300);
  }
  await expect(page.locator('#quizQuestion')).toContainText('问答结束');
  expect(await isDone()).toBe(true);
  await page.reload();
  expect(await isDone()).toBe(true);
});

test('320px 窄屏无横向溢出且 tab 可点', async ({page}) => {
  await page.setViewportSize({width: 320, height: 800});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(url);
  await page.locator('.mode-tab[data-mode="synthesis"]').click();
  await expect(page.locator('.mode-tab[data-mode="synthesis"]')).toHaveClass(/active/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
});
