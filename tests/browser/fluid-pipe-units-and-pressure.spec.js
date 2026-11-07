const {test, expect} = require('@playwright/test');

test('管径毫米、流量和压差在收缩及扩张时一致', async ({page}) => {
  await page.goto('/physics/uni/fluid-mechanics.html');
  const r1 = page.getByRole('slider', {name: '入口半径 r₁ (mm)', exact: true});
  const r2 = page.getByRole('slider', {name: '出口半径 r₂ (mm)', exact: true});
  const v1 = page.getByRole('slider', {name: '入口流速 v₁ (m/s)', exact: true});
  await expect(page.locator('#r1v')).toHaveText('50 mm');
  await expect(page.locator('#calc-q')).toHaveText('15.7');
  await r1.fill('40'); await r2.fill('20'); await v1.fill('2');
  await expect(page.locator('#calc-v2')).toHaveText('8.0');
  await expect(page.locator('#calc-dp')).toHaveText('-30.0');
  await expect(page.locator('#calc-q')).toHaveText('10.1');
  await r1.fill('20'); await r2.fill('40');
  await expect(page.locator('#calc-v2')).toHaveText('0.5');
  await expect(page.locator('#calc-dp')).toHaveText('1.9');
  await expect(page.locator('#calc-q')).toHaveText('2.5');
  await r2.fill('20');
  await expect(page.locator('#calc-dp')).toHaveText('0.0');
  await expect(page.locator('.panel').first()).toContainText('不计算绝对压力或空化');
});

test('流量目标基于毫米单位，可用键盘调整', async ({page}) => {
  await page.goto('/physics/uni/fluid-mechanics.html');
  await page.locator('[data-mode="practice"]').click();
  await page.getByRole('button', {name: '让 Q ≥ 25 L/s'}).click();
  await expect(page.locator('#p-status')).toContainText('未达成');
  const velocity = page.getByRole('slider', {name: '练习入口流速 v₁ (m/s)'});
  await velocity.focus(); await page.keyboard.press('End');
  await expect(page.locator('#p-q')).toHaveText('40.2');
  await expect(page.locator('#p-status')).toContainText('达成');
});
