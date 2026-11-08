const {test, expect}=require('@playwright/test');
const url='/physics/middle/household-circuits.html';
test('短路后保护切断、负载电流归零，恢复正常后可调参数',async({page})=>{
  await page.goto(url);
  const power=page.getByLabel('示意电阻负载功率');
  await power.fill('2200'); await expect(page.locator('#infoI')).toContainText('10.0 A');
  const short=page.getByRole('button',{name:'💥 短路跳闸'});
  await short.focus(); await page.keyboard.press('Enter');
  await expect(short).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#infoI')).toContainText('熔断后 0 A');
  await expect(page.locator('#infoFuse')).toContainText('已熔断');
  await expect(power).toBeDisabled();
  await expect(page.locator('#homeCanvas')).toHaveAttribute('aria-label',/瞬时电流未计算/);
  const strokes=await page.evaluate(()=>{
    const p=CanvasRenderingContext2D.prototype,old={moveTo:p.moveTo,lineTo:p.lineTo,stroke:p.stroke},paths=[];let path=[];
    p.moveTo=function(x,y){path=[x,y];return old.moveTo.call(this,x,y);};
    p.lineTo=function(x,y){path.push(x,y);return old.lineTo.call(this,x,y);};
    p.stroke=function(){paths.push({path:path.slice(),color:this.strokeStyle});return old.stroke.call(this);};
    try{drawScene();return paths;}finally{Object.assign(p,old);}
  });
  expect(strokes).toContainEqual({path:[40,150,250,150],color:'#ef4444'});
  expect(strokes).toContainEqual({path:[330,150,680,150],color:'#64748b'});
  expect(strokes.some(s=>s.path.join(',')==='560,150,560,330')).toBe(false);
  await page.getByRole('button',{name:'✅ 正常用电'}).click();
  await expect(power).toBeEnabled(); await expect(page.locator('#infoI')).toContainText('10.0 A');
});
test('验电示意与测验均不把不亮视为无电证明',async({page})=>{
  await page.goto(url);
  await expect(page.locator('.concept-card').filter({hasText:'三孔插座'})).toContainText('不亮不能证明无电');
  await page.getByRole('button',{name:'🖊 试电笔'}).click();
  const labels=await page.evaluate(()=>{
    const p=CanvasRenderingContext2D.prototype,old=p.fillText,texts=[];
    p.fillText=function(text,...args){texts.push(String(text));return old.call(this,text,...args);};
    try{drawScene();return texts;}finally{p.fillText=old;}
  });
  expect(labels.some(t=>t.includes('不亮不能证明无电'))).toBe(true);
  await page.getByRole('button',{name:'🎯 测验'}).click(); await page.locator('#quizStart').click();
  await page.locator('#quizOpts button').nth(1).click();
  await expect(page.locator('#quizFb')).not.toContainText('不高于 36 V');
  for(let i=0;i<3;i++) await page.locator('#quizNext').click();
  await page.locator('#quizOpts button').nth(1).click();
  await expect(page.locator('#quizFb')).toContainText('不亮不能证明无电');
  await page.getByRole('button',{name:'🧪 计算'}).click();
  await expect(page.locator('#sec-practice')).toContainText('不表示实际线路的安全容量');
});
test('触电处置流程先自保呼救，保险丝熔断题引导求助专业人员',async({page})=>{
  await page.goto(url);
  const response=page.locator('#shockResponse');
  await expect(response).toBeVisible();
  const steps=response.locator('li');
  await expect(steps).toHaveCount(3);
  await expect(steps.nth(0)).toContainText('先呼救');
  await expect(steps.nth(0)).toContainText('成年人');
  await expect(steps.nth(1)).toContainText('安全位置');
  await expect(steps.nth(2)).toContainText('未确认断电前');
  await expect(steps.nth(2)).toContainText('伤者或电线');
  const viewport=page.viewportSize();
  const columns=await response.locator('.shock-steps').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
  expect(columns).toBe(viewport.width>768?3:1);
  await expect(response).toContainText('高压或落地电线');
  await expect(response).toContainText('立即远离');
  await expect(response).toContainText('电力部门和急救服务');

  await page.setViewportSize({width:320,height:844});
  const narrowColumns=await response.locator('.shock-steps').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
  expect(narrowColumns).toBe(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

  await page.getByRole('button',{name:'🎯 测验'}).click();
  await page.locator('#quizStart').click();
  for(let i=0;i<4;i++) await page.locator('#quizNext').click();
  await expect(page.locator('#quizQ')).toContainText('保险丝熔断');
  await page.locator('#quizOpts button').nth(2).click();
  await expect(page.locator('#quizFb')).toContainText('专业人员');
  await expect(page.locator('#quizFb')).toContainText('铜丝');
});
