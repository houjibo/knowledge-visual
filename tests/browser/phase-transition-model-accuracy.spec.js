const {test, expect} = require('@playwright/test');

test('相变模型状态不把温度单独当作超临界条件', async ({page}) => {
  await page.goto('/physics/uni/phase-transitions.html');
  const temp = page.getByRole('slider', {name: '温度 T (K)', exact: true});
  const volume = page.getByRole('slider', {name: '体积 V (L/mol)', exact: true});
  await temp.fill('320');
  await volume.fill('100');
  await expect(page.locator('#calc-phase')).toContainText('压力未高于临界值');
  await volume.fill('13');
  await expect(page.locator('#calc-phase')).toContainText('温度、压力均高于临界值');
  await temp.fill('290');
  await expect(page.locator('#calc-phase')).toContainText('需结合共存条件判断');
  await expect(page.locator('#calc-P')).toContainText('模型值');
  await expect(page.locator('.panel').first()).toContainText('未计算共存压力和两端体积');
  await page.getByRole('button', {name: 'P-T 相图'}).click();
  await expect(page.getByRole('button', {name: 'P-T 相图'})).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', {name: 'P-V 等温线'}).click();
  await expect(page.getByRole('button', {name: 'P-V 等温线'})).toHaveAttribute('aria-pressed', 'true');
});

test('练习和测验区分临界温度与超临界区', async ({page}) => {
  await page.goto('/physics/uni/phase-transitions.html');
  await page.locator('[data-mode="practice"]').click();
  await page.getByRole('button', {name: '高于临界温度（单调曲线）'}).click();
  await page.getByRole('slider', {name: '练习温度 T (K)'}).fill('320');
  await expect(page.locator('#p-status')).toContainText('达成');
  await expect(page.locator('#p-hint')).toContainText('压力高于临界值');
  await page.locator('[data-mode="quiz"]').click();
  await page.getByRole('button', {name: /不经过气液一阶相变/}).click();
  await expect(page.locator('#quiz-fb')).toContainText('温度和压力都高于临界值');
});
