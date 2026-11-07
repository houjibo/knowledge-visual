const {test,expect}=require('@playwright/test');

test('可用键盘选择圆柱圆锥并同步说明与选中状态',async({page})=>{
  await page.goto('/math/topics/cylinder-and-cone/index.html');
  const cylinder=page.getByRole('button',{name:/圆柱 两个圆形底面/});
  const cone=page.getByRole('button',{name:/圆锥 一个圆形底面/});
  await expect(cylinder).toHaveAttribute('aria-pressed','false');
  await cylinder.focus(); await page.keyboard.press('Enter');
  await expect(cylinder).toHaveAttribute('aria-pressed','true'); await expect(page.locator('#detail-cylinder')).toBeVisible();
  await expect(page.locator('#detail-cone')).toBeHidden();
  await page.keyboard.press('Tab'); await expect(cone).toBeFocused(); await page.keyboard.press('Space');
  await expect(cone).toHaveAttribute('aria-pressed','true'); await expect(cylinder).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('#detail-cone')).toBeVisible(); await expect(page.locator('#detail-cylinder')).toBeHidden();
  await expect(page.locator('#detail-cone')).toContainText('三分之一');
  await page.getByRole('button',{name:'🔍 展开图'}).click(); await page.getByRole('button',{name:'📖 认识'}).click();
  await expect(cone).toHaveAttribute('aria-pressed','true'); await expect(page.locator('#detail-cone')).toBeVisible();
});
