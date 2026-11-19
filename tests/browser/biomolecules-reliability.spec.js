const {test, expect} = require('@playwright/test');

const url = '/chemistry/high/11-biomolecules.html';

test('五个模式 tab 可切换且无脚本错误', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await expect(page).toHaveTitle(/生命中的基础有机物|糖类/);
  await expect(page.locator('#panel-explore')).toBeVisible();

  for (const mode of ['compare', 'test', 'nutrition', 'quiz']) {
    await page.locator(`.mode-tab[data-mode="${mode}"]`).click();
    await expect(page.locator(`.mode-tab[data-mode="${mode}"]`)).toHaveClass(/active/);
    await expect(page.locator(`#panel-${mode}`)).toHaveClass(/active/);
  }
  expect(errors).toEqual([]);
});

test('分子卡片点击显示详情', async ({page}) => {
  await page.goto(url);
  const cards = page.locator('.molecule-card');
  expect(await cards.count()).toBeGreaterThan(0);
  await cards.first().click();
  await expect(page.locator('#detailPanel')).not.toBeEmpty();
});

test('营养计算选择食物后更新总热量', async ({page}) => {
  await page.goto(url);
  await page.locator('.mode-tab[data-mode="nutrition"]').click();
  const before = await page.locator('#totalCal').textContent();
  const foods = page.locator('.food-item');
  expect(await foods.count()).toBeGreaterThan(0);
  await foods.first().click();
  await expect(foods.first()).toHaveClass(/selected/);
  await expect(page.locator('#totalCal')).not.toHaveText(before);
});

test('互动问答答完全部记录完成且可刷新恢复', async ({page}) => {
  await page.goto(url);
  await page.locator('.mode-tab[data-mode="quiz"]').click();
  const isDone = () => page.evaluate(() => PageProgress.isDone('11-biomolecules'));
  expect(await isDone()).toBe(false);
  // 6 questions, marked at end-of-quiz summary (60% threshold).
  const correct = [2, 2, 1, 2, 2, 0];
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
  await page.locator('.mode-tab[data-mode="compare"]').click();
  await expect(page.locator('.mode-tab[data-mode="compare"]')).toHaveClass(/active/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
});
