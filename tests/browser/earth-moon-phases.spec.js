const { test, expect } = require('@playwright/test');
const url='/science/earth-space.html';

test('日地月位置、月相名称及可见亮面一致',async({page})=>{
  await page.goto(url);
  await page.getByRole('button',{name:'月相',exact:true}).click();
  const slider=page.getByRole('slider',{name:'月球轨道位置'});
  const cases=[
    {deg:0,name:'新月',pct:0,x:510,y:230,lit:[false,false]},
    {deg:90,name:'上弦月',pct:50,x:360,y:80,lit:[false,true]},
    {deg:180,name:'满月',pct:100,x:210,y:230,lit:[true,true]},
    {deg:270,name:'下弦月',pct:50,x:360,y:380,lit:[true,false]},
    {deg:360,name:'新月',pct:0,x:510,y:230,lit:[false,false]}
  ];
  for(const c of cases){
    await slider.fill(String(c.deg));
    await expect(page.locator('#moonInfo')).toContainText(c.name);
    await expect(page.locator('#moonInfo')).toContainText(`约 ${c.pct}%`);
    await expect(page.getByRole('button',{name:'继续演示'})).toHaveAttribute('aria-pressed','true');
    const info=await page.evaluate(()=>{
      let coords=null;const old=ctx.arc;
      ctx.arc=function(x,y,r,...args){if(r===16)coords={x,y};return old.call(this,x,y,r,...args);};
      try{drawMoon(0);}finally{ctx.arc=old;}
      const light=x=>{const p=ctx.getImageData(x,220,1,1).data;return p[0]>180&&p[1]>160;};
      return {coords,lit:[light(70),light(110)]};
    });
    expect(info.coords.x).toBeCloseTo(c.x,3);expect(info.coords.y).toBeCloseTo(c.y,3);
    expect(info.lit).toEqual(c.lit);
  }
  await expect(page.locator('#sec-learn')).toContainText('不模拟日食和月食');
});

test('暂停、键盘行星选择及演示切换保持状态',async({page})=>{
  await page.addInitScript(()=>{
    const raf=window.requestAnimationFrame,cancel=window.cancelAnimationFrame,pending=new Set();window.__frames=pending;
    window.requestAnimationFrame=cb=>{const id=raf.call(window,t=>{pending.delete(id);cb(t);});pending.add(id);return id;};
    window.cancelAnimationFrame=id=>{pending.delete(id);return cancel.call(window,id);};
  });
  await page.goto(url);
  await page.getByRole('button',{name:'暂停演示'}).click();
  expect(await page.evaluate(()=>window.__frames.size)).toBe(0);
  const jupiter=page.getByRole('button',{name:'木星',exact:true});
  await jupiter.focus();await page.keyboard.press('Enter');
  await expect(jupiter).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#infoB')).toContainText('第 5 位');
  await expect(page.locator('#infoA')).toContainText('木星');
  await page.getByRole('button',{name:'月相',exact:true}).click();
  await page.getByRole('slider',{name:'月球轨道位置'}).fill('180');
  await page.getByRole('button',{name:'🧪 练习'}).click();
  await page.getByRole('button',{name:'📖 探究'}).click();
  await expect(page.locator('#moonInfo')).toContainText('满月');
  expect(await page.evaluate(()=>window.__frames.size)).toBe(0);
  await page.getByRole('button',{name:'继续演示'}).click();
  expect(await page.evaluate(()=>window.__frames.size)).toBe(1);
});
