const {test, expect} = require('@playwright/test');

test('种子可无光萌发，后续示意生长需要光和水', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('/science/living-things.html');
  await expect(page.getByRole('button', {name: '继续动画'})).toBeVisible();
  const step = page.getByRole('button', {name: '推进一步'});
  await step.click();
  await expect(page.locator('#infoPct')).toHaveText('0%');
  await page.getByRole('button', {name: '💧 浇水：关'}).click();
  await expect(page.locator('#tglWater')).toHaveAttribute('aria-pressed', 'true');
  await step.click(); await step.click();
  await expect(page.locator('#infoPct')).toHaveText('30%');
  await expect(page.locator('#infoGrow')).toContainText('已萌发');
  await step.click();
  await expect(page.locator('#infoPct')).toHaveText('30%');
  await page.getByRole('button', {name: '☀️ 阳光：关'}).click();
  await step.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#infoPct')).toHaveText('45%');
  await expect(page.locator('#bioCanvas')).toHaveAttribute('aria-label', /45%/);
  await page.getByRole('button', {name: '💧 浇水：开'}).click();
  await step.click();
  await expect(page.locator('#infoPct')).toHaveText('45%');
  await page.getByRole('button', {name: '重新开始'}).click();
  await expect(page.locator('#infoPct')).toHaveText('0%');
  await expect(page.locator('#tglSun')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#tglWater')).toHaveAttribute('aria-pressed', 'false');
});

test('食物链切换和练习答错后可重试', async ({page}) => {
  await page.goto('/science/living-things.html');
  await page.getByRole('button', {name: '食物链', exact: true}).click();
  await expect(page.getByRole('button', {name: '食物链', exact: true})).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#bioCanvas')).toHaveAttribute('aria-label', /食物链示例/);
  await page.locator('[data-mode="practice"]').click();
  await page.locator('#p1').getByRole('button', {name: '茎'}).click();
  await expect(page.locator('#p1 .practice-fb')).toContainText('再想想');
  await page.locator('#p1').getByRole('button', {name: '根'}).click();
  await expect(page.locator('#p1 .practice-fb')).toContainText('正确');
});
