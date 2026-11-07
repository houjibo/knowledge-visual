const {test,expect}=require('@playwright/test');
const url='/math/topics/cylinder-cone/index.html';

test('圆柱和圆锥数值与图形随半径和高度变化',async({page})=>{
  await page.goto(url); await page.locator('[data-mode="explore"]').click();
  await page.getByLabel('底面半径',{exact:true}).fill('3'); await page.getByLabel('高',{exact:true}).fill('4');
  await expect(page.locator('#base-area')).toHaveText('28.27 cm²'); await expect(page.locator('#side-area')).toHaveText('75.40 cm²');
  await expect(page.locator('#volume')).toHaveText('113.10 cm³');
  await page.locator('#btn-cone').click(); await expect(page.locator('#btn-cone')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#label-side')).toHaveText('母线长'); await expect(page.locator('#side-area')).toHaveText('5.00 cm');
  await expect(page.locator('#total-area')).toHaveText('75.40 cm²'); await expect(page.locator('#volume')).toHaveText('37.70 cm³');
  await expect(page.locator('#shape-diagram')).toHaveAccessibleName(/圆锥.*半径 3 厘米，高 4 厘米/);
  for(const [r,h] of [[1,1],[10,15],[10,1],[1,15]]) {
    await page.getByLabel('底面半径',{exact:true}).fill(String(r)); await page.getByLabel('高',{exact:true}).fill(String(h));
    const path=await page.locator('#shape-diagram path').getAttribute('d');
    expect(path).not.toMatch(/NaN|Infinity/);
    await expect(page.locator('#side-area')).toHaveText(`${Math.hypot(r,h).toFixed(2)} cm`);
  }
});

test('比较题遵循 3.14 并按给定体积计算，练习不可重复计分',async({page})=>{
  await page.goto(url); await page.locator('[data-mode="practice"]').click();
  await page.evaluate(()=>{Random.int=(min)=>min;Random.pick=arr=>arr[arr.length-1];generateProblem();});
  await expect(page.locator('#problem-text')).toContainText('37.68 cm³');
  await page.getByLabel('体积答案').fill('12.56'); await page.locator('#btn-check').click();
  await expect(page.locator('#feedback')).toContainText('正确'); await expect(page.locator('#streak')).toHaveText('1');
  await page.locator('#btn-check').dispatchEvent('click'); await expect(page.locator('#streak')).toHaveText('1');
  await page.locator('#btn-next').click(); await page.getByLabel('体积答案').fill('12.6'); await page.locator('#btn-check').click();
  await expect(page.locator('#feedback')).toContainText('不对'); await expect(page.locator('#streak')).toHaveText('0');
});
