const {test, expect} = require('@playwright/test');
const url = '/math/topics/area-units/index.html';

test('固定随机边界可初始化并生成四个唯一换算选项', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  const errors=[]; page.on('pageerror', e => errors.push(e.message));
  await page.goto(url); await page.locator('.mode-tab[data-mode="convert"]').click();
  const options = page.locator('#convert-options button');
  await expect(options).toHaveCount(4); expect(new Set(await options.allTextContents()).size).toBe(4);
  await options.getByText('1',{exact:true}).click();
  await expect(page.locator('#conv-score')).toHaveText('✅1');
  for (const button of await options.all()) await expect(button).toBeDisabled();
  await page.locator('#btn-next-convert').click();
  await expect(page.locator('#conv-progress-text')).toHaveText('第 2 题');
  expect(errors).toEqual([]);
});

test('矩形方格一致且重复检查不会增加得分', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url); await page.locator('.mode-tab[data-mode="count"]').click();
  const cells = page.locator('#grid-container .grid-cell.filled');
  await expect(cells).toHaveCount(1);
  const answer = page.getByLabel('方格面积答案');
  await answer.fill('1.5'); await answer.press('Enter'); await expect(page.locator('#count-score')).toHaveText('✅0');
  await answer.fill('1'); await answer.press('Enter'); await answer.press('Enter');
  await expect(page.locator('#count-score')).toHaveText('✅1');
  await page.evaluate(() => { const values = [.5,.5,0,0,0,.99,.99]; Math.random = () => values.shift() ?? 0; newGrid(); });
  await expect(page.locator('#grid-container .grid-cell.filled')).toHaveCount(25);
  await expect(page.locator('#count-progress-text')).toHaveText('第 2 题');
});

test('估测题正确后锁定，主动进入下一题', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url); await page.locator('.mode-tab[data-mode="estimate"]').click();
  const index = await page.evaluate(() => estimateItems[0].answer);
  await page.locator('#est-options button').nth(index).click();
  await expect(page.locator('#est-score')).toHaveText('✅1');
  for (const button of await page.locator('#est-options button').all()) await expect(button).toBeDisabled();
  await page.locator('#btn-next-estimate').click(); await expect(page.locator('#est-progress-text')).toHaveText('第 2 题');
});

test('数值挑战防重复并能保存进度', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url); await page.locator('.mode-tab[data-mode="challenge"]').click();
  for (let i=0; i<5; i++) {
    await page.evaluate(() => { let first=true; Math.random=()=>{if(first){first=false;return .81;} return 0;}; newChallenge(); });
    await page.getByLabel('挑战答案').fill('400'); await page.getByLabel('挑战答案').press('Enter'); await page.getByLabel('挑战答案').press('Enter');
    await expect(page.locator('#ch-streak')).toHaveText(`🔥 连对 ${i+1}`);
    await expect(page.locator('#ch-hint')).toHaveText('答对了！');
  }
  expect(await page.evaluate(() => PageProgress.isDone('area-units'))).toBe(true);
});

test('存储拒绝时选择挑战仍可继续并重试保存', async ({page}) => {
  await page.addInitScript(() => { Math.random=()=>0; window.originalSetItem=Storage.prototype.setItem; Storage.prototype.setItem=()=>{throw Error('denied');}; });
  await page.goto(url); await page.locator('.mode-tab[data-mode="challenge"]').click();
  for (let i=0;i<5;i++) {
    await page.locator('#ch-options button').getByText('100',{exact:true}).click();
    if (i<4) await page.locator('#btn-next-challenge').click();
  }
  await expect(page.locator('#math-progress-save-notice')).toBeVisible();
  await page.evaluate(() => { Storage.prototype.setItem=window.originalSetItem; });
  await page.locator('#math-progress-save-notice button').click(); await page.reload();
  expect(await page.evaluate(() => PageProgress.isDone('area-units'))).toBe(true);
});
