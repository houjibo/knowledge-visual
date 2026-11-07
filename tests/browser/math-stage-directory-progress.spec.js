const {test,expect}=require('@playwright/test');
const cases=[['middle','linear-equation'],['high','derivative'],['uni','derivative']];
for(const [stage,slug] of cases) {
  test(`${stage} 目录跨标签更新并清除已完成标记`,async({page,context})=>{
    await page.goto(`/math/${stage}/index.html`); const badge=page.locator(`a[href="${slug}.html"] .progress-badge`);
    await expect(page.locator('#mathProgressNotice')).toBeHidden(); await expect(badge).toHaveCount(0);
    const other=await context.newPage(); await other.goto(`/math/${stage}/${slug}.html`);
    await other.evaluate(s=>PageProgress.markDone(s),slug); await expect(badge).toHaveCount(1);
    await other.evaluate(s=>PageProgress.clear(s),slug); await expect(badge).toHaveCount(0); await other.close();
  });
  test(`${stage} 存储损坏时保留原数据并在恢复后显示`,async({page})=>{
    await page.goto(`/math/${stage}/index.html`);
    await page.evaluate(({stage,slug})=>{localStorage.setItem('kv-math-progress-v2',JSON.stringify({[`${stage}:${slug}`]:1}));window.dispatchEvent(new StorageEvent('storage',{key:'kv-math-progress-v2'}));},{stage,slug});
    const badge=page.locator(`a[href="${slug}.html"] .progress-badge`); await expect(badge).toHaveCount(1);
    await page.evaluate(()=>{localStorage.setItem('kv-math-progress','{bad');window.dispatchEvent(new StorageEvent('storage',{key:'kv-math-progress'}));});
    await expect(page.locator('#mathProgressNotice')).toBeVisible(); await expect(badge).toHaveCount(0);
    expect(await page.evaluate(()=>localStorage.getItem('kv-math-progress'))).toBe('{bad');
    await page.evaluate(()=>{localStorage.removeItem('kv-math-progress');window.dispatchEvent(new StorageEvent('storage',{key:'kv-math-progress'}));});
    await expect(page.locator('#mathProgressNotice')).toBeHidden(); await expect(badge).toHaveCount(1);
  });
}

test('存储被拒绝时目录仍可导航',async({page})=>{
  await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('denied');};});
  for(const [stage] of cases){ await page.goto(`/math/${stage}/index.html`); await expect(page.locator('#mathProgressNotice')).toBeVisible(); await expect(page.locator('.topic-card').first()).toBeVisible(); }
});
