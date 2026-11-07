const {test, expect} = require('@playwright/test');
const url = '/math/topics/trapezoid-area/index.html';
test('四类练习选项唯一，求底高用长度单位且只计一次', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="quiz"]').click();
  for (const [index, kind, answer, count] of [[0,0,'5 cm²',4],[1,0.26,'2 cm',4],[2,0.51,'❌ 不对，应该是 7 cm²',2],[3,0.76,'2 cm',4]]) {
    await page.evaluate(value => { let first=true; Math.random=()=>{if(first){first=false;return value;} return 0;}; genQuiz(); }, kind);
    const options = page.locator('#quizOptions button');
    await expect(options).toHaveCount(count);
    expect(new Set(await options.allTextContents()).size).toBe(count);
    const correct = options.getByText(answer, {exact:true});
    await correct.click();
    await expect(correct).toBeDisabled();
    await correct.dispatchEvent('click');
    await expect(page.locator('#quizCorrect')).toHaveText(String(index + 1));
    await expect(page.locator('#quizTotal')).toHaveText(String(index + 1));
    await expect(page.locator('#quizFeedback')).toContainText('答对');
  }
});

test('生活题单位随场景变化，答案必须精确', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="life"]').click();
  await expect(page.locator('#lifeUnit')).toHaveText('m²');
  await page.getByLabel('生活题面积答案').fill('12.5');
  await page.locator('#lifeCheckBtn').click();
  await expect(page.locator('#lifeAnswer')).toContainText('(3 + 5) × 3 ÷ 2 = 12 m²');
  await page.getByLabel('生活题面积答案').fill('12');
  await page.locator('#lifeCheckBtn').click();
  await expect(page.locator('#lifeFeedback')).toContainText('正确');
  await page.locator('#lifeNext').click();
  await expect(page.locator('#lifeUnit')).toHaveText('cm²');
  await page.locator('#lifeNext').click();
  await expect(page.locator('#lifeUnit')).toHaveText('m²');
});

async function finish(page) {
  await page.locator('[data-mode="explore"]').click();
  await page.locator('#btnShowDouble').click();
  await page.locator('[data-mode="quiz"]').click();
  for (let i=0; i<3; i++) {
    await page.locator('#quizOptions button').getByText('5 cm²', {exact:true}).click();
    if (i<2) await page.locator('#quizNext').click();
  }
  await page.locator('[data-mode="life"]').click();
  await page.getByLabel('生活题面积答案').fill('12');
  await page.locator('#lifeCheckBtn').click();
}

test('完成三项活动后保存并在地图显示', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await expect(page.locator('#learningProgress')).toContainText('0/3');
  await page.locator('[data-mode="explore"]').click();
  await page.locator('#btnShowDouble').click();
  await expect(page.locator('#learningProgress')).toContainText('1/3');
  expect(await page.evaluate(() => PageProgress.isDone('trapezoid-area'))).toBe(false);
  await page.reload();
  await expect(page.locator('#learningProgress')).toContainText('0/3');
  await finish(page);
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.reload();
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.goto('/math/index.html');
  await expect(page.locator('a.topic-node[href="topics/trapezoid-area/index.html"] .progress-badge')).toHaveText('✓');
});

test('进度保存失败后可恢复重试', async ({page}) => {
  await page.addInitScript(() => { Math.random=()=>0; window.originalSetItem=Storage.prototype.setItem; Storage.prototype.setItem=()=>{throw new Error('denied');}; });
  await page.goto(url);
  await finish(page);
  await expect(page.locator('#learningProgress')).toContainText('尚未保存');
  await page.evaluate(() => { Storage.prototype.setItem=window.originalSetItem; });
  await page.locator('#math-progress-save-notice button').click();
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.reload();
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
});
