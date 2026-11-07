const {test, expect} = require('@playwright/test');
const url = '/math/middle/coordinate-plane.html';

test('滑块、指针、象限与对称点同步', async ({page}, testInfo) => {
  await page.goto(url);
  const x = page.getByLabel('横坐标 x'), y = page.getByLabel('纵坐标 y');
  await x.fill('-8'); await y.fill('0');
  await expect(page.locator('#infoCoord')).toHaveText('P (-8, 0)');
  await expect(page.locator('#infoQuad')).toHaveText('x 轴上');
  await expect(page.locator('#infoDx')).toHaveText('0');
  await expect(page.locator('#infoDy')).toHaveText('8');
  await x.focus(); await page.keyboard.press('ArrowRight');
  await y.fill('3');
  await expect(page.locator('#infoQuad')).toHaveText('第二象限');
  const sym = page.getByRole('button', {name:'关于原点'});
  await sym.focus(); await page.keyboard.press('Enter');
  await expect(sym).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#symResult')).toContainText('(7, -3)');
  await expect(page.locator('#planeCanvas')).toHaveAttribute('aria-label', /P \(-7, 3\).*\(7, -3\)/);
  const positions = await page.evaluate(() => {
    const p = CanvasRenderingContext2D.prototype, original = p.arc, points = [];
    p.arc = function(x, y, radius, ...rest) { if (radius === 7) points.push([x,y]); return original.call(this,x,y,radius,...rest); };
    try { draw(); return points; } finally { p.arc = original; }
  });
  expect(positions[0][0]).toBeCloseTo(360 + 7 * 560 / 18);
  expect(positions[0][1]).toBeCloseTo(280 + 3 * 560 / 18);
  expect(positions[1][0]).toBeCloseTo(360 - 7 * 560 / 18);
  expect(positions[1][1]).toBeCloseTo(280 - 3 * 560 / 18);
  const canvas = page.locator('#planeCanvas');
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  if (testInfo.project.name === 'mobile') await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  else await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(x).toHaveValue('0'); await expect(y).toHaveValue('0');
  await expect(page.locator('#infoQuad')).toHaveText('原点');
});

test('测验回看不重复计分，通关记录刷新后保留', async ({page}) => {
  await page.goto(url);
  const quiz = page.getByRole('button',{name:'🎯 测验'});
  await quiz.focus(); await page.keyboard.press('Enter');
  await expect(quiz).toHaveAttribute('aria-pressed','true');
  await page.locator('#quizStart').click();
  await page.locator('#quizOpts button').nth(1).click();
  for (let i = 0; i < 4; i++) {
    await page.locator('#quizNext').click(); await page.locator('#quizPrev').click();
    await expect(page.locator('#quizOpts button').nth(1)).toBeDisabled();
  }
  for (let i = 0; i < 5; i++) await page.locator('#quizNext').click();
  await expect(page.locator('#quizResult')).toContainText('1 / 5');
  await expect(page.locator('#done-mark')).toHaveText('');
  await page.locator('#quizStart').click();
  for (const index of [1,0,1,2,1]) {
    await page.locator('#quizOpts button').nth(index).click();
    await page.locator('#quizNext').click();
  }
  await expect(page.locator('#quizResult')).toContainText('5 / 5');
  await expect(page.locator('#done-mark')).toContainText('已完成');
  await page.reload(); await expect(page.locator('#done-mark')).toContainText('已完成');
});

test('存储失败不冒充已保存，练习不能通过键盘重复提交', async ({page}) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('denied'); }; });
  await page.goto(url);
  await page.getByRole('button',{name:'🧪 练习'}).click();
  await page.locator('#p1 button').nth(0).click();
  await expect(page.locator('#p1 .practice-fb')).toContainText('再想想');
  await expect(page.locator('#p1 button').nth(1)).toBeDisabled();
  await page.getByRole('button',{name:'🎯 测验'}).click();
  await page.locator('#quizStart').click();
  for (const index of [1,0,1,2,1]) {
    await page.locator('#quizOpts button').nth(index).click();
    await page.locator('#quizNext').click();
  }
  await expect(page.locator('#done-mark')).toContainText('进度未保存');
});
