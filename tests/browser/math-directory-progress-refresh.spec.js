const {test,expect}=require('@playwright/test');
const key='kv-math-progress-v2';

test('路线和目录随其他标签页的完成与清除同步更新',async({page,context})=>{
  await page.goto('/math/index.html');
  const path=page.locator('.learning-path a[href="topics/understanding-area/index.html"]');
  const node=page.locator('a.topic-node[href="topics/understanding-area/index.html"]');
  const other=await context.newPage(); await other.goto('/math/topics/understanding-area/index.html');
  await other.evaluate(()=>PageProgress.markDone('understanding-area'));
  await expect(path.locator('.progress-badge')).toHaveAttribute('aria-label','已完成'); await expect(node.locator('.progress-badge')).toHaveCount(1);
  await expect(page.locator('#stageProgress')).toContainText('小学 ✓ 1/');
  await page.locator('#topic-query').fill('认识面积'); await expect(page.locator('#topic-search-results .progress-badge').first()).toBeVisible();
  await other.evaluate(()=>PageProgress.clear('understanding-area'));
  await expect(page.locator('#topic-search-results .progress-badge')).toHaveCount(0);
  await page.locator('#topic-clear').click(); await expect(path.locator('.progress-badge')).toHaveCount(0);
  await expect(node.locator('.progress-badge')).toHaveCount(0); await expect(page.locator('#stageProgress')).toContainText('小学 尚未开始');
  await other.close();
});

test('进度损坏时不显示未开始或过期徽章，恢复后可读取',async({page})=>{
  await page.goto('/math/index.html');
  await page.evaluate(key=>{localStorage.setItem(key,'{bad');window.dispatchEvent(new StorageEvent('storage',{key}));},key);
  await expect(page.locator('#mathProgressNotice')).toBeVisible(); await expect(page.locator('#stageProgress')).toHaveText('学习进度暂不可用');
  await expect(page.locator('.learning-path .progress-badge')).toHaveCount(0);
  expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe('{bad');
  await page.evaluate(key=>{localStorage.setItem(key,JSON.stringify({'primary:volume':1}));window.dispatchEvent(new StorageEvent('storage',{key}));},key);
  await expect(page.locator('#mathProgressNotice')).toBeHidden();
  await expect(page.locator('.learning-path a[href="topics/volume/index.html"] .progress-badge')).toHaveCount(1);
});

test('返回目录时同步主题完成记录',async({page})=>{
  await page.goto('/math/index.html'); await page.locator('.learning-path a[href="topics/volume/index.html"]').click();
  await page.evaluate(()=>PageProgress.markDone('volume')); await page.goBack();
  await expect(page.locator('.learning-path a[href="topics/volume/index.html"] .progress-badge')).toHaveCount(1);
  await expect(page.locator('#stageProgress')).toContainText('小学 ✓ 1/');
});
