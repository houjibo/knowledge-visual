const {test, expect}=require('@playwright/test');
const url='/physics/middle/electromagnetism.html';
async function drawing(page) {
  return page.evaluate(() => {
    const p=CanvasRenderingContext2D.prototype, old={ellipse:p.ellipse,fillText:p.fillText}, ellipses=[], labels=[];
    p.ellipse=function(...args){ellipses.push(args.slice(0,4));return old.ellipse.apply(this,args);};
    p.fillText=function(text,...args){labels.push(String(text));return old.fillText.call(this,text,...args);};
    try {render(0);return {ellipses,labels};} finally {Object.assign(p,old);}
  });
}
test('奥斯特环形磁场采用侧视投影，电磁铁零档无示意磁场',async({page})=>{
  await page.goto(url);
  await page.getByRole('button',{name:'🔌 接通电流'}).click();
  let d=await drawing(page);
  expect(d.ellipses).toEqual(expect.arrayContaining([[360,150,9,30],[360,150,16.5,55],[360,150,24,80]]));
  expect(d.labels).toContain('环形磁场（侧视投影）');
  const magnet=page.getByRole('button',{name:'电磁铁'});
  await magnet.focus();await page.keyboard.press('Enter');
  await expect(magnet).toHaveAttribute('aria-pressed','true');
  const level=page.getByLabel('电流示意档位');
  await level.fill('0');
  await expect(page.locator('#infoA')).toContainText('未吸起');
  await expect(page.locator('#infoB')).toContainText('无电流');
  d=await drawing(page);
  expect(d.labels).not.toContain('N'); expect(d.labels).not.toContain('S');
  expect(d.ellipses.filter(e=>e[0]===320)).toHaveLength(0);
  await level.fill('10');
  await expect(page.locator('#infoA')).toContainText('16');
  await expect(page.locator('#emCanvas')).toHaveAttribute('aria-label',/示意吸起大头针 16 枚/);
  d=await drawing(page);
  expect(d.labels).toContain('N');expect(d.labels).toContain('S');
  expect(d.ellipses.filter(e=>e[0]===320)).toHaveLength(3);
  await page.getByRole('button',{name:'🔓 断开电流'}).click();
  await expect(page.locator('#infoA')).toContainText('未吸起');
});
test('电动机注明换向假设，动画可暂停和跨模式保持',async({page})=>{
  await page.addInitScript(()=>{
    const raf=window.requestAnimationFrame,cancel=window.cancelAnimationFrame,pending=new Set();window.__pendingFrames=pending;
    window.requestAnimationFrame=cb=>{const id=raf.call(window,t=>{pending.delete(id);cb(t);});pending.add(id);return id;};
    window.cancelAnimationFrame=id=>{pending.delete(id);return cancel.call(window,id);};
  });
  await page.goto(url);await page.getByRole('button',{name:'电动机'}).click();
  await page.getByRole('button',{name:'🔌 接通电流'}).click();
  await expect(page.locator('#infoB')).toContainText('假设换向');
  let d=await drawing(page);expect(d.labels).toContain('假设换向装置使线圈持续转动（未画出）');
  await page.getByRole('button',{name:'暂停动画'}).click();
  await expect(page.locator('#infoA')).toContainText('已暂停');
  expect(await page.evaluate(()=>window.__pendingFrames.size)).toBe(0);
  await page.getByRole('button',{name:'🧪 练习'}).click();
  await page.locator('#p1 .quiz-opt').first().click();
  await expect(page.locator('#p1 .quiz-opt').nth(1)).toBeDisabled();
  await page.getByRole('button',{name:'📖 实验'}).click();
  expect(await page.evaluate(()=>window.__pendingFrames.size)).toBe(0);
  await page.getByRole('button',{name:'继续动画'}).click();
  await expect(page.locator('#infoA')).toContainText('持续转动');
  expect(await page.evaluate(()=>window.__pendingFrames.size)).toBe(1);
});
