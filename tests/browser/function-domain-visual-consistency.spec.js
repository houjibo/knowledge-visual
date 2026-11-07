const {test, expect} = require('@playwright/test');

test('五种定义域图像共用坐标并支持键盘选择', async ({page}) => {
  await page.addInitScript(() => {
    window.paths = [];
    const originalMove = CanvasRenderingContext2D.prototype.moveTo;
    const originalLine = CanvasRenderingContext2D.prototype.lineTo;
    CanvasRenderingContext2D.prototype.moveTo = function(x,y) {
      if (this.canvas.id === 'domainCanvas' && this.lineWidth === 2.5) window.paths.push({kind:'move',x,y});
      return originalMove.call(this,x,y);
    };
    CanvasRenderingContext2D.prototype.lineTo = function(x,y) {
      if (this.canvas.id === 'domainCanvas' && this.lineWidth === 2.5) window.paths.push({kind:'line',x,y});
      return originalLine.call(this,x,y);
    };
  });
  await page.goto('/math/high/function.html');
  const choices = page.locator('#domainExplorer button');
  await expect(choices).toHaveCount(5);
  await expect(choices.first()).toHaveAttribute('aria-pressed','true');
  const containsPoint = (x,y) => page.evaluate(([x,y]) => window.paths.some(p => Math.abs(p.x-x)<0.01 && Math.abs(p.y-y)<0.01),[x,y]);
  expect(await containsPoint(136,132)).toBe(true);
  expect(await containsPoint(204,88)).toBe(true);
  const moves = await page.evaluate(() => window.paths.filter(p=>p.kind==='move'));
  expect(moves.length).toBe(2);
  expect(moves[0].x).toBeLessThan(170);
  expect(moves[1].x).toBeGreaterThan(170);
  for (const [index,x,y,domain] of [[1,170,110,'x ≥ 0'],[2,204,88,'全体实数'],[3,204,110,'x > 0'],[4,136,88,'R']]) {
    await page.evaluate(() => { window.paths=[]; });
    await choices.nth(index).focus();
    await page.keyboard.press(index % 2 ? 'Enter' : 'Space');
    await expect(choices.nth(index)).toBeFocused();
    await expect(choices.nth(index)).toHaveAttribute('aria-pressed','true');
    await expect(choices.nth(index)).toContainText(domain);
    expect(await containsPoint(x,y)).toBe(true);
  }
  const canvas = page.locator('#domainCanvas');
  const width = await canvas.evaluate(el => el.getBoundingClientRect().width);
  expect(width).toBeLessThanOrEqual(page.viewportSize().width);
});
