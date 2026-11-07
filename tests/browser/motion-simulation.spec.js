const {test, expect} = require('@playwright/test');

test.beforeEach(async ({page}) => {
  await page.addInitScript(() => {
    let id = 0;
    let now = 0;
    const pending = new Map();
    window.requestAnimationFrame = fn => { pending.set(++id, fn); return id; };
    window.cancelAnimationFrame = key => pending.delete(key);
    window.stepMotionFrame = (ms = 50) => {
      now += ms;
      const frames = [...pending.values()]; pending.clear(); frames.forEach(fn => fn(now));
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
  await page.evaluate(() => { for (let i = 0; i < 105; i++) window.stepMotionFrame(100); });
  const end = await page.evaluate(() => ({t: graphState.t, last: graphState.points.at(-1), running: graphState.running}));
  expect(end.t).toBe(10);
  expect(end.last.s).toBeCloseTo(120, 5);
  expect(end.running).toBe(false);
  await page.locator('#btnGraphStart').click();
  expect(await page.evaluate(() => graphState.t)).toBeLessThan(1);
});

for (const fps of [30, 144]) {
  test(`速度概念在 ${fps} 帧率下一秒运动五米`, async ({page}) => {
    await page.goto('/physics/middle/motion.html');
    await page.locator('#btnStart').click();
    await page.evaluate(fps => {
      window.stepMotionFrame(0);
      for (let i = 0; i < fps; i++) window.stepMotionFrame(1000 / fps);
    }, fps);
    const state = await page.evaluate(() => ({time: conceptState.time, dist: conceptState.dist}));
    expect(state.time).toBeCloseTo(1, 5);
    expect(state.dist).toBeCloseTo(5, 5);
    await page.locator('#btnStart').click();
    await page.evaluate(() => window.stepMotionFrame(10000));
    await page.locator('#btnStart').click();
    await page.evaluate(() => { window.stepMotionFrame(10000); window.stepMotionFrame(1000); });
    expect(await page.evaluate(() => conceptState.time)).toBeCloseTo(2, 5);
  });
}

test('匀速模式倍率与车回绕不重置累计路程', async ({page}) => {
  await page.goto('/physics/middle/motion.html');
  await page.getByRole('button', {name: '匀速运动'}).click();
  await page.locator('[data-mode="fast"]').click();
  await page.locator('#timeScale').fill('5');
  await page.locator('#btnUniStart').click();
  await page.evaluate(() => { window.stepMotionFrame(0); window.stepMotionFrame(3000); });
  const state = await page.evaluate(() => ({time: uniState.time, dist: uniState.dist, carX: uniState.carX}));
  expect(state.time).toBeCloseTo(15, 5);
  expect(state.dist).toBeCloseTo(150, 5);
  expect(state.carX).toBeGreaterThanOrEqual(80);
  expect(state.carX).toBeLessThan(750);
});

test('页面隐藏时自动暂停并保留读数', async ({page}) => {
  await page.goto('/physics/middle/motion.html');
  await page.locator('#btnStart').click();
  await page.evaluate(() => {
    window.stepMotionFrame(0);
    window.stepMotionFrame(1000);
    Object.defineProperty(document, 'hidden', {value: true, configurable: true});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(await page.evaluate(() => window.pendingMotionFrames())).toBe(0);
  await expect(page.locator('#btnStart')).toContainText('继续');
  expect(await page.evaluate(() => conceptState.time)).toBeCloseTo(1, 5);
});
