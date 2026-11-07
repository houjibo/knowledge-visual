const {test, expect} = require('@playwright/test');
const url = '/math/topics/triangle-area/index.html';

const points = text => text.trim().split(/\s+/).map(p => p.split(',').map(Number));
const nearPoint = (actual, expected) => { expect(actual[0]).toBeCloseTo(expected[0], 5); expect(actual[1]).toBeCloseTo(expected[1], 5); };

test('不同底、高和顶点位置下拼图保留原三角形并在画布内', async ({page}) => {
  await page.goto(url);
  await page.locator('[data-mode="explore"]').click();
  for (const base of [2, 12]) for (const height of [2, 10]) for (const apex of [-3, 0, 3]) {
    await page.getByLabel('底边长度').fill(String(base));
    await page.getByLabel('高度', {exact: true}).fill(String(height));
    await page.getByLabel('顶点位置').fill(String(apex));
    await page.locator('#btnShowTri').click();
    const triangle = points(await page.locator('#exploreSvg polygon').getAttribute('points'));
    await expect(page.locator('#resArea')).toHaveText(`${base * height / 2} cm²`);
    await page.locator('#btnShowDouble').click();
    const para = points(await page.locator('#exploreSvg polygon').getAttribute('points'));
    nearPoint(para[0], triangle[0]); nearPoint(para[1], triangle[1]); nearPoint(para[3], triangle[2]);
    nearPoint([para[2][0]-para[3][0], para[2][1]-para[3][1]], [para[1][0]-para[0][0], para[1][1]-para[0][1]]);
    for (const [x,y] of para) { expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThanOrEqual(300); expect(y).toBeGreaterThanOrEqual(0); expect(y).toBeLessThanOrEqual(220); }
    const divider = page.locator('#exploreSvg line').first();
    nearPoint([Number(await divider.getAttribute('x1')), Number(await divider.getAttribute('y1'))], triangle[1]);
    nearPoint([Number(await divider.getAttribute('x2')), Number(await divider.getAttribute('y2'))], triangle[2]);
    const altitude = page.locator('#exploreSvg .height-line');
    nearPoint([Number(await altitude.getAttribute('x1')), Number(await altitude.getAttribute('y1'))], triangle[2]);
    nearPoint([Number(await altitude.getAttribute('x2')), Number(await altitude.getAttribute('y2'))], [triangle[2][0], triangle[0][1]]);
  }
});

test('静态拼图的两个三角形相同且拼成平行四边形', async ({page}) => {
  await page.goto(url);
  const svgs = page.locator('.step-card svg');
  const a = points(await svgs.nth(1).locator('polygon').nth(0).getAttribute('points'));
  const b = points(await svgs.nth(1).locator('polygon').nth(1).getAttribute('points'));
  const lengths = p => p.map((v,i)=>Math.hypot(v[0]-p[(i+1)%3][0], v[1]-p[(i+1)%3][1])).sort((x,y)=>x-y);
  expect(lengths(a)).toEqual(lengths(b));
  const p = points(await svgs.nth(2).locator('polygon').getAttribute('points'));
  nearPoint([p[1][0]-p[0][0],p[1][1]-p[0][1]], [p[2][0]-p[3][0],p[2][1]-p[3][1]]);
  nearPoint([p[3][0]-p[0][0],p[3][1]-p[0][1]], [p[2][0]-p[1][0],p[2][1]-p[1][1]]);
});

test('五类题目选项唯一、只计一次并保留反馈', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="quiz"]').click();
  const cases = [[0, '2 cm²'], [0.21, '2 cm'], [0.41, '2 cm'], [0.61, '❌ 不对，应该是 6 cm²'], [0.81, '① = ②']];
  for (let i = 0; i < cases.length; i++) {
    const [kind, correct] = cases[i];
    await page.evaluate(value => { let first = true; Math.random = () => { if (first) { first = false; return value; } return 0; }; genQuiz(); }, kind);
    const options = page.locator('#quizOptions button');
    const expectedCount = i === 4 ? 3 : 4;
    await expect(options).toHaveCount(expectedCount);
    expect(new Set(await options.allTextContents()).size).toBe(expectedCount);
    const answer = options.getByText(correct, {exact:true});
    await answer.click();
    await expect(answer).toBeDisabled();
    await answer.dispatchEvent('click');
    await expect(page.locator('#quizCorrect')).toHaveText(String(i + 1));
    await expect(page.locator('#quizTotal')).toHaveText(String(i + 1));
    await expect(page.locator('#quizFeedback')).toContainText('答对');
    await expect(page.locator('#quizNext')).toBeVisible();
  }
});

test('生活题答错后显示完整公式和单位', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="life"]').click();
  await page.getByLabel('生活题面积答案').fill('0');
  await page.locator('#lifeCheckBtn').click();
  await expect(page.locator('#lifeAnswer')).toContainText('3 × 2 ÷ 2 = 3 m²');
  await page.getByLabel('生活题面积答案').fill('3');
  await page.locator('#lifeCheckBtn').click();
  await expect(page.locator('#lifeFeedback')).toContainText('正确');
  await expect(page.locator('#lifeAnswer')).toBeHidden();
});

async function finishTriangleArea(page) {
  await page.locator('[data-mode="explore"]').click();
  await page.locator('#btnShowDouble').click();
  await page.locator('[data-mode="quiz"]').click();
  for (let i = 0; i < 3; i++) {
    await page.locator('#quizOptions button').getByText('2 cm²', {exact: true}).click();
    if (i < 2) await page.locator('#quizNext').click();
  }
  await page.locator('[data-mode="life"]').click();
  await page.getByLabel('生活题面积答案').fill('3');
  await page.locator('#lifeCheckBtn').click();
}

test('探索、三道练习与生活题完成后写入知识地图', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await expect(page.locator('#learningProgress')).toContainText('0/3');
  await page.locator('[data-mode="explore"]').click();
  await page.locator('#btnShowDouble').click();
  await expect(page.locator('#learningProgress')).toContainText('1/3');
  await expect(page.locator('#learningProgress')).toContainText('刷新会清空本次阶段进度');
  expect(await page.evaluate(() => PageProgress.isDone('triangle-area'))).toBe(false);
  await page.reload();
  await expect(page.locator('#learningProgress')).toContainText('0/3');
  await finishTriangleArea(page);
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.reload();
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.goto('/math/index.html');
  await expect(page.locator('a.topic-node[href="topics/triangle-area/index.html"] .progress-badge')).toHaveText('✓');
});

test('学习达标但保存失败时可恢复重试', async ({page}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('denied'); };
  });
  await page.goto(url);
  await finishTriangleArea(page);
  await expect(page.locator('#learningProgress')).toContainText('尚未保存');
  await expect(page.locator('#math-progress-save-notice')).toContainText('暂未保存');
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
  await page.locator('#math-progress-save-notice button').click();
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.reload();
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
});
