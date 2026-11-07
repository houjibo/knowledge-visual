const {test, expect} = require('@playwright/test');
const url = '/math/topics/parallelogram-area/index.html';
const parse = text => text.trim().split(/\s+/).map(p => p.split(',').map(Number));
const near = (p,q) => { expect(p[0]).toBeCloseTo(q[0],5); expect(p[1]).toBeCloseTo(q[1],5); };

test('不同参数下的割补移动原三角形并保持面积和视窗范围', async ({page}) => {
  await page.goto(url);
  await page.locator('[data-mode="explore"]').click();
  for (const base of [3, 10]) for (const height of [2, 8]) for (const slant of [1, 4]) {
    await page.getByLabel('底边长度').fill(String(base));
    await page.getByLabel('高度', {exact:true}).fill(String(height));
    await page.getByLabel('水平错位').fill(String(slant));
    await page.locator('#btnShowPara').click();
    const para = parse(await page.locator('#exploreSvg polygon').getAttribute('points'));
    await expect(page.locator('#resArea')).toHaveText(`${base * height} cm²`);
    for (const [x,y] of para) { expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThanOrEqual(300); expect(y).toBeGreaterThanOrEqual(0); expect(y).toBeLessThanOrEqual(200); }
    await page.locator('#btnShowRect').click();
    const rect = page.locator('#exploreSvg rect');
    const x = Number(await rect.getAttribute('x')), y = Number(await rect.getAttribute('y'));
    const w = Number(await rect.getAttribute('width')), h = Number(await rect.getAttribute('height'));
    near([x,y], para[3]);
    near([w,h], [para[1][0]-para[0][0], para[0][1]-para[3][1]]);
    const moved = parse(await page.locator('#exploreSvg .moved-piece').getAttribute('points'));
    near(moved[0], para[1]); near(moved[1], [para[2][0], para[1][1]]); near(moved[2], para[2]);
  }
});

test('四类练习选项唯一，求底高用长度单位且只计一次', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="quiz"]').click();
  for (const [index, kind, answer, count] of [[0,0,'4 cm²',4],[1,0.26,'2 cm',4],[2,0.51,'2 cm',4],[3,0.76,'❌ 不对，应该是 6 cm²',2]]) {
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
  await expect(page.locator('#lifeAnswer')).toContainText('4 × 3 = 12 m²');
  await page.getByLabel('生活题面积答案').fill('12');
  await page.locator('#lifeCheckBtn').click();
  await expect(page.locator('#lifeFeedback')).toContainText('正确');
  await page.locator('#lifeNext').click();
  await expect(page.locator('#lifeUnit')).toHaveText('dm²');
  await page.locator('#lifeNext').click();
  await expect(page.locator('#lifeUnit')).toHaveText('cm²');
});

async function finish(page) {
  await page.locator('[data-mode="explore"]').click();
  await page.locator('#btnShowRect').click();
  await page.locator('[data-mode="quiz"]').click();
  for (let i=0; i<3; i++) {
    await page.locator('#quizOptions button').getByText('4 cm²', {exact:true}).click();
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
  await page.locator('#btnShowRect').click();
  await expect(page.locator('#learningProgress')).toContainText('1/3');
  expect(await page.evaluate(() => PageProgress.isDone('parallelogram-area'))).toBe(false);
  await page.reload();
  await expect(page.locator('#learningProgress')).toContainText('0/3');
  await finish(page);
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.reload();
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.goto('/math/index.html');
  await expect(page.locator('a.topic-node[href="topics/parallelogram-area/index.html"] .progress-badge')).toHaveText('✓');
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
