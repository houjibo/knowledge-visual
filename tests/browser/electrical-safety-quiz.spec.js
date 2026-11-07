const {test,expect}=require('@playwright/test');
test('电压主题的测验与正文一致，不把低电压视为绝对安全',async({page})=>{
  await page.goto('/physics/middle/voltage-resistance.html');
  await expect(page.locator('.concept-card').filter({hasText:'电压：形成电流的原因'})).toContainText('不能仅凭电压判断安全');
  await page.getByRole('button',{name:'🎯 测验'}).click();
  await page.locator('#quizStart').click();
  await expect(page.locator('#quizQ')).toContainText('闭合导电回路');
  await page.locator('#quizNext').click();
  await expect(page.locator('#quizQ')).toContainText('温度、材料和形状保持不变');
  for(let i=0;i<3;i++) await page.locator('#quizNext').click();
  await expect(page.locator('#quizQ')).toContainText('触电危险');
  await page.locator('#quizOpts button').nth(1).click();
  await expect(page.locator('#quizFb')).toContainText('不能仅凭电压断言安全');
  await expect(page.locator('#quizOpts button').nth(0)).toHaveClass(/correct/);
  await page.locator('#quizStart').click();
  for(let i=0;i<4;i++) await page.locator('#quizNext').click();
  await page.locator('#quizOpts button').nth(0).click();
  await expect(page.locator('#quizFb')).toContainText('✅');
});
