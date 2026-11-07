const {test, expect} = require('@playwright/test');

test('调速后设定速度、平均速度和公路刻度各自正确', async ({page}) => {
  await page.addInitScript(() => {
    let now = 0, id = 0;
    const pending = new Map();
    window.requestAnimationFrame = fn => { pending.set(++id, fn); return id; };
    window.cancelAnimationFrame = key => pending.delete(key);
    window.stepAverage = ms => { now += ms; const frames = [...pending.values()]; pending.clear(); frames.forEach(fn => fn(now)); };
  });
  await page.goto('/physics/middle/motion.html');
  await expect(page.locator('#dispAverage')).toHaveText('—');
  await page.locator('#btnStart').click();
  await page.evaluate(() => { window.stepAverage(0); window.stepAverage(1000); });
  await expect(page.locator('#dispAverage')).toHaveText('5.0 m/s');
  await page.getByLabel('🏃 速度调节').fill('10');
  await page.evaluate(() => window.stepAverage(1000));
  await expect(page.locator('#dispSpeed')).toContainText('10.0');
  await expect(page.locator('#dispDist')).toContainText('15.0');
  await expect(page.locator('#dispAverage')).toHaveText('7.5 m/s');
  expect(await page.evaluate(() => conceptState.carX)).toBeCloseTo(200, 5);
  await page.locator('#btnReset').click();
  await expect(page.locator('#dispAverage')).toHaveText('—');
  await page.locator('#btnStart').click();
  await page.evaluate(() => { window.stepAverage(0); window.stepAverage(1000); });
  expect(await page.evaluate(() => conceptState.carX)).toBeCloseTo(160, 5);
  await page.evaluate(() => window.stepAverage(8000));
  expect(await page.evaluate(() => conceptState.dist)).toBeCloseTo(90, 5);
  expect(await page.evaluate(() => conceptState.carX)).toBeCloseTo(160, 5);
});
