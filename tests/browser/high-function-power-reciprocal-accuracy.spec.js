const {test, expect} = require('@playwright/test');

test('整数幂和反比例函数的曲线与性质在边界保持一致', async ({page}) => {
  await page.addInitScript(() => {
    window.graphPoints = [];
    const line = CanvasRenderingContext2D.prototype.lineTo;
    CanvasRenderingContext2D.prototype.lineTo = function(x,y) {
      if (this.canvas.id === 'graphCanvas' && this.strokeStyle === '#ffd200') window.graphPoints.push([x,y]);
      return line.call(this,x,y);
    };
  });
  await page.goto('/math/high/function.html');
  await page.getByRole('button',{name:'图像探索'}).click();
  await page.locator('#funcType').selectOption('power');
  const slider = page.locator('#paramA');
  const info = id => page.locator(`#info${id}`);
  const point = async (x,y) => page.evaluate(([x,y]) => window.graphPoints.some(p => Math.abs(p[0]-x)<0.01 && Math.abs(p[1]-y)<0.01),[x,y]);
  await page.evaluate(() => { window.graphPoints=[]; });
  await slider.fill('-2');
  await expect(info('Domain')).toHaveText('x ≠ 0');
  await expect(info('Range')).toHaveText('(0,+∞)');
  await expect(info('Parity')).toHaveText('偶函数');
  await expect(info('Mono')).toHaveText('(-∞,0)↑ (0,+∞)↓');
  expect(await point(135,112.5)).toBe(true);
  await slider.fill('-1');
  await expect(info('Parity')).toHaveText('奇函数');
  await expect(info('Range')).toHaveText('y ≠ 0');
  await slider.fill('0');
  await expect(info('Domain')).toHaveText('x ≠ 0');
  await expect(info('Range')).toHaveText('{1}');
  await expect(info('Mono')).toContainText('常数 1');
  await slider.fill('1');
  await expect(info('Domain')).toHaveText('R');
  await expect(info('Mono')).toHaveText('R上递增↑');
  await page.locator('#funcType').selectOption('inverse');
  await page.evaluate(() => { window.graphPoints=[]; });
  await page.locator('#paramA').fill('1');
  expect(await point(135,187.5)).toBe(true);
  await page.locator('#paramA').fill('0');
  await expect(info('Domain')).toHaveText('x ≠ 0');
  await expect(info('Range')).toHaveText('{0}');
  await expect(info('Parity')).toHaveText('既奇又偶');
  await expect(info('Mono')).toContainText('常数 0');
  await page.locator('#paramA').fill('-1');
  await expect(info('Mono')).toHaveText('各区间上递增');
});
