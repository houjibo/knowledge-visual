const {test, expect} = require('@playwright/test');
const url = '/physics/middle/electric-power.html';
test('电压边界、额定状态、比例尺与灯泡示意一致', async ({page}) => {
  await page.goto(url);
  const voltage=page.getByLabel('实际电压 U'), meter=page.getByRole('meter',{name:'实际功率占额定功率'});
  await expect(page.locator('#statusTag')).toContainText('额定电压');
  await expect(meter).toHaveAttribute('aria-valuenow','100');
  expect(await page.locator('#powerBar').evaluate(el=>parseFloat(el.style.width))).toBeCloseTo(100/1.5,3);
  await voltage.fill('110');
  await expect(page.locator('#valI')).toHaveText('0.23 A');
  await expect(page.locator('#valP')).toHaveText('25.0 W');
  await expect(meter).toHaveAttribute('aria-valuenow','25');
  await expect(page.locator('#statusTag')).toContainText('低于额定');
  await voltage.fill('219'); await expect(page.locator('#statusTag')).toContainText('低于额定');
  await voltage.focus(); await page.keyboard.press('ArrowRight');
  await expect(page.locator('#statusTag')).toHaveText('✓ 额定电压');
  await page.keyboard.press('ArrowRight'); await expect(page.locator('#statusTag')).toContainText('高于额定');
  await voltage.fill('264');
  await expect(page.locator('#valP')).toHaveText('144.0 W');
  await expect(meter).toHaveAttribute('aria-valuenow','144');
  expect(await page.locator('#powerBar').evaluate(el=>parseFloat(el.style.width))).toBeCloseTo(96);
  await expect(page.locator('#bulbCanvas')).toHaveAttribute('aria-label', /264伏.*144.0瓦/);
  const glow = await page.evaluate(() => {
    const p=CanvasRenderingContext2D.prototype, original=p.createRadialGradient, gradients=[];
    p.createRadialGradient=function(...args){const g=original.apply(this,args), old=g.addColorStop.bind(g), stops=[];g.addColorStop=(offset,color)=>{stops.push([offset,color]);return old(offset,color);};gradients.push(stops);return g;};
    try { draw(); return gradients; } finally {p.createRadialGradient=original;}
  });
  expect(glow[0]).toContainEqual([1,'rgba(254,240,138,0)']);
  const scroll=page.getByRole('region',{name:'灯泡与仪表图，可左右滚动'});
  const d=await scroll.evaluate(el=>({width:el.clientWidth,content:el.scrollWidth,page:document.documentElement.scrollWidth,screen:innerWidth}));
  expect(d.page).toBeLessThanOrEqual(d.screen); if(d.width<640) expect(d.content).toBeGreaterThan(d.width);
});
test('计算题拒绝错误数值与非数字后缀', async ({page}) => {
  await page.goto(url);
  await page.getByRole('button',{name:'🧪 计算'}).click();
  await page.locator('#a1').fill('64'); await page.locator('[data-check="a1"]').click();
  await expect(page.locator('#fb-a1')).toContainText('提示');
  await page.locator('#a1').fill('66'); await page.locator('[data-check="a1"]').click();
  await expect(page.locator('#fb-a1')).toContainText('正确');
  await page.locator('#a3').fill('1210abc,10'); await page.locator('[data-check="a3"]').click();
  await expect(page.locator('#fb-a3')).toContainText('提示');
  await page.locator('#a3').fill('1210，10'); await page.locator('[data-check="a3"]').click();
  await expect(page.locator('#fb-a3')).toContainText('正确');
});
