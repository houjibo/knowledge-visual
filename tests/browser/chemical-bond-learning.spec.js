const {test, expect} = require('@playwright/test');
const url = '/chemistry/high/chemical-bond.html';
async function keyboardClick(page, locator) { await locator.focus(); await page.keyboard.press('Enter'); }
async function sixCorrect(page) {
  for (const [i, answer] of [0, 1, 2].entries()) {
    await keyboardClick(page, page.locator('#bondOpts button').nth(answer));
    if (i < 2) await page.locator('#bondNext').click();
  }
  await keyboardClick(page, page.locator('[data-tab="hybrid"]'));
  for (const [i, answer] of [2, 1, 0].entries()) {
    await keyboardClick(page, page.locator('#hybridOpts button').nth(answer));
    if (i < 2) await page.locator('#hybridNext').click();
  }
}

test('键盘切换模式、杂化和分子，说明遵循偶极矩判断', async ({page}) => {
  await page.goto(url);
  await keyboardClick(page, page.locator('[data-mode="polar"]'));
  await expect(page.locator('[data-mode="polar"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#bondConcept')).toContainText('极性共价键');
  await expect(page.locator('#stage-bond .info-box')).toContainText('不能作为绝对分界');
  await keyboardClick(page, page.locator('[data-tab="hybrid"]'));
  await keyboardClick(page, page.locator('[data-hybrid="sp2"]'));
  await expect(page.locator('#hybridEq')).toContainText('sp²');
  await page.getByLabel('旋转角度').fill('90');
  await expect(page.locator('#hybridRotVal')).toHaveText('90°');
  await keyboardClick(page, page.locator('[data-tab="geometry"]'));
  await expect(page.locator('#geomConcept')).toContainText('CH₄');
  const water = page.locator('#molGrid button').filter({hasText:'H₂O'});
  await keyboardClick(page, water);
  await expect(water).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#geomConcept')).toContainText('V形');
  await keyboardClick(page, page.locator('[data-tab="polarity"]'));
  await keyboardClick(page, page.locator('[data-polar="co2"]'));
  await expect(page.locator('#polarEq')).toContainText('非极性');
  await expect(page.locator('#polarInfo')).toContainText('矢量和');
});

test('六道不同题目完成并在刷新后保留', async ({page}) => {
  await page.goto(url);
  await expect(page.locator('#bondProgress')).toContainText('6 题');
  await sixCorrect(page);
  await expect(page.locator('#bondProgress')).toContainText('已完成');
  await page.locator('#hybridPrev').click();
  await expect(page.locator('#hybridOpts button').first()).toBeDisabled();
  await expect(page.locator('#hybridFb')).toContainText('正确');
  await page.reload();
  await expect(page.locator('#bondProgress')).toContainText('已完成');
});

test('写入失败显示未保存，恢复后重试', async ({page}) => {
  await page.addInitScript(() => {
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('denied'); };
  });
  await page.goto(url);
  await sixCorrect(page);
  await expect(page.locator('#bondProgress')).toContainText('进度未保存');
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
  await keyboardClick(page, page.locator('#bondRetrySave'));
  await expect(page.locator('#bondProgress')).toContainText('已完成');
  await page.reload();
  await expect(page.locator('#bondProgress')).toContainText('已完成');
});
