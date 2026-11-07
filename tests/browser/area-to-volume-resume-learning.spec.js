const {test,expect}=require('@playwright/test');
const key='kv-math-progress-v2';
const slugs=['understanding-area','area-and-perimeter','solid-shapes','surface-area','volume'];

test('建议继续第一个未完成主题，支持跳着学习与全部完成',async({page,context})=>{
  await page.goto('/math/index.html');
  await expect(page.locator('#path-progress')).toContainText('已完成 0 / 5');
  await expect(page.locator('#path-resume')).toHaveText('继续学习：认识面积');
  const other=await context.newPage(); await other.goto('/math/topics/volume/index.html');
  await other.evaluate(()=>{PageProgress.markDone('volume');PageProgress.markDone('understanding-area');});
  await expect(page.locator('#path-progress')).toContainText('已完成 2 / 5');
  await expect(page.locator('#path-resume')).toHaveAttribute('href','topics/area-and-perimeter/index.html');
  await other.evaluate(slugs=>slugs.forEach(slug=>PageProgress.markDone(slug)),slugs);
  await expect(page.locator('#path-progress')).toHaveText('已完成 5 / 5 个主题。'); await expect(page.locator('#path-resume')).toBeHidden();
  await other.evaluate(()=>PageProgress.clear('solid-shapes'));
  await expect(page.locator('#path-progress')).toContainText('已完成 4 / 5');
  await expect(page.locator('#path-resume')).toHaveText('继续学习：认识立体图形'); await other.close();
});

test('不可读时不推荐，恢复后正确导航',async({page})=>{
  await page.goto('/math/index.html');
  await page.evaluate(key=>{localStorage.setItem(key,'{broken');window.dispatchEvent(new StorageEvent('storage',{key}));},key);
  await expect(page.locator('#path-progress')).toHaveText('路线进度暂不可读取。'); await expect(page.locator('#path-resume')).toBeHidden();
  await page.evaluate(key=>{localStorage.setItem(key,JSON.stringify({'primary:understanding-area':1}));window.dispatchEvent(new StorageEvent('storage',{key}));},key);
  await expect(page.locator('#path-resume')).toHaveText('继续学习：面积与周长'); await page.locator('#path-resume').click();
  await expect(page).toHaveURL(/topics\/area-and-perimeter\/index\.html$/);
});
