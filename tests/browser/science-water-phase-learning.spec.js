const {test,expect}=require('@playwright/test');
const url='/science/matter-changes.html';
const tabs=['🧊 物质三态','🌡️ 物态变化','🔬 热胀冷缩','🧪 互动实验'];
const answers=[[0,2,1],[1,2,1],[1,1,2],[2,2,1]];
async function completeQuiz(page){
  for(let tab=0;tab<4;tab++){
    await page.getByRole('button',{name:tabs[tab]}).click();
    for(let i=0;i<3;i++){
      const options=page.locator(`#quiz${tab} .quiz-opt`);
      await options.nth(answers[tab][i]).focus();await page.keyboard.press('Enter');
      await expect(page.locator(`#quiz${tab} .quiz-feedback`)).toContainText('正确');
      if(i<2)await page.locator(`#quiz${tab} .quiz-nav button`).nth(1).click();
    }
  }
}

test('温度边界说明相态可能共存，物质选择互不干扰',async({page})=>{
  await page.goto(url);
  await page.getByRole('button',{name:'液态（水）'}).click();
  await page.getByRole('button',{name:'🌡️ 物态变化'}).click();
  const slider=page.getByRole('slider',{name:'🌡️ 温度'});
  for(const [value,word,stateName] of [[-1,'显示冰','solid'],[0,'冰和水可能共存','melting'],[50,'液态水','liquid'],[100,'水和水蒸气可能共存','boiling'],[101,'水蒸气','gas']]){
    await slider.fill(String(value));
    await expect(page.locator('#phaseInfo')).toContainText(word);
    expect(await page.evaluate(v=>getStateForTemp(v),value)).toBe(stateName);
  }
  await page.getByRole('button',{name:'🧊 物质三态'}).click();
  await expect(page.getByRole('button',{name:'液态（水）'})).toHaveClass(/active/);
  expect(await page.evaluate(()=>currentState)).toBe('liquid');
  const displacement=await page.evaluate(()=>{
    const p=particles[0];p.x=cW()/2;p.y=cH()/2;p.vx=1;p.vy=0;
    const before=p.x;drawParticles('liquid',20);return p.x-before;
  });
  expect(displacement).toBeGreaterThan(1);
});

test('加热过程在熔化与沸腾期间保持温度，暂停和重置可用',async({page})=>{
  await page.clock.install();await page.clock.pauseAt(Date.now());
  await page.goto(url);
  await page.getByRole('button',{name:'🧪 互动实验'}).click();
  await page.getByRole('button',{name:'🔥 开始加热'}).focus();await page.keyboard.press('Enter');
  await page.evaluate(()=>advanceHeating(3));
  await expect(page.locator('#expResult')).toContainText('熔化中');
  await expect(page.locator('#expTempVal')).toHaveText('0°C');
  await page.evaluate(()=>advanceHeating(1.5));
  expect(await page.evaluate(()=>heatingStage(expElapsed).fraction)).toBeCloseTo(0.5);
  await expect(page.locator('#expTempVal')).toHaveText('0°C');
  await page.getByRole('button',{name:'⏸️ 暂停加热'}).click();
  await page.evaluate(()=>advanceHeating(2));
  expect(await page.evaluate(()=>expElapsed)).toBeCloseTo(4.5);
  await page.getByRole('button',{name:'🔥 继续加热'}).click();
  await page.evaluate(()=>advanceHeating(7.5));
  await expect(page.locator('#expResult')).toContainText('沸腾中');
  await expect(page.locator('#expTempVal')).toHaveText('100°C');
  await page.evaluate(()=>advanceHeating(1.5));
  expect(await page.evaluate(()=>heatingStage(expElapsed).fraction)).toBeCloseTo(0.5);
  await expect(page.locator('#expTempVal')).toHaveText('100°C');
  await page.evaluate(()=>advanceHeating(3.5));
  await expect(page.getByRole('button',{name:'✅ 加热演示完成'})).toBeDisabled();
  await expect(page.locator('#expTempVal')).toHaveText('120°C');
  await page.getByRole('button',{name:'🔄 重置'}).click();
  await expect(page.locator('#expTempVal')).toHaveText('-10°C');
  await expect(page.getByRole('button',{name:'🔥 开始加热'})).toBeEnabled();
});

test('测验回看保留首次答案，存储失败可重试',async({page})=>{
  await page.addInitScript(()=>{
    const old=Storage.prototype.setItem;
    Storage.prototype.setItem=function(k,v){if(k==='kv-science-progress')throw new Error('blocked');return old.call(this,k,v);};
    window.__restoreStorage=()=>{Storage.prototype.setItem=old;};
  });
  await page.goto(url);
  await page.locator('#quiz0 .quiz-opt').nth(1).click();
  await expect(page.locator('#quiz0 .quiz-feedback')).toContainText('错误');
  await page.getByRole('button',{name:'🔄 重做测验'}).click();
  await expect(page.locator('#quiz0 .quiz-opt').nth(0)).toBeEnabled();
  await expect(page.locator('#quiz0 .quiz-q')).toContainText('已答 0/3');
  await page.locator('#quiz0 .quiz-opt').nth(0).click();
  await page.locator('#quiz0 .quiz-nav button').nth(1).click();
  await page.locator('#quiz0 .quiz-nav button').nth(0).click();
  await expect(page.locator('#quiz0 .quiz-opt').nth(0)).toBeDisabled();
  await expect(page.locator('#quiz0 .quiz-feedback')).toContainText('正确');
  await page.reload();
  await completeQuiz(page);
  await expect(page.locator('#progressStatus')).toContainText('未保存');
  await expect(page.getByRole('button',{name:'重试保存进度'})).toBeVisible();
  await page.evaluate(()=>window.__restoreStorage());
  await page.getByRole('button',{name:'重试保存进度'}).click();
  await expect(page.locator('#progressStatus')).toContainText('已保存');
  await page.reload();
  await expect(page.locator('#done-mark')).toBeVisible();
});
