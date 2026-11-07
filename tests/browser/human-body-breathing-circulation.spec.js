const {test, expect} = require('@playwright/test');

test('呼吸动画吸气扩张、呼气缩小，可暂停分步', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('/science/human-body.html');
  await expect(page.getByRole('button', {name: '继续动画'})).toBeVisible();
  await page.getByRole('button', {name: '🫁 呼吸系统'}).click();
  await expect(page.locator('#bodyDescription')).toHaveText('吸气：肺逐渐扩张');
  const values = await page.evaluate(() => [0, 0.25, 0.5, 0.75, 0.999].map(breathPhase));
  expect(values.map(x => x.expansion)).toEqual([0, 0.5, 1, 0.5, expect.closeTo(0.002, 5)]);
  expect(values.map(x => x.inhale)).toEqual([true, true, false, false, false]);
  await page.getByRole('button', {name: '推进四分之一周期'}).click();
  await page.getByRole('button', {name: '推进四分之一周期'}).click();
  await expect(page.locator('#bodyDescription')).toHaveText('呼气：肺逐渐缩小');
  await expect(page.locator('#bodyCanvas')).toHaveAttribute('aria-label', /呼气/);
  await page.getByRole('button', {name: '重新开始'}).click();
  await expect(page.locator('#bodyDescription')).toHaveText('吸气：肺逐渐扩张');
});

test('循环示意说明肺和全身的路径，键盘可切换并计算', async ({page}) => {
  await page.goto('/science/human-body.html');
  const blood = page.getByRole('button', {name: '❤️ 血液循环'});
  await blood.focus(); await page.keyboard.press('Enter');
  await expect(blood).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#bodyDescription')).toContainText('心脏到肺再回心脏');
  await expect(page.locator('#legendLabel')).toContainText('心脏→肺→心脏→全身→心脏');
  await expect(page.locator('.panel').first()).toContainText('不是血液真实颜色');
  await page.locator('[data-mode="practice"]').click();
  await page.getByRole('spinbutton', {name: '心跳每分钟增加次数'}).fill('45');
  await page.locator('[data-check="a1"]').click();
  await expect(page.locator('#fb-a1')).toContainText('正确');
});
