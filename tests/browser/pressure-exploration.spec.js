const {test,expect}=require('@playwright/test');
const url='/physics/middle/pressure.html';
test('固体受力向下，液体单位、密度与同深度方向一致',async({page})=>{
  await page.goto(url);
  const pause=page.getByRole('button',{name:'暂停动画'});await pause.click();
  await page.getByLabel('压力 F:').fill('200');await page.getByLabel('面积 S:').fill('10');
  await expect(page.locator('#pVal')).toHaveText('200.0 kPa');
  const forceArrow=await page.evaluate(()=>{
    const old=drawArrow,arrows=[];drawArrow=(...args)=>{arrows.push(args);return old(...args);};
    try{draw();return arrows.find(a=>a[4]==='#f59e0b');}finally{drawArrow=old;}
  });
  expect(forceArrow[0]).toBe(forceArrow[2]);expect(forceArrow[1]).toBeLessThan(forceArrow[3]);
  const liquid=page.getByRole('button',{name:'🌊 液体压强'});await liquid.focus();await page.keyboard.press('Enter');
  const water=page.getByRole('button',{name:'水 (1.0 g/cm³)'});
  await expect(water).toHaveAttribute('aria-pressed','true');
  await page.getByLabel('深度 h:').fill('400');
  await expect(page.locator('#lhVal')).toHaveText('40.0 cm');
  await expect(page.locator('#lpVal')).toHaveText('3.92 kPa');
  const arrows=await page.evaluate(()=>{
    const old=drawArrow,arrows=[];drawArrow=(...args)=>{if(args[4]==='rgba(59,130,246,0.7)')arrows.push(args.slice(0,4));return old(...args);};
    try{draw();return arrows;}finally{drawArrow=old;}
  });
  expect(arrows).toHaveLength(12);
  for(let i=0;i<arrows.length;i+=4){
    const group=arrows.slice(i,i+4), lengths=group.map(([x,y,a,b])=>Math.hypot(a-x,b-y));
    for(const len of lengths)expect(len).toBeCloseTo(lengths[0]);
  }
  await page.getByRole('button',{name:'油 (0.8 g/cm³)'}).click();
  await expect(page.locator('#lpVal')).toHaveText('3.14 kPa');
  await page.getByRole('button',{name:'🧱 固体压强'}).click();await liquid.click();
  await expect(page.getByRole('button',{name:'油 (0.8 g/cm³)'})).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#lpVal')).toHaveText('3.14 kPa');
  await expect(page.getByRole('button',{name:'继续动画'})).toHaveAttribute('aria-pressed','true');
});
test('练习只记录首次作答，三道正确答案保存完成',async({page})=>{
  await page.goto(url);await page.getByRole('button',{name:'🎯 互动练习'}).click();
  await page.locator('.quiz-opt').nth(0).click();await expect(page.locator('#quizFb')).toContainText('错误');
  await expect(page.locator('.quiz-opt').nth(1)).toBeDisabled();
  await page.locator('#nextQ').click();await page.locator('#prevQ').click();
  await expect(page.locator('.quiz-opt').nth(1)).toBeDisabled();
  await expect(page.locator('#quizProgress')).toContainText('答对 0 题');
  await page.locator('#resetQuiz').click();
  for(const [i,answer] of [1,2,2].entries()) {await page.locator('.quiz-opt').nth(answer).click();if(i<2) await page.locator('#nextQ').click();}
  await expect(page.locator('#quizProgress')).toContainText('答对 3 题');
  await expect(page.locator('#quizProgress')).toContainText('已记录完成');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('kv-physics-middle-progress')));
  expect(saved.pressure).toBeTruthy();
});
test('存储失败时可重试进度保存',async({page})=>{
  await page.addInitScript(()=>{window.__originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new Error('denied');};});
  await page.goto(url);await page.getByRole('button',{name:'🎯 互动练习'}).click();
  for(const [i,answer] of [1,2,2].entries()){await page.locator('.quiz-opt').nth(answer).click();if(i<2)await page.locator('#nextQ').click();}
  await expect(page.locator('#quizProgress')).toContainText('进度未保存');
  await page.evaluate(()=>{Storage.prototype.setItem=window.__originalSetItem;});
  await page.getByRole('button',{name:'重新保存进度'}).click();
  await expect(page.locator('#quizProgress')).toContainText('已记录完成');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('kv-physics-middle-progress')).pressure)).toBeTruthy();
});

test('帕斯卡理想比例及大气演示选择保持',async({page})=>{
  await page.goto(url);await page.getByRole('button',{name:'暂停动画'}).click();
  await page.getByRole('button',{name:'⚙️ 帕斯卡原理'}).click();
  await page.getByLabel('小活塞力 F₁:').fill('100');
  await page.getByLabel('面积比 S₂/S₁:').fill('10');
  await expect(page.locator('#pf2Val')).toHaveText('1000N');
  await expect(page.locator('#pMult')).toHaveText('10倍');
  await expect(page.locator('#panelContent')).toContainText('图形尺寸仅为示意');
  const pistons=await page.evaluate(()=>{
    t=20;const p=CanvasRenderingContext2D.prototype,old=p.fillRect,result=[];
    p.fillRect=function(x,y,w,h){if((x===155||x===405)&&h===15)result.push([x,y]);return old.call(this,x,y,w,h);};
    try{draw();return result;}finally{p.fillRect=old;}
  });
  expect(pistons).toHaveLength(2);
  expect(pistons[0][1]-270).toBeCloseTo((220-pistons[1][1])*10);
  await page.getByRole('button',{name:'🎈 大气压强'}).click();
  await page.getByRole('button',{name:'托里拆利'}).click();
  await page.getByRole('button',{name:'🧱 固体压强'}).click();
  await page.getByRole('button',{name:'🎈 大气压强'}).click();
  await expect(page.getByRole('button',{name:'托里拆利'})).toHaveAttribute('aria-pressed','true');
});
