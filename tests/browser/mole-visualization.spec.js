const {test, expect} = require('@playwright/test');

test('物质的量图示在整个范围随数值变化', async ({page}) => {
  await page.addInitScript(() => {
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    const arc = CanvasRenderingContext2D.prototype.arc;
    CanvasRenderingContext2D.prototype.clearRect = function(...args) {
      if (this.canvas.id === 'molCanvas') window.moleDots = 0;
      return clear.apply(this, args);
    };
    CanvasRenderingContext2D.prototype.arc = function(x, y, r, ...rest) {
      if (this.canvas.id === 'molCanvas' && r === 2.2) window.moleDots++;
      return arc.call(this, x, y, r, ...rest);
    };
  });
  await page.goto('/chemistry/high/mole-concept.html');
  const slider = page.getByLabel('物质的量 n');
  await slider.fill('0.5');
  expect(await page.evaluate(() => window.moleDots)).toBe(18);
  await expect(page.locator('#infoN')).toHaveText('3.01×10²³');
  await slider.fill('7');
  expect(await page.evaluate(() => window.moleDots)).toBe(252);
  await slider.fill('10');
  expect(await page.evaluate(() => window.moleDots)).toBe(360);
  await expect(page.locator('#infoM')).toHaveText('180.0 g');
  const nacl = page.getByRole('button', {name: 'NaCl (58.5)'});
  await nacl.focus();
  await page.keyboard.press('Space');
  await expect(nacl).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#infoEntity')).toHaveText('NaCl 组合单元');
  await expect(page.locator('#infoM')).toHaveText('585.0 g');
  await expect(page.getByText(/精确值为 6.02214076/)).toBeVisible();
});
