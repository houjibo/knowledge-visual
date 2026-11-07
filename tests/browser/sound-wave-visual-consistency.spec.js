const {test,expect}=require('@playwright/test');
const url='/physics/middle/sound.html';

test('波形周期、波长标尺和振幅档位一致',async({page})=>{
  await page.goto(url); const tab=page.getByRole('button',{name:'🎹 音调与响度'}); await tab.focus(); await page.keyboard.press('Enter');
  await expect(tab).toHaveAttribute('aria-pressed','true');
  await page.getByLabel('📊 频率(Hz)').fill('680'); await page.getByLabel('📢 振幅（相对档位）').fill('50');
  await expect(page.locator('#toneSummary')).toContainText('波长约 0.50 m');
  for(const [name,type] of [['〰️ 正弦波','sine'],['⊓ 方波','square'],['⩘ 锯齿波','saw']]) {
    const button=page.getByRole('button',{name,exact:true}); await button.focus(); await page.keyboard.press('Space'); await expect(button).toHaveAttribute('aria-pressed','true');
    const result=await page.evaluate(type=>{
      tonePlaying=false; toneTime=0; const points=[]; const old=ctx.lineTo;
      ctx.lineTo=function(x,y){points.push([x,y]);return old.call(this,x,y);};
      drawTone();ctx.lineTo=old; return {model:toneModel(frequency,amplitude),points:points.slice(0,599),type};
    },type);
    expect(result.model.wavelength).toBeCloseTo(.5,8); expect(result.model.wavelengthPx).toBeCloseTo(150,8); expect(result.model.amplitudePx).toBe(40);
    const points=result.points; const at=x=>points.find(p=>p[0]===x)[1];
    expect(at(100)).toBeCloseTo(at(250),7);
    const ys=points.map(p=>p[1]); expect(Math.max(...ys)).toBeGreaterThan(298); expect(Math.min(...ys)).toBeLessThan(222);
  }
});

test('暂停与减少动态效果保留参数反馈',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'}); await page.goto(url);
  await page.getByRole('button',{name:'🎹 音调与响度'}).click();
  const toggle=page.locator('#toneMotion'); await expect(toggle).toHaveText('播放波形');
  const before=await page.evaluate(()=>toneTime); await page.waitForTimeout(150); expect(await page.evaluate(()=>toneTime)).toBe(before);
  await page.getByLabel('📊 频率(Hz)').fill('500'); await expect(page.locator('#toneSummary')).toContainText('波长约 0.68 m');
  await toggle.click(); await expect(toggle).toHaveText('暂停波形');
  await expect.poll(()=>page.evaluate(()=>toneTime)).toBeGreaterThan(before);
});

test('切换介质清除旧声波，真空不生成介质粒子',async({page})=>{
  await page.goto(url); await page.locator('#cv').click();
  expect(await page.evaluate(()=>waveRings.length)).toBeGreaterThan(0);
  await page.getByRole('button',{name:'🚫 真空'}).click();
  await expect(page.getByRole('button',{name:'🚫 真空'})).toHaveAttribute('aria-pressed','true');
  expect(await page.evaluate(()=>waveRings.length)).toBe(0);
  await page.locator('#cv').click(); expect(await page.evaluate(()=>[waveRings.length,particles.length])).toEqual([0,0]);
});
