const {test, expect} = require('@playwright/test');

test('材料示例和文字随键盘选择同步', async ({page}) => {
  await page.goto('/science/materials.html');
  await expect(page.locator('#materialDetails')).toContainText('铜通常容易导电');
  const plastic = page.getByRole('button', {name: '🧴 塑料'});
  await plastic.focus(); await page.keyboard.press('Enter');
  await expect(plastic).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#materialDetails')).toContainText('破损或潮湿');
  await expect(page.locator('#matCanvas')).toHaveAttribute('aria-label', /塑料/);
  await expect(page.locator('#legendLabel')).toContainText('不能代表所有');
  await expect(page.locator('.panel').first()).toContainText('也可能因加热而烫手');
});

test('漂浮题以密度为条件，绝缘题说明适用范围', async ({page}) => {
  await page.goto('/science/materials.html');
  await page.locator('[data-mode="practice"]').click();
  await page.getByRole('spinbutton', {name: '能浮的材料块数量'}).fill('3');
  await page.locator('[data-check="a2"]').click();
  await expect(page.locator('#fb-a2')).toContainText('密度');
  await page.locator('[data-mode="quiz"]').click();
  await page.locator('#quizStart').click(); await page.locator('#quizNext').click();
  await page.locator('#quizOpts button').nth(1).click();
  await expect(page.locator('#quizFb')).toContainText('破损、潮湿');
});
