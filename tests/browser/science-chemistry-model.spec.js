const {test,expect}=require('@playwright/test');
const url='/science/chemistry.html';

test('石蕊动画持续插值，酸、碱与中性反馈一致',async({page})=>{
  await page.goto(url);
  await page.getByRole('button',{name:'🌈 酸碱变色'}).focus();await page.keyboard.press('Enter');
  await page.getByRole('button',{name:'🫙 白醋'}).click();
  await expect(page.locator('#sceneStatus')).toContainText('酸性');
  const color=await page.evaluate(()=>{
    indicatorColor='#a855f7';indicatorTarget='#ef4444';
    for(let i=0;i<150;i++)updateIndicator();
    return indicatorColor.match(/\d+/g).map(Number);
  });
  expect(color[0]).toBeGreaterThan(color[2]*2);
  const tubeArcs=await page.evaluate(()=>{
    const arcs=[],old=ctx.arc;ctx.arc=function(...args){arcs.push(args);return old.apply(this,args);};
    try{drawIndicator();return arcs.filter(a=>a[0]===350&&(a[1]===400||a[1]===398));}finally{ctx.arc=old;}
  });
  expect(tubeArcs).toHaveLength(2);
  expect(tubeArcs.every(a=>a[5]===true)).toBe(true);
  await page.getByRole('button',{name:'暂停动画'}).click();
  await page.getByRole('button',{name:'🧴 肥皂水'}).click();
  await expect(page.locator('#sceneStatus')).toContainText('碱性');
  expect(await page.evaluate(()=>indicatorColor)).toBe('#3b82f6');
  await page.getByRole('button',{name:'💧 纯水'}).click();
  await expect(page.locator('#sceneStatus')).toContainText('中性');
  expect(await page.evaluate(()=>indicatorColor)).toBe('#a855f7');
});

test('搅拌有键盘入口，糖盐消失判断不受沙子干扰',async({page})=>{
  await page.goto(url);
  await page.getByRole('button',{name:'暂停动画'}).click();
  await page.getByRole('button',{name:'🍬 加糖'}).click();
  await page.getByRole('button',{name:'⏳ 加沙子'}).click();
  const stir=page.getByRole('button',{name:'🥄 搅拌'});
  await stir.focus();await page.keyboard.press('Enter');
  await expect(page.locator('#sceneStatus')).toContainText('搅拌');
  const labels=await page.evaluate(()=>{
    dissolveParticles=dissolveParticles.filter(p=>p.type==='sand');
    const out=[],old=ctx.fillText;ctx.fillText=function(text,...args){out.push(text);return old.call(this,text,...args);};
    try{drawDissolveParticles();return out;}finally{ctx.fillText=old;}
  });
  expect(labels.some(t=>t.includes('未模拟饱和'))).toBe(true);
});

test('气泡动画有限，说明化学反应与物理释放',async({page})=>{
  await page.clock.install({time: new Date('2026-01-01T00:00:00Z')}); await page.clock.pauseAt(new Date('2026-01-01T00:00:00Z'));
  await page.goto(url);
  await page.getByRole('button',{name:'💥 气泡反应'}).click();
  await page.getByRole('button',{name:'🧂 加小苏打'}).click();
  await expect(page.locator('#sceneStatus')).toContainText('反应产生二氧化碳');
  const status=await page.evaluate(()=>{for(let i=0;i<360;i++)updateReaction();return {active:rxnActive,remaining:rxnRemaining};});
  expect(status).toEqual({active:false,remaining:0});
  await expect(page.locator('#sceneStatus')).toContainText('本轮动画已结束');
  await page.getByRole('button',{name:'🍬 加薄荷糖'}).click();
  await expect(page.locator('#sceneStatus')).toContainText('已有的二氧化碳逸出');
  await page.getByRole('button',{name:'🔄 重置'}).click();
  expect(await page.evaluate(()=>[rxnActive,bubbles.length])).toEqual([false,0]);
});

test('不同题目计分且存储失败可重试',async({page})=>{
  await page.clock.install({time: new Date('2026-01-01T00:00:00Z')}); await page.clock.pauseAt(new Date('2026-01-01T00:00:00Z'));
  await page.addInitScript(()=>{
    const old=Storage.prototype.setItem;
    Storage.prototype.setItem=function(k,v){if(k==='kv-science-progress')throw new Error('blocked');return old.call(this,k,v);};
    window.__restoreStorage=()=>{Storage.prototype.setItem=old;};
  });
  await page.goto(url);
  for(let q=0;q<5;q++){
    await page.locator('#quizOpts button').nth(q===0?1:(q===1?0:0)).click();
    await page.clock.runFor(2600);
  }
  await expect(page.locator('#quizProgress')).toContainText('1 / 3');
  await expect(page.locator('#done-mark')).toBeHidden();
  await page.locator('#quizOpts button').nth(1).click();await page.clock.runFor(2600);
  await expect(page.locator('#quizProgress')).toContainText('1 / 3');
  await page.locator('#quizOpts button').nth(2).click();await page.clock.runFor(2600);
  await page.locator('#quizOpts button').nth(1).click();
  await expect(page.locator('#quizProgress')).toContainText('3 / 3');
  await expect(page.locator('#progressStatus')).toContainText('未保存');
  await page.evaluate(()=>window.__restoreStorage());
  await page.getByRole('button',{name:'重试保存进度'}).click();
  await expect(page.locator('#done-mark')).toBeVisible();
  await page.reload();await expect(page.locator('#done-mark')).toBeVisible();
});
