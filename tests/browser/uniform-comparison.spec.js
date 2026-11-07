const {test, expect} = require('@playwright/test');

test('三辆车独立按速度运动，切换查看车辆不改变轨迹', async ({page}) => {
  await page.addInitScript(() => {
    let now = 0, id = 0;
    const pending = new Map();
    window.requestAnimationFrame = fn => { pending.set(++id, fn); return id; };
    window.cancelAnimationFrame = key => pending.delete(key);
    window.stepComparison = ms => { now += ms; const frames = [...pending.values()]; pending.clear(); frames.forEach(fn => fn(now)); };
    const originalClear = CanvasRenderingContext2D.prototype.clearRect;
    const originalRoundRect = CanvasRenderingContext2D.prototype.roundRect;
    CanvasRenderingContext2D.prototype.clearRect = function(...args) {
      if (this.canvas.id === 'mainCanvas') window.comparisonCars = [];
      return originalClear.apply(this, args);
    };
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
      if (this.canvas.id === 'mainCanvas' && w === 40 && h === 24) window.comparisonCars.push(x + 20);
      return originalRoundRect.call(this, x, y, w, h, r);
    };
  });
  await page.goto('/physics/middle/motion.html');
  await page.getByRole('button', {name: '匀速运动'}).click();
  await page.locator('#btnUniStart').click();
  await page.evaluate(() => { window.stepComparison(0); window.stepComparison(2000); });
  expect(await page.evaluate(() => window.comparisonCars)).toEqual([112, 160, 240]);
  await expect(page.locator('#uniDist')).toContainText('4.0');
  await page.locator('[data-mode="medium"]').click();
  await expect(page.locator('#uniDist')).toContainText('10.0');
  expect(await page.evaluate(() => window.comparisonCars)).toEqual([112, 160, 240]);
  await page.locator('[data-mode="fast"]').click();
  await expect(page.locator('#uniDist')).toContainText('20.0');
  await page.evaluate(() => window.stepComparison(1000));
  await expect(page.locator('#uniTime')).toContainText('3.0');
  await expect(page.locator('#uniDist')).toContainText('30.0');
  expect(await page.evaluate(() => window.comparisonCars)).toEqual([128, 200, 320]);
});
