const {test, expect} = require('@playwright/test');

test('机械运动按浏览器时钟推进', async ({page}) => {
  await page.goto('/physics/middle/motion.html');
  const start = await page.evaluate(() => performance.now());
  await page.locator('#btnStart').click();
  await expect.poll(() => page.evaluate(() => conceptState.time), {timeout: 5000}).toBeGreaterThanOrEqual(1);
  await page.locator('#btnStart').click();
  const state = await page.evaluate(() => ({time: conceptState.time, distance: conceptState.dist, end: performance.now()}));
  expect(state.distance).toBeCloseTo(state.time * 5, 5);
  expect(Math.abs(state.time - (state.end - start) / 1000)).toBeLessThan(0.5);
});
