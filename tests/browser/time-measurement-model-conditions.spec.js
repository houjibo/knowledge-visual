const {test, expect} = require('@playwright/test');

test('日影限定地点与太阳时，单摆长度周期可验证', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('/science/time-measurement.html');
  await expect(page.locator('.panel').first()).toContainText('北京附近');
  await page.getByRole('slider', {name: '太阳时（时）'}).fill('9');
  await expect(page.locator('#infoMain')).toContainText('西');
  await page.getByRole('slider', {name: '太阳时（时）'}).fill('12');
  await expect(page.locator('#infoMain')).toContainText('北');
  await page.getByRole('button', {name: '🕰️ 摆钟'}).click();
  await expect(page.getByRole('button', {name: '🕰️ 摆钟'})).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', {name: '继续动画'})).toBeVisible();
  await page.getByRole('slider', {name: '摆长档位'}).fill('3');
  await expect(page.locator('#valLen')).toHaveText('1.00 m');
  await expect(page.locator('#infoMain')).toContainText('2.01 s');
  const periods = await page.evaluate(() => [pendulumPeriod(1), pendulumPeriod(3), pendulumPeriod(5)]);
  expect(periods[0]).toBeLessThan(periods[1]); expect(periods[1]).toBeLessThan(periods[2]);
});

test('水钟到满停止，重置并显示模拟时间', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('/science/time-measurement.html');
  await page.getByRole('button', {name: '💧 水钟'}).click();
  const step = page.getByRole('button', {name: '推进一步'});
  for (let i = 0; i < 11; i++) await step.click();
  await expect(page.locator('#infoSub')).toContainText('60 分钟（已满）');
  await step.click();
  await expect(page.locator('#infoSub')).toContainText('60 分钟（已满）');
  await expect(page.locator('#timeCanvas')).toHaveAttribute('aria-label', /受水壶已满/);
  await page.getByRole('button', {name: '重新开始'}).click();
  await expect(page.locator('#infoSub')).toContainText('0 分钟');
});
