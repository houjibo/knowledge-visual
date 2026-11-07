const {test, expect} = require('@playwright/test');

test('极值列表与标记一致，增减色带位于可见画布', async ({page}) => {
  await page.addInitScript(() => {
    window.analysisRects = [];
    window.extremaLabels = [];
    const rect = CanvasRenderingContext2D.prototype.fillRect;
    const text = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillRect = function(x,y,w,h) {
      if (String(this.fillStyle).startsWith('rgba(') && w === 5 && h === 600) window.analysisRects.push([this.fillStyle,x,y,w,h]);
      return rect.call(this,x,y,w,h);
    };
    CanvasRenderingContext2D.prototype.fillText = function(label,x,y,...rest) {
      if (label === '极大' || label === '极小') window.extremaLabels.push([label,x-8,y+8]);
      return text.call(this,label,x,y,...rest);
    };
  });
  await page.goto('/math/high/derivative.html');
  await page.getByRole('button',{name:'📊 函数分析'}).click();
  const info = page.locator('#infoGrid');
  await expect(info).toContainText('局部极值点（−5≤x≤5）');
  await expect(info).toContainText('极小(0.00, 0.00)');
  await expect.poll(() => page.evaluate(() => window.extremaLabels.some(p => p[0] === '极小' && p[1] === 360 && p[2] === 300))).toBe(true);
  await expect.poll(() => page.evaluate(() => window.analysisRects.some(p => p[0].startsWith('rgba(16, 185, 129') && p[2] === 0))).toBe(true);
  await expect.poll(() => page.evaluate(() => window.analysisRects.some(p => p[0].startsWith('rgba(239, 68, 68') && p[2] === 0))).toBe(true);
  await page.getByRole('button',{name:'x³', exact:true}).click();
  await expect(info).toContainText('局部极值点（−5≤x≤5）: 无');
  await page.getByRole('button',{name:'x³−3x', exact:true}).click();
  await expect(info).toContainText('极大(-1.00, 2.00)');
  await expect(info).toContainText('极小(1.00, -2.00)');
  await page.getByRole('button',{name:'sin(x)', exact:true}).click();
  await expect(info).toContainText('极大(-4.71, 1.00)');
  await expect(info).toContainText('极小(-1.57, -1.00)');
  await expect(info).toContainText('极大(1.57, 1.00)');
  await expect(info).toContainText('极小(4.71, -1.00)');
  await page.getByRole('button',{name:'ln(x)', exact:true}).click();
  await expect(info).toContainText('局部极值点（−5≤x≤5）: 无');
});
