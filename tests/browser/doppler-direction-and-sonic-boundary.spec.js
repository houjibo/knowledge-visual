const {test, expect} = require('@playwright/test');

test('声源和观察者双向运动，声速边界不产生无穷或负频率', async ({page}) => {
  await page.goto('/physics/uni/doppler.html');
  const source = page.getByRole('slider', {name: '声源速度 vₛ（向右为正，m/s）', exact: true});
  const observer = page.getByRole('slider', {name: '观察者速度 vₒ（向左为正，m/s）', exact: true});
  await source.fill('0'); await observer.fill('0');
  await expect(page.locator('#calc-f')).toHaveText('500.0 Hz');
  await source.fill('100');
  await expect(page.locator('#calc-f')).toHaveText('708.3 Hz');
  await source.fill('-100');
  await expect(page.locator('#calc-f')).toHaveText('386.4 Hz');
  await source.fill('0'); await observer.fill('-100');
  await expect(page.locator('#calc-f')).toHaveText('352.9 Hz');
  await source.fill('340');
  await expect(page.locator('#calc-f')).toHaveText('不适用');
  await expect(page.locator('#calc-state')).toContainText('声速临界');
  await source.fill('-350');
  await expect(page.locator('#calc-f')).toHaveText('不适用');
  await expect(page.locator('#calc-state')).toContainText('超声速');
  await expect(page.locator('#calc-ma')).toHaveText('1.03');
});

test('靠近、远离与冲击波练习均可达，临界声速不算超声速', async ({page}) => {
  await page.goto('/physics/uni/doppler.html');
  await page.locator('[data-mode="practice"]').click();
  const source = page.getByRole('slider', {name: '练习声源速度 vₛ（向右为正，m/s）'});
  await expect(page.locator('#p-status')).toContainText('达成');
  await page.getByRole('button', {name: '远离（红移）'}).click();
  await source.fill('-100');
  await expect(page.locator('#p-status')).toContainText('达成');
  await page.getByRole('button', {name: '冲击波'}).click();
  await source.fill('340');
  await expect(page.locator('#p-status')).toHaveText('未达成');
  await source.fill('350');
  await expect(page.locator('#p-status')).toContainText('达成');
  await expect(page.locator('#p-f')).toHaveText('不适用');
});
