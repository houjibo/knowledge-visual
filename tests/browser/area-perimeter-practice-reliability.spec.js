const {test, expect} = require('@playwright/test');
const url = '/math/topics/area-and-perimeter/index.html';

test('练习按题计数，回车不能重复计分或接受非整数', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="practice"]').click();
  const answer = page.getByLabel('练习答案');
  await answer.fill('4.5'); await answer.press('Enter');
  await expect(page.locator('#practice-hint')).toContainText('整数');
  await answer.fill('4'); await answer.press('Enter'); await answer.press('Enter');
  await expect(page.locator('#streak')).toHaveText('1');
  await expect(page.locator('#btn-check-answer')).toBeDisabled();
  await expect(page.locator('#btn-new-practice')).toContainText('下一题');
  await page.waitForTimeout(1700);
  await expect(answer).toHaveValue('4');
  await page.locator('#btn-new-practice').click();
  await expect(answer).toHaveValue('');
});

test('挑战连对独立计数、逐题作答并保存完成', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="practice"]').click();
  for (let i=0; i<4; i++) {
    await page.getByLabel('练习答案').fill('4'); await page.locator('#btn-check-answer').click(); await page.locator('#btn-new-practice').click();
  }
  await page.locator('[data-mode="challenge"]').click();
  await expect(page.locator('#streak')).toHaveText('0');
  for (let i=0; i<5; i++) {
    await page.getByLabel('挑战答案').fill('6'); await page.getByLabel('挑战答案').press('Enter'); await page.getByLabel('挑战答案').press('Enter');
    await expect(page.locator('#streak')).toHaveText(String(i+1));
    if (i<4) { expect(await page.evaluate(() => PageProgress.isDone('area-and-perimeter'))).toBe(false); await page.locator('#btn-new-challenge').click(); }
  }
  expect(await page.evaluate(() => PageProgress.isDone('area-and-perimeter'))).toBe(true);
  await page.reload(); expect(await page.evaluate(() => PageProgress.isDone('area-and-perimeter'))).toBe(true);
});

test('比较题面积相等也能有限出题并正确判分，答错后可阅读反馈', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.evaluate(() => { Random.pick = () => 'compare'; Random.int = () => 3; });
  await page.locator('[data-mode="challenge"]').click();
  await page.locator('#btn-new-challenge').click();
  await expect(page.locator('#challenge-question')).toContainText('相等时填写共同面积');
  await page.getByLabel('挑战答案').fill('8'); await page.getByLabel('挑战答案').press('Enter');
  await expect(page.locator('#challenge-hint')).toContainText('9');
  await page.waitForTimeout(2300);
  await expect(page.locator('#challenge-hint')).toContainText('9');
  await page.locator('#btn-new-challenge').click();
  await page.getByLabel('挑战答案').fill('9'); await page.getByLabel('挑战答案').press('Enter');
  await expect(page.locator('#challenge-hint')).toContainText('正确');
});

test('六类挑战的数值和单位与题目一致', async ({page}) => {
  await page.goto(url);
  await page.locator('[data-mode="challenge"]').click();
  for (const [kind, result, unit] of [['rect-area','9','cm²'],['rect-perimeter','12','cm'],['square-area','9','cm²'],['square-perimeter','12','cm'],['compare','9','cm²'],['reverse','3','cm']]) {
    await page.evaluate(type => { Random.pick = () => type; Random.int = () => 3; }, kind);
    await page.locator('#btn-new-challenge').click();
    await expect(page.locator('#challenge-unit')).toHaveText(unit);
    await page.getByLabel('挑战答案').fill(result); await page.locator('#btn-check-challenge').click();
    await expect(page.locator('#challenge-hint')).toContainText('正确');
  }
});

test('完成记录保存失败后可以重试', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; window.originalSetItem = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw new Error('denied'); }; });
  await page.goto(url); await page.locator('[data-mode="challenge"]').click();
  for (let i=0; i<5; i++) {
    await page.getByLabel('挑战答案').fill('6'); await page.locator('#btn-check-challenge').click();
    if (i<4) await page.locator('#btn-new-challenge').click();
  }
  await expect(page.locator('#math-progress-save-notice')).toBeVisible();
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
  await page.locator('#math-progress-save-notice button').click();
  await page.reload(); expect(await page.evaluate(() => PageProgress.isDone('area-and-perimeter'))).toBe(true);
});
