const {test,expect}=require('@playwright/test');

test('从首页进入路径并完成五个代表性探索',async({page})=>{
  await page.goto('/'); await page.getByRole('link',{name:/数学 小学/}).click();
  const path=page.locator('.learning-path'); await expect(path.locator('li')).toHaveCount(5);
  await path.getByRole('link',{name:/认识面积/}).click(); await page.locator('button[data-mode="tile"]').click();
  await page.locator('#tile-grid button').first().click(); await expect(page.locator('#tile-grid button').first()).toHaveAttribute('aria-pressed','true'); await page.goBack();
  await path.getByRole('link',{name:/面积与周长/}).click(); await page.locator('button[data-mode="rectangle"]').click();
  await page.locator('#rect-l').fill('8'); await expect(page.locator('#rect-area')).toHaveText('32 cm²'); await page.goBack();
  await path.getByRole('link',{name:/认识立体图形/}).click(); await page.locator('#shape-gallery button').first().click();
  await expect(page.locator('#shape-detail')).toBeVisible(); await page.goBack();
  await path.getByRole('link',{name:/表面积/}).click(); await page.locator('button[data-mode="unfold"]').click(); await page.locator('#unfoldBtn').click();
  await expect(page.locator('#unfold-cube')).toBeVisible(); await page.goBack();
  await path.getByRole('link',{name:/体积与容积/}).click(); await page.locator('button[data-mode="explore"]').click();
  await page.locator('#layer-next').click(); await expect(page.locator('#layer-status')).toContainText('1 / 2 层');
});

test('路径可键盘折叠且窄屏链接不溢出',async({page})=>{
  await page.goto('/math/index.html'); const path=page.locator('.learning-path'); const summary=path.locator('summary');
  await summary.focus(); await page.keyboard.press('Enter'); await expect(path).not.toHaveAttribute('open','');
  await page.keyboard.press('Space'); await expect(path).toHaveAttribute('open','');
  for(const link of await path.locator('a').all()) {
    const bounds=await link.evaluate(el=>[el.getBoundingClientRect().left,el.getBoundingClientRect().right,document.documentElement.clientWidth]);
    expect(bounds[0]).toBeGreaterThanOrEqual(0); expect(bounds[1]).toBeLessThanOrEqual(bounds[2]);
  }
});

test('禁用脚本时路径入口仍可访问',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false}); const page=await context.newPage();
  await page.goto('http://127.0.0.1:4183/math/index.html');
  await expect(page.locator('.learning-path a')).toHaveCount(5);
  await page.locator('.learning-path a').last().click(); await expect(page).toHaveURL(/topics\/volume\/index\.html$/);
  await context.close();
});
