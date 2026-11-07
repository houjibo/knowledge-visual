const {test,expect}=require('@playwright/test');
const url='/physics/middle/internal-energy.html';
async function heatDrawing(page){return page.evaluate(()=>{
  const p=CanvasRenderingContext2D.prototype,old={fillRect:p.fillRect,quadraticCurveTo:p.quadraticCurveTo},bars=[],curves=[];
  p.fillRect=function(x,y,w,h){if((x===212||x===532)&&w===12&&this.fillStyle==='#ef4444')bars.push([x,y,h]);return old.fillRect.call(this,x,y,w,h);};
  p.quadraticCurveTo=function(...args){curves.push(args);return old.quadraticCurveTo.apply(this,args);};
  try{render(0);return {bars,curves};}finally{Object.assign(p,old);}
});}
test('相同吸热量时温升、温度计与累计时间一致',async({page})=>{
  await page.goto(url);const heat=page.getByRole('button',{name:'比热容对比'});
  await heat.focus();await page.keyboard.press('Enter');await expect(heat).toHaveAttribute('aria-pressed','true');
  const time=page.getByLabel('累计加热时间');
  let graph=await heatDrawing(page);expect(graph.curves).toHaveLength(0);
  await expect(page.locator('#infoA')).toContainText('0.0 °C');
  await time.fill('10');
  await expect(page.locator('#infoA')).toContainText('40.0 °C');
  await expect(page.locator('#infoB')).toContainText('182.6 °C');
  graph=await heatDrawing(page);expect(graph.curves).toHaveLength(4);
  expect(graph.bars).toHaveLength(2);
  expect(graph.bars[0][2]).toBeCloseTo(26);expect(graph.bars[1][2]).toBeCloseTo(130*(40*4.2/0.92)/200);
  expect(graph.bars[1][2]).toBeLessThan(130);
  await expect(page.locator('#heatCanvas')).toHaveAttribute('aria-label',/加热10分钟.*沙子升温182.6/);
  await time.fill('5');await expect(page.locator('#infoA')).toContainText('20.0 °C');
  await expect(page.locator('#infoB')).toContainText('91.3 °C');
});
test('同种气体温度比例与暂停状态一致',async({page})=>{
  await page.addInitScript(()=>{
    const raf=window.requestAnimationFrame,cancel=window.cancelAnimationFrame,pending=new Set();window.__pendingFrames=pending;
    window.requestAnimationFrame=cb=>{const id=raf.call(window,t=>{pending.delete(id);cb(t);});pending.add(id);return id;};
    window.cancelAnimationFrame=id=>{pending.delete(id);return cancel.call(window,id);};
  });
  await page.goto(url);
  const temp=page.getByRole('slider',{name:'温度'});
  await temp.fill('0');const low=await page.evaluate(()=>tempState().speedFactor);
  await temp.fill('100');const high=await page.evaluate(()=>tempState().speedFactor);
  expect(high/low).toBeCloseTo(Math.sqrt(373.15/273.15),5);
  await expect(page.locator('#infoB')).toContainText('未模拟扩散');
  await page.getByRole('button',{name:'暂停动画'}).click();
  expect(await page.evaluate(()=>window.__pendingFrames.size)).toBe(0);
  await page.getByRole('button',{name:'比热容对比'}).click();
  await page.getByRole('button',{name:'分子热运动'}).click();
  expect(await page.evaluate(()=>window.__pendingFrames.size)).toBe(0);
  await page.getByRole('button',{name:'继续动画'}).click();
  expect(await page.evaluate(()=>window.__pendingFrames.size)).toBe(1);
});
