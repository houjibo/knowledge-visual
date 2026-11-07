const {test,expect}=require('@playwright/test');
const slugs=['understanding-area','area-and-perimeter','solid-shapes','surface-area','volume'];

test('五个主题可以连续前进、返回上一步并回到路线',async({page})=>{
  await page.goto('/math/topics/understanding-area/index.html');
  for(let i=0;i<slugs.length;i++) {
    await expect(page).toHaveURL(new RegExp(`/topics/${slugs[i]}/index\\.html$`));
    const nav=page.getByRole('navigation',{name:'从面积到体积学习路线'});
    await expect(nav.getByRole('link',{name:'返回学习路线'})).toBeVisible();
    if(i<slugs.length-1) await nav.getByRole('link',{name:/下一步/}).click();
  }
  await page.getByRole('navigation',{name:'从面积到体积学习路线'}).getByRole('link',{name:/上一步/}).click();
  await expect(page).toHaveURL(/topics\/surface-area\/index\.html$/);
  await page.getByRole('link',{name:'返回学习路线'}).click(); await expect(page).toHaveURL(/math\/index\.html#area-volume-path$/);
  await expect(page.locator('#area-volume-path')).toBeVisible();
});

test('窄屏和键盘可到达路线链接',async({page})=>{
  await page.goto('/math/topics/area-and-perimeter/index.html');
  const nav=page.getByRole('navigation',{name:'从面积到体积学习路线'});
  for(const link of await nav.locator('a').all()) {
    const rect=await link.evaluate(el=>[el.getBoundingClientRect().left,el.getBoundingClientRect().right,document.documentElement.clientWidth]);
    expect(rect[0]).toBeGreaterThanOrEqual(0);expect(rect[1]).toBeLessThanOrEqual(rect[2]);
  }
  const link=nav.getByRole('link',{name:/下一步/}); await link.focus(); await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/topics\/solid-shapes\/index\.html$/);
});

test('禁用脚本时主题间导航仍可使用',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false}); const page=await context.newPage();
  await page.goto('http://127.0.0.1:4183/math/topics/volume/index.html');
  await page.getByRole('navigation',{name:'从面积到体积学习路线'}).getByRole('link',{name:/上一步/}).click();
  await expect(page).toHaveURL(/topics\/surface-area\/index\.html$/); await context.close();
});

test('直接打开本地 HTML 时相邻主题和路线链接可用',async({page})=>{
  const {pathToFileURL}=require('node:url'); const path=require('node:path');
  const start=pathToFileURL(path.resolve('math/topics/understanding-area/index.html')).href;
  await page.goto(start); await page.getByRole('navigation',{name:'从面积到体积学习路线'}).getByRole('link',{name:/下一步/}).click();
  await expect(page).toHaveURL(/file:.*topics\/area-and-perimeter\/index\.html$/);
  await page.getByRole('navigation',{name:'从面积到体积学习路线'}).getByRole('link',{name:'返回学习路线'}).click();
  await expect(page).toHaveURL(/file:.*math\/index\.html#area-volume-path$/);
  await expect(page.locator('#area-volume-path')).toBeVisible();
});
