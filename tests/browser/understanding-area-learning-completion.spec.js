const {test, expect} = require('@playwright/test');
const url = '/math/topics/understanding-area/index.html';

async function complete(page) {
  await page.locator('.mode-tab[data-mode="compare"]').click();
  for (let i=0; i<3; i++) {
    const answer = await page.evaluate(() => cmpAnswer);
    await page.locator(`.compare-opt[data-answer="${answer}"]`).click();
    if (i<2) await page.locator('#btn-next-compare').click();
  }
  await page.locator('.mode-tab[data-mode="tile"]').click();
  const count = await page.locator('#tile-grid button.tile-cell').count();
  await page.getByLabel('需要的小方块数量').fill(String(count)); await page.locator('#btn-check-tile').click();
  await page.locator('.mode-tab[data-mode="judge"]').click();
  for (let i=0; i<3; i++) {
    const answer = await page.evaluate(() => judgeQuestions[(jdgIdx-1) % judgeQuestions.length].answer);
    await page.locator(`.judge-btn[data-answer="${answer}"]`).click();
    if (i<2) await page.locator('#btn-next-judge').click();
  }
}

test('三类活动达标后持久保存并在地图显示', async ({page}) => {
  await page.goto(url);
  await expect(page.locator('#learningProgress')).toContainText('0/3');
  await page.locator('.mode-tab[data-mode="tile"]').click();
  await page.getByLabel('需要的小方块数量').fill(String(await page.locator('#tile-grid button.tile-cell').count()));
  await page.locator('#btn-check-tile').click(); await expect(page.locator('#learningProgress')).toContainText('1/3');
  await page.reload(); await expect(page.locator('#learningProgress')).toContainText('0/3');
  await complete(page); await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.reload(); await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.goto('/math/index.html'); await expect(page.locator('a.topic-node[href="topics/understanding-area/index.html"] .progress-badge')).toHaveText('✓');
});

test('答对后保留题目和解析直到主动换题', async ({page}) => {
  await page.goto(url); await page.locator('.mode-tab[data-mode="judge"]').click();
  const answer = await page.evaluate(() => judgeQuestions[(jdgIdx-1) % judgeQuestions.length].answer);
  await page.locator(`.judge-btn[data-answer="${answer}"]`).click();
  const text = await page.locator('#judge-explain').textContent();
  await page.waitForTimeout(1700); await expect(page.locator('#judge-explain')).toHaveText(text);
  await expect(page.locator('#jdg-score')).toHaveText('✅1');
  await page.locator('#btn-next-judge').click(); await expect(page.locator('#jdg-progress-text')).toHaveText('第 2 题');
});

test('完成记录保存失败后可重试', async ({page}) => {
  await page.addInitScript(() => { window.oldSet=Storage.prototype.setItem; Storage.prototype.setItem=()=>{throw Error('denied');}; });
  await page.goto(url); await complete(page);
  await expect(page.locator('#learningProgress')).toContainText('尚未保存');
  await page.evaluate(() => { Storage.prototype.setItem=window.oldSet; });
  await page.locator('#math-progress-save-notice button').click(); await page.reload();
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
});
