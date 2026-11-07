const { test, expect } = require('@playwright/test');
const url = '/science/magnets.html';

async function relation(page) {
  return page.evaluate(() => {
    const left = magnets[0].northPole, rightN = magnets[1].northPole, rightS = magnets[1].southPole;
    return { facing: Math.hypot(left.x-rightN.x, left.y-rightN.y) < Math.hypot(left.x-rightS.x, left.y-rightS.y) ? 'NN' : 'NS', distance: magnets[1].x-magnets[0].x };
  });
}

test('磁极预设、翻转及距离滑杆与图示一致', async ({ page }) => {
  await page.goto(url);
  const tab = page.getByRole('button', { name: '🧲 磁极互动' });
  await tab.focus(); await page.keyboard.press('Enter');
  expect(await relation(page)).toEqual({facing:'NS', distance:200});
  await expect(page.locator('#poleStatus')).toContainText('异极相吸');
  const slider = page.getByRole('slider', {name:'磁铁中心距离'});
  await slider.fill('130');
  expect(await relation(page)).toEqual({facing:'NS', distance:130});
  await expect(page.locator('#distanceVal')).toHaveText('130px');
  await page.getByRole('button', {name:'同极相斥'}).click();
  expect(await relation(page)).toEqual({facing:'NN', distance:200});
  await expect(page.locator('#poleStatus')).toContainText('同极相斥');
  await page.getByRole('button', {name:'翻转右侧磁铁'}).click();
  expect(await relation(page)).toEqual({facing:'NS', distance:200});
  await expect(page.locator('#canvas')).toHaveAttribute('aria-label', /异极相吸/);
  await slider.fill('300');
  expect(await relation(page)).toEqual({facing:'NS', distance:300});
  await expect(page.locator('#poleStatus')).toContainText('300 像素');
});

test('拖动右侧磁铁与滑杆同步且不发生重叠', async ({ page }) => {
  await page.goto(url);
  await page.getByRole('button', {name:'🧲 磁极互动'}).click();
  const rect = await page.locator('#canvas').boundingBox();
  const x = rect.x + rect.width * 450 / 700, y = rect.y + rect.height * 280 / 560;
  await page.mouse.move(x,y); await page.mouse.down();
  await page.mouse.move(rect.x + rect.width * 320 / 700,y); await page.mouse.up();
  expect((await relation(page)).distance).toBe(130);
  await expect(page.getByRole('slider', {name:'磁铁中心距离'})).toHaveValue('130');
});

test('不同物品可用键盘测试并如实反馈', async ({ page }) => {
  await page.goto(url);
  await page.getByRole('button', {name:'🔬 磁铁实验'}).click();
  const nail = page.getByRole('button', {name:'测试铁钉'});
  await nail.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#objectFeedback')).toContainText('铁钉可被磁铁明显吸引');
  expect(await page.evaluate(() => testObjects.find(o=>o.name==='铁钉').attracted)).toBe(true);
  await page.getByRole('button', {name:'测试木块'}).click();
  await expect(page.locator('#objectFeedback')).toContainText('木块通常不会被普通磁铁明显吸引');
  await page.getByRole('button', {name:'隔物吸铁'}).click();
  await expect(page.locator('#objectButtons')).toBeHidden();
  await page.getByRole('button', {name:'吸引测试'}).click();
  await expect(page.locator('#objectButtons')).toBeVisible();
  expect(await page.evaluate(() => testObjects.find(o=>o.name==='铁钉').attracted)).toBe(false);
  await page.getByRole('button', {name:'✨ 磁场可视化'}).click();
  await expect(page.locator('#section-field')).toContainText('曲线数量不代表磁场强弱');
  const finite = await page.evaluate(() => {
    const pole = magnets[0].northPole;
    ironFilings = [{x:pole.x,y:pole.y,vx:0,vy:0}];
    drawIronFilings(ctx);
    return Number.isFinite(ironFilings[0].x) && Number.isFinite(ironFilings[0].y);
  });
  expect(finite).toBe(true);
});

async function keyboardClick(page, locator) {
  await locator.focus();
  await page.keyboard.press('Enter');
}

async function visitAllAndAnswer(page) {
  for (const section of ['poles', 'field', 'experiment', 'quiz'])
    await keyboardClick(page, page.locator(`[data-section="${section}"]`));
  for (const [index, answer] of [1, 2, 1, 1, 1].entries()) {
    await keyboardClick(page, page.locator('#quizOpts button').nth(answer));
    if (index < 4) await keyboardClick(page, page.locator('#nextBtn'));
  }
}

test('跳题不误报完成，答错可重新开始并用键盘完成', async ({page}) => {
  await page.goto(url);
  await keyboardClick(page, page.locator('[data-section="quiz"]'));
  for (let i = 0; i < 4; i++) await keyboardClick(page, page.locator('#nextBtn'));
  await keyboardClick(page, page.locator('#nextBtn'));
  await expect(page.locator('#quizFeedback')).toContainText('已作答 0/5');
  await expect(page.locator('#quizFeedback')).toContainText('返回未作答');
  await keyboardClick(page, page.locator('#retryQuiz'));
  await keyboardClick(page, page.locator('#quizOpts button').first());
  await keyboardClick(page, page.locator('#quizOpts button').nth(1));
  await expect(page.locator('#quizFeedback')).toContainText('首次未答对');
  expect(await page.evaluate(() => PageProgress.isDone('magnets'))).toBe(false);
  await keyboardClick(page, page.locator('#retryQuiz'));
  await visitAllAndAnswer(page);
  await expect(page.locator('#done-mark')).toHaveText('✓ 已完成');
  await page.reload();
  await expect(page.locator('#done-mark')).toBeVisible();
});

test('保存失败不误报，重新开始后仍可重试保存', async ({page}) => {
  await page.addInitScript(() => {
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('denied'); };
  });
  await page.goto(url);
  await visitAllAndAnswer(page);
  await expect(page.locator('#done-mark')).toContainText('进度未保存');
  await expect(page.locator('#retrySave')).toBeVisible();
  await keyboardClick(page, page.locator('#retryQuiz'));
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
  await keyboardClick(page, page.locator('#retrySave'));
  await expect(page.locator('#done-mark')).toHaveText('✓ 已完成');
  await expect(page.locator('#retrySave')).toBeHidden();
  await page.reload();
  await expect(page.locator('#done-mark')).toBeVisible();
});
