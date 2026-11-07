const {test, expect} = require('@playwright/test');

test('草原示意规则、键盘与重置保持一致', async ({page}) => {
  await page.goto('/science/environment.html');
  const fox = page.getByRole('slider', {name: '狐狸档位（示意）'});
  const pollution = page.getByRole('slider', {name: '污染档位（示意）'});
  const summary = page.locator('#modelSummary');
  await expect(summary).toHaveText('示意指数：草 10/10，兔 10/12，狐 3/10');
  await fox.fill('0');
  await expect(summary).toHaveText('示意指数：草 10/10，兔 12/12，狐 0/10');
  await pollution.fill('8');
  await expect(summary).toHaveText('示意指数：草 2/10，兔 2/12，狐 0/10');
  await expect(page.locator('#ecoCanvas')).toHaveAttribute('aria-label', /草 2\/10，兔 2\/12，狐 0\/10/);
  await pollution.fill('10');
  await expect(summary).toHaveText('示意指数：草 0/10，兔 0/12，狐 0/10');
  await page.getByRole('button', {name: '重置示意'}).click();
  await expect(fox).toHaveValue('3');
  await expect(pollution).toHaveValue('0');
  await fox.focus();
  await page.keyboard.press('ArrowRight');
  await expect(summary).toHaveText('示意指数：草 10/10，兔 9/12，狐 4/10');
  await page.getByText('示意规则与局限').click();
  await expect(page.locator('details')).toContainText('没有时间和真实生态数据');
});

test('环境题目讲清捕食压力和电池分类', async ({page}) => {
  await page.goto('/science/environment.html');
  await page.locator('[data-mode="quiz"]').click();
  await page.locator('#quizStart').click();
  await page.getByRole('button', {name: '可能降低'}).click();
  await expect(page.locator('#quizFb')).toContainText('其他因素');
  await page.locator('#quizNext').click();
  await page.getByRole('button', {name: '区分种类，按当地要求或指定渠道投放'}).click();
  await expect(page.locator('#quizFb')).toContainText('因地区不同');
});
