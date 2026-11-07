const {test, expect} = require('@playwright/test');
const url = '/physics/middle/current-circuits.html';
async function drawing(page) {
  return page.evaluate(() => {
    const p=CanvasRenderingContext2D.prototype, old={beginPath:p.beginPath,moveTo:p.moveTo,lineTo:p.lineTo,stroke:p.stroke};
    let path=[]; const paths=[];
    p.beginPath=function(){path=[];return old.beginPath.call(this);};
    for(const n of ['moveTo','lineTo']) p[n]=function(x,y){path.push([n,x,y]);return old[n].call(this,x,y);};
    p.stroke=function(){if(path.length) paths.push(path.slice());return old.stroke.call(this);};
    try { render(); return paths; } finally { Object.assign(p,old); }
  });
}
test('开关真实断开，串并联电流、接线及粒子方向一致', async ({page}) => {
  await page.goto(url);
  const sw=page.locator('#switchBtn');
  await expect(page.locator('#info-itotal')).toContainText('0.0 A');
  let paths=await drawing(page);
  expect(paths).toContainEqual([['moveTo',120,210],['lineTo',120,110],['lineTo',340,110]]);
  expect(paths).toContainEqual([['moveTo',380,110],['lineTo',600,110],['lineTo',600,149]]);
  expect(paths).toContainEqual([['moveTo',340,110],['lineTo',374,86]]);
  expect(paths).not.toContainEqual([['moveTo',340,110],['lineTo',380,110]]);
  await sw.click();
  await expect(sw).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#info-i1')).toContainText('0.3 A');
  await expect(page.locator('#info-itotal')).toContainText('0.3 A');
  paths=await drawing(page);
  expect(paths).toContainEqual([['moveTo',340,110],['lineTo',380,110]]);
  expect(await page.evaluate(() => electrons[0].speed)).toBeGreaterThan(10);
  const parallel=page.getByRole('button',{name:'并联电路'});
  await parallel.focus(); await page.keyboard.press('Enter');
  await expect(parallel).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#info-i1')).toContainText('0.6 A');
  await expect(page.locator('#info-i2')).toContainText('0.6 A');
  await expect(page.locator('#info-itotal')).toContainText('1.2 A');
  paths=await drawing(page);
  expect(paths).toContainEqual([['moveTo',300,110],['lineTo',300,204]]);
  expect(paths).toContainEqual([['moveTo',300,236],['lineTo',300,330]]);
  expect(paths).toContainEqual([['moveTo',600,236],['lineTo',600,330],['lineTo',120,330],['lineTo',120,230]]);
  const branchPaths=await page.evaluate(()=>paths());
  expect(branchPaths).toHaveLength(2);
  for (const path of branchPaths) {
    const x=path[2][0]; expect(path.slice(2,4)).toEqual([[x,110],[x,330]]);
  }
  await sw.click();
  await expect(page.locator('#info-itotal')).toContainText('0.0 A');
  await expect(page.locator('#circuitCanvas')).toHaveAttribute('aria-label', /并联电路，开关断开/);
});

test('动画可暂停并在切换页面后保持暂停', async ({page}) => {
  await page.addInitScript(() => {
    const raf=window.requestAnimationFrame,cancel=window.cancelAnimationFrame,pending=new Set();
    window.__pendingFrames=pending;
    window.requestAnimationFrame=cb=>{const id=raf.call(window,t=>{pending.delete(id);cb(t);});pending.add(id);return id;};
    window.cancelAnimationFrame=id=>{pending.delete(id);return cancel.call(window,id);};
  });
  await page.goto(url);
  await page.locator('#switchBtn').click();
  await page.getByRole('button',{name:'暂停动画'}).click();
  expect(await page.evaluate(()=>window.__pendingFrames.size)).toBe(0);
  await page.getByRole('button',{name:'并联电路'}).click();
  await page.getByRole('button',{name:'🧪 练习'}).click();
  await page.getByRole('button',{name:'📖 学习'}).click();
  await expect(page.getByRole('button',{name:'继续动画'})).toHaveAttribute('aria-pressed','true');
  expect(await page.evaluate(()=>window.__pendingFrames.size)).toBe(0);
  await page.getByRole('button',{name:'继续动画'}).click();
  expect(await page.evaluate(()=>window.__pendingFrames.size)).toBe(1);
});
