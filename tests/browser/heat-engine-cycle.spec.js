const {test,expect}=require('@playwright/test');
const url='/physics/middle/heat-engine.html';
async function geometry(page,stroke,progress){
  return page.evaluate(({stroke,progress})=>{
    strokeIdx=stroke;phase=progress;
    const p=CanvasRenderingContext2D.prototype,old={fillRect:p.fillRect,arc:p.arc},out={valves:{}};
    p.fillRect=function(x,y,w,h){if(x===304&&w===192&&h===30)out.piston=y; if((x===330||x===456)&&w===14)out.valves[x]=this.fillStyle; return old.fillRect.call(this,x,y,w,h);};
    p.arc=function(x,y,r,...rest){if(r===5)out.pin=[x,y];return old.arc.call(this,x,y,r,...rest);};
    try{render();return out;}finally{Object.assign(p,old);}
  },{stroke,progress});
}
test('四冲程曲柄连续同向转动两圈，活塞往复一致',async({page})=>{
  await page.goto(url);await page.getByRole('button',{name:'⏸ 暂停'}).click();
  for(const [stroke,x,left,right] of [[0,430,'#22c55e','#475569'],[1,370,'#475569','#475569'],[2,430,'#475569','#475569'],[3,370,'#475569','#ef4444']]){
    const g=await geometry(page,stroke,0.5);
    expect(g.piston).toBeCloseTo(215);expect(g.pin[0]).toBeCloseTo(x);expect(g.pin[1]).toBeCloseTo(400);
    expect(g.valves[330]).toBe(left);expect(g.valves[456]).toBe(right);
  }
  const top=await geometry(page,0,0),bottom=await geometry(page,1,0);
  expect(top.piston).toBeCloseTo(130);expect(top.pin[1]).toBeCloseTo(370);
  expect(bottom.piston).toBeCloseTo(300);expect(bottom.pin[1]).toBeCloseTo(430);
  await expect(page.locator('#engineCanvas')).toHaveAttribute('aria-label',/压缩冲程.*机械能→内能/);
});
test('零速度停止、逐冲程跳转和暂停跨模式保持',async({page})=>{
  await page.addInitScript(()=>{
    const raf=window.requestAnimationFrame,cancel=window.cancelAnimationFrame,pending=new Set();window.__pendingFrames=pending;
    window.requestAnimationFrame=cb=>{const id=raf.call(window,t=>{pending.delete(id);cb(t);});pending.add(id);return id;};
    window.cancelAnimationFrame=id=>{pending.delete(id);return cancel.call(window,id);};
  });
  await page.goto(url);
  const speed=page.getByRole('slider',{name:'动画速度'});await speed.fill('0');
  await expect(page.locator('#valSpeed')).toHaveText('停止（速度为 0）');
  expect(await page.evaluate(()=>window.__pendingFrames.size)).toBe(0);
  const step=page.getByRole('button',{name:'⏭ 跳到下一冲程起点'});
  for(const [name,energy] of [['压缩','机械能→内能'],['做功','内能→机械能'],['排气','——'],['吸气','——']]){
    await step.click();await expect(page.locator('#infoStroke')).toContainText(name);await expect(page.locator('#infoEnergy')).toContainText(energy);
  }
  await expect(page.getByRole('button',{name:'▶ 继续'})).toHaveAttribute('aria-pressed','true');
  await speed.fill('50');expect(await page.evaluate(()=>window.__pendingFrames.size)).toBe(0);
  await page.getByRole('button',{name:'🧪 计算'}).click();await page.getByRole('button',{name:'📖 探究'}).click();
  expect(await page.evaluate(()=>window.__pendingFrames.size)).toBe(0);
  await page.getByRole('button',{name:'▶ 继续'}).click();expect(await page.evaluate(()=>window.__pendingFrames.size)).toBe(1);
  await expect(page.locator('.concept-card').filter({hasText:'柴油机'})).toContainText('燃料在高温空气中自燃');
});
