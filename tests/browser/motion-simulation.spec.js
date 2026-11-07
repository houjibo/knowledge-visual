const {test, expect} = require('@playwright/test');

test.beforeEach(async ({page}) => {
  await page.addInitScript(() => {
    let id = 0;
    const pending = new Map();
    window.requestAnimationFrame = fn => { pending.set(++id, fn); return id; };
    window.cancelAnimationFrame = key => pending.delete(key);
    window.stepMotionFrame = () => {
      const frames = [...pending.values()]; pending.clear(); frames.forEach(fn => fn(performance.now()));
      return pending.size;
    };
    window.pendingMotionFrames = () => pending.size;
  });
});

test('切换模式暂停并能继续，快速重置不会叠加动画', async ({page}) => {
  await page.goto('/physics/middle/motion.html');
  await page.locator('#btnStart').click();
  await page.evaluate(() => window.stepMotionFrame());
  const time = await page.locator('#dispTime').textContent();
  await page.getByRole('button', {name: '匀速运动'}).click();
  expect(await page.evaluate(() => window.pendingMotionFrames())).toBe(0);
  await page.getByRole('button', {name: '速度概念'}).click();
  await expect(page.locator('#dispTime')).toHaveText(time);
  await expect(page.locator('#btnStart')).toContainText('继续');
  await page.locator('#btnStart').click();
  expect(await page.evaluate(() => window.pendingMotionFrames())).toBe(1);
  await page.locator('#btnReset').click();
  await page.locator('#btnStart').click();
  expect(await page.evaluate(() => window.pendingMotionFrames())).toBe(1);
  await page.locator('#btnStart').click();
  expect(await page.evaluate(() => window.pendingMotionFrames())).toBe(0);
});

test('图像调速后清空旧记录，十秒后能重绘', async ({page}) => {
  await page.goto('/physics/middle/motion.html');
  await page.getByRole('button', {name: '运动图像'}).click();
  await page.locator('#btnGraphStart').click();
  await page.evaluate(() => { for (let i = 0; i < 5; i++) window.stepMotionFrame(); });
  expect(await page.evaluate(() => graphState.points.length)).toBeGreaterThan(0);
  await page.locator('#graphSpeed').fill('12');
  expect(await page.evaluate(() => ({length: graphState.points.length, t: graphState.t, pending: window.pendingMotionFrames()}))).toEqual({length: 0, t: 0, pending: 0});
  await expect(page.getByText('调整速度会清除已有图像，请重新绘制。')).toBeVisible();
  await page.locator('#btnGraphStart').click();
  await page.evaluate(() => { for (let i = 0; i < 105; i++) window.stepMotionFrame(); });
  const end = await page.evaluate(() => ({t: graphState.t, last: graphState.points.at(-1), running: graphState.running}));
  expect(end.t).toBe(10);
  expect(end.last.s).toBeCloseTo(120, 5);
  expect(end.running).toBe(false);
  await page.locator('#btnGraphStart').click();
  expect(await page.evaluate(() => graphState.t)).toBeLessThan(1);
});
