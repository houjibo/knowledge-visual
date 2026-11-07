const {test, expect} = require('@playwright/test');

test('轨迹随曲线及参数更新，不接受任意画布点', async ({page}) => {
  await page.addInitScript(() => {
    window.trajectory = [];
    const move = CanvasRenderingContext2D.prototype.moveTo;
    const line = CanvasRenderingContext2D.prototype.lineTo;
    const stroke = CanvasRenderingContext2D.prototype.stroke;
    let path = [];
    CanvasRenderingContext2D.prototype.moveTo = function(x,y) { path = [[x,y]]; return move.call(this,x,y); };
    CanvasRenderingContext2D.prototype.lineTo = function(x,y) { path.push([x,y]); return line.call(this,x,y); };
    CanvasRenderingContext2D.prototype.stroke = function(...args) {
      if (String(this.strokeStyle).startsWith('rgba(251, 191, 36, 0.')) window.trajectory = path.slice();
      return stroke.apply(this,args);
    };
  });
  await page.goto('/math/high/conic-sections.html');
  const trajectory = page.getByRole('button', {name:'🎯 曲线轨迹'});
  await trajectory.focus();
  await page.keyboard.press('Enter');
  await expect(trajectory).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#trajectoryNote')).toContainText('椭圆轨迹');
  await expect.poll(() => page.evaluate(() => window.trajectory[0])).toEqual([560,300]);
  await page.locator('#controls input').first().fill('3');
  await expect.poll(() => page.evaluate(() => window.trajectory[0])).toEqual([480,300]);
  await page.locator('#cv').click({position:{x:30,y:30}});
  await expect.poll(() => page.evaluate(() => window.trajectory.length)).toBe(201);
  await page.getByRole('button', {name:'🟢 双曲线'}).click();
  await expect(page.locator('#trajectoryNote')).toContainText('右支');
  await expect.poll(() => page.evaluate(() => window.trajectory.length)).toBe(201);
  await expect.poll(() => page.evaluate(() => window.trajectory[100])).toEqual([480,300]);
  await page.getByRole('button', {name:'🟡 抛物线'}).click();
  await expect(page.locator('#trajectoryNote')).toContainText('当前曲线');
  await expect.poll(() => page.evaluate(() => window.trajectory.length)).toBe(161);
});

test('逐题锁定、手动切题及存储失败后重试', async ({page}) => {
  await page.addInitScript(() => {
    window.rejectProgress = true;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (window.rejectProgress && key === 'kv-math-progress-v2') throw new Error('storage unavailable');
      return original.call(this,key,value);
    };
  });
  await page.goto('/math/high/conic-sections.html');
  await page.getByRole('button',{name:'🎯 互动练习'}).click();
  const options = page.locator('#quizOpts button');
  await options.nth(0).click();
  await expect(options.nth(0)).toBeDisabled();
  await page.waitForTimeout(1800);
  await expect(page.locator('#quizQ')).toContainText('1/6');
  await expect(page.locator('#quizFb')).toContainText('已答对 0/6');
  for (const answer of [0,0,1,2,0]) {
    await page.getByRole('button',{name:'下一题'}).click();
    await options.nth(answer).click();
  }
  await expect(page.locator('#quizFb')).toContainText('已答对 5/6');
  await page.getByRole('button',{name:'下一题'}).click();
  await options.nth(1).click();
  await expect(page.locator('#quizFb')).toContainText('未保存');
  await expect(page.locator('#quizRetry')).toBeVisible();
  await page.evaluate(() => { window.rejectProgress = false; });
  await page.locator('#quizRetry').click();
  await expect(page.locator('#quizFb')).toContainText('已保存');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('kv-math-progress-v2')));
  expect(saved['high:conic-sections']).toBeTruthy();
});
