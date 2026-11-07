const {test,expect}=require('@playwright/test');
const url='/math/topics/volume/index.html';

test('预设长方体逐层累计并可重置',async ({page})=>{
  await page.goto(url); await page.locator('[data-mode="explore"]').click();
  for(const [shape,l,w,h] of [['3x2x2',3,2,2],['4x3x1',4,3,1],['5x2x3',5,2,3]]) {
    const btn=page.locator(`.explore-btn[data-shape="${shape}"]`); await btn.click();
    await expect(btn).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('#explore-display .explore-box')).toHaveCount(h);
    await expect(page.locator('#explore-display .cube-cell')).toHaveCount(l*w*h);
    await expect(page.locator('#layer-status')).toContainText(`0 / ${h} 层`);
    for(let i=1;i<=h;i++) {
      await page.locator('#layer-next').click();
      await expect(page.locator('#explore-display .explore-box.counted')).toHaveCount(i);
      await expect(page.locator('#layer-status')).toContainText(`${l} × ${w} × ${i} = ${l*w*i} cm³`);
    }
    await expect(page.locator('#layer-next')).toBeDisabled();
    await page.locator('#layer-reset').click(); await expect(page.locator('#explore-display .counted')).toHaveCount(0);
  }
});

test('自由参数极值对应方块数，参数改变重置累计且图形不溢出',async ({page})=>{
  await page.goto(url); await page.locator('[data-mode="explore"]').click(); await page.locator('[data-shape="free"]').click();
  for(const [l,w,h] of [[1,1,1],[5,4,4],[1,4,2]]) {
    await page.locator('#free-l').selectOption(String(l)); await page.locator('#free-w').selectOption(String(w)); await page.locator('#free-h').selectOption(String(h));
    await expect(page.locator('#explore-display .cube-cell')).toHaveCount(l*w*h);
    await expect(page.locator('#explore-result')).toContainText(`${l} × ${w} × ${h} = ${l*w*h} cm³`);
    await page.locator('#layer-next').click(); await expect(page.locator('#layer-status')).toContainText(`1 / ${h} 层`);
    const bounds=await page.locator('#explore-display').evaluate(el=>[el.getBoundingClientRect().left,el.getBoundingClientRect().right,document.documentElement.clientWidth]);
    expect(bounds[0]).toBeGreaterThanOrEqual(0); expect(bounds[1]).toBeLessThanOrEqual(bounds[2]);
  }
  await page.locator('#free-l').selectOption('3'); await expect(page.locator('#layer-status')).toContainText('0 / 2 层');
});
