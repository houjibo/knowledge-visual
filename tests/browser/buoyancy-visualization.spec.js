const {test, expect} = require('@playwright/test');

test('沉浮图的浸入比例与液面位置一致', async ({page}) => {
  await page.addInitScript(() => {
    const original = CanvasRenderingContext2D.prototype.strokeRect;
    CanvasRenderingContext2D.prototype.strokeRect = function(x, y, w, h) {
      if (this.canvas.id === 'floatCanvas' && w === 88 && h === 88) window.lastObjectRect = {x, y, w, h};
      return original.call(this, x, y, w, h);
    };
  });
  await page.goto('/science/sink-float.html');
  await page.getByRole('button', {name: '🪵 木块'}).click();
  await expect(page.getByRole('button', {name: '🪵 木块'})).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', {name: '🟨 悬浮块'})).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#infoState')).toContainText('漂浮');
  await expect(page.locator('#infoSubmerged')).toContainText('50%');
  let rect = await page.evaluate(() => window.lastObjectRect);
  expect((rect.y + rect.h - 150) / rect.h).toBeCloseTo(.5, 5);
  const slider = page.getByLabel('液体密度（g/cm³）');
  await slider.fill('1.25');
  await expect(page.locator('#infoSubmerged')).toContainText('40%');
  rect = await page.evaluate(() => window.lastObjectRect);
  expect((rect.y + rect.h - 150) / rect.h).toBeCloseTo(.4, 5);
  await slider.fill('1');
  await page.getByRole('button', {name: '🟨 悬浮块'}).click();
  await expect(page.locator('#infoState')).toContainText('悬浮');
  await expect(page.locator('#infoSubmerged')).toContainText('100%');
  await page.getByRole('button', {name: '🔩 铁块'}).click();
  await expect(page.locator('#infoState')).toContainText('下沉');
  await expect(page.locator('#infoForce')).toContainText('浮力 < 重力');
  await expect(page.locator('#infoSubmerged')).toContainText('100%');
  await expect(page.getByText(/沉底时还受到容器向上的支持力/)).toBeVisible();
});
