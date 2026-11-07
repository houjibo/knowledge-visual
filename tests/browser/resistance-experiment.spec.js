const {test, expect} = require('@playwright/test');
const url = '/physics/middle/voltage-resistance.html';
async function circuit(page) {
  return page.evaluate(() => {
    const p=CanvasRenderingContext2D.prototype, old={beginPath:p.beginPath,moveTo:p.moveTo,lineTo:p.lineTo,arc:p.arc,stroke:p.stroke};
    let path=[]; const paths=[];
    p.beginPath=function(){path=[];return old.beginPath.call(this);};
    for(const name of ['moveTo','lineTo','arc']) p[name]=function(...args){path.push([name,...args.slice(0,name==='arc'?3:2)]);return old[name].apply(this,args);};
    p.stroke=function(){paths.push(path.slice());return old.stroke.call(this);};
    try { render(); return paths; } finally { Object.assign(p,old); }
  });
}
test('电阻读数、串并联实际接线与键盘参数一致', async ({page}) => {
  await page.goto(url);
  const length=page.getByLabel('长度 L'), area=page.getByLabel('横截面积 S');
  const nichrome=page.getByRole('button',{name:'镍铬丝'});
  await nichrome.focus(); await page.keyboard.press('Enter');
  await expect(nichrome).toHaveAttribute('aria-pressed','true');
  await length.fill('4'); await area.fill('2');
  await expect(page.locator('#infoR')).toHaveText('2.200 Ω');
  await expect(page.locator('#infoI')).toHaveText('0.42 A');
  await expect(page.locator('#explCanvas')).toHaveAttribute('aria-label', /电压表并联.*电阻2.200欧/);
  let paths=await circuit(page);
  for(const path of [
    [['moveTo',100,210],['lineTo',100,100],['lineTo',620,100],['lineTo',620,204]],
    [['moveTo',620,236],['lineTo',620,340],['lineTo',376,340]],
    [['moveTo',344,340],['lineTo',100,340],['lineTo',100,230]],
    [['moveTo',260,100],['lineTo',260,50],['lineTo',344,50]],
    [['moveTo',460,100],['lineTo',460,50],['lineTo',376,50]],
    [['arc',360,340,16]], [['arc',360,50,16]],
  ]) expect(paths).toContainEqual(path);
  await length.fill('1'); paths=await circuit(page);
  expect(paths).toContainEqual([['moveTo',260,100],['lineTo',260,50],['lineTo',269,50]]);
  expect(paths).toContainEqual([['moveTo',310,100],['lineTo',310,50],['lineTo',301,50]]);
  expect(paths).toContainEqual([['arc',285,50,16]]);
});

test('调整控件只保持一个动画循环，可暂停和跨模式恢复', async ({page}) => {
  await page.addInitScript(() => {
    const raf=window.requestAnimationFrame, cancel=window.cancelAnimationFrame, pending=new Set();
    window.__pendingFrames=pending;
    window.requestAnimationFrame=cb => { const id=raf.call(window, t=>{pending.delete(id);cb(t);});pending.add(id);return id; };
    window.cancelAnimationFrame=id => {pending.delete(id);return cancel.call(window,id);};
  });
  await page.goto(url);
  const length=page.getByLabel('长度 L');
  for(const value of ['4','1','3','2','4']) await length.fill(value);
  expect(await page.evaluate(()=>window.__pendingFrames.size)).toBeLessThanOrEqual(1);
  const toggle=page.getByRole('button',{name:'暂停动画'});
  await toggle.click();
  await expect(page.getByRole('button',{name:'继续动画'})).toHaveAttribute('aria-pressed','true');
  expect(await page.evaluate(()=>window.__pendingFrames.size)).toBe(0);
  await length.fill('1'); await expect(page.locator('#valL')).toHaveText('1 m');
  await page.getByRole('button',{name:'🧪 练习'}).click();
  await page.locator('#p1 .quiz-opt').first().click();
  await expect(page.locator('#p1 .quiz-opt').nth(2)).toBeDisabled();
  await page.getByRole('button',{name:'📖 探究'}).click();
  expect(await page.evaluate(()=>window.__pendingFrames.size)).toBe(0);
  await page.getByRole('button',{name:'继续动画'}).click();
  expect(await page.evaluate(()=>window.__pendingFrames.size)).toBe(1);
});
