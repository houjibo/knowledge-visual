const {test, expect} = require('@playwright/test');

test('焦点随横纵半轴变化，圆和双曲线边界的图文一致', async ({page}) => {
  await page.addInitScript(() => {
    window.focusLabels = {};
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function(text, x, y, ...rest) {
      if (/^(E|H|F)[₁₂]$/.test(text)) window.focusLabels[text] = [x - 8, y + 8];
      return original.call(this, text, x, y, ...rest);
    };
  });
  await page.goto('/math/high/conic-sections.html');
  const ranges = page.locator('#controls input[type=range]');
  await ranges.nth(0).fill('3');
  await ranges.nth(1).fill('5');
  await expect(page.locator('#infoGrid')).toContainText('椭圆离心率 0.800');
  await expect(page.locator('#infoGrid')).toContainText('椭圆焦点 (0, ±4.00)');
  await expect.poll(() => page.evaluate(() => window.focusLabels['E₁'])).toEqual([360, 140]);
  await expect.poll(() => page.evaluate(() => window.focusLabels['E₂'])).toEqual([360, 460]);
  await page.getByRole('button', {name: '🔴 椭圆'}).click();
  await expect(page.locator('#infoGrid')).toContainText('焦点 (0, ±4.00)');
  await expect(page.locator('#infoGrid')).toContainText('准线 y = ±6.25');
  await expect.poll(() => page.evaluate(() => window.focusLabels['F₁'])).toEqual([360, 140]);
  await ranges.nth(1).fill('3');
  await expect(page.locator('#panelTitle')).toContainText('圆');
  await expect(page.locator('#infoGrid')).toContainText('离心率 e = 0.000');
  await expect(page.locator('#infoGrid')).toContainText('圆无有限准线');
  await expect(page.locator('#infoGrid')).not.toContainText(/NaN|Infinity/);
  await page.getByRole('button', {name: '🟢 双曲线'}).click();
  await ranges.nth(1).fill('4');
  await expect(page.locator('#infoGrid')).toContainText('焦点 (±5.00, 0)');
  await expect.poll(() => page.evaluate(() => window.focusLabels['F₁'])).toEqual([560, 300]);
  await expect.poll(() => page.evaluate(() => window.focusLabels['F₂'])).toEqual([160, 300]);
  await expect(page.getByText('🎯 曲线轨迹')).toBeVisible();
});
