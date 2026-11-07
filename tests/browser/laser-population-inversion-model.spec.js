const {test, expect} = require('@playwright/test');

test('简化三能级模型能从未反转到反转及阈值', async ({page}) => {
  await page.goto('/physics/uni/laser-physics.html');
  const pump = page.getByRole('slider', {name: '泵浦档位', exact: true});
  const tau = page.getByRole('slider', {name: '上能级寿命 τ₂', exact: true});
  const refl = page.getByRole('slider', {name: '镜面反射率 R', exact: true});
  await pump.fill('0');
  await expect(page.locator('#calc-n2')).toHaveText('0.0');
  await expect(page.locator('#calc-state')).toHaveText('未反转');
  await tau.fill('10');
  await pump.fill('20');
  await expect(page.locator('#calc-n2')).toHaveText('50.0');
  await expect(page.locator('#calc-state')).toHaveText('未反转');
  await pump.fill('30');
  await refl.fill('50');
  await expect(page.locator('#calc-n2')).toHaveText('60.0');
  await expect(page.locator('#calc-n1')).toHaveText('40.0');
  await expect(page.locator('#calc-state')).toContainText('已反转');
  await refl.fill('99');
  await expect(page.locator('#calc-state')).toContainText('模型超过阈值');
  await expect(page.locator('.panel').first()).toContainText('不计算输出功率');
});

test('三项练习目标可达，且未达目标时不会误报', async ({page}) => {
  await page.goto('/physics/uni/laser-physics.html');
  await page.locator('[data-mode="practice"]').click();
  const pump = page.getByRole('slider', {name: '练习泵浦档位'});
  const tau = page.getByRole('slider', {name: '练习上能级寿命 τ₂'});
  const refl = page.getByRole('slider', {name: '练习镜面反射率 R'});
  await pump.fill('0');
  await expect(page.locator('#p-status')).not.toContainText('✅');
  await tau.fill('10');
  await pump.fill('30');
  await expect(page.locator('#p-status')).toContainText('✅');
  await page.getByRole('button', {name: '超过激光阈值'}).click();
  await refl.fill('50');
  await expect(page.locator('#p-status')).not.toContainText('✅');
  await refl.fill('99');
  await expect(page.locator('#p-status')).toContainText('✅');
  await page.getByRole('button', {name: '增益达到两倍阈值'}).click();
  await expect(page.locator('#p-status')).toContainText('✅');
  await pump.focus();
  await page.keyboard.press('Home');
  await expect(page.locator('#p-status')).not.toContainText('✅');
});
