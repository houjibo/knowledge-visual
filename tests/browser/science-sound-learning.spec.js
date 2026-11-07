const { test, expect } = require('@playwright/test');
const url = '/science/sound.html';
async function wave(page) {
  return page.evaluate(() => {
    const oldBegin=ctx.beginPath, oldMove=ctx.moveTo, oldLine=ctx.lineTo, oldStroke=ctx.stroke;
    let current=[], paths=[];
    ctx.beginPath=function(){current=[]; return oldBegin.call(this);};
    ctx.moveTo=function(x,y){current.push([x,y]);return oldMove.call(this,x,y);};
    ctx.lineTo=function(x,y){current.push([x,y]);return oldLine.call(this,x,y);};
    ctx.stroke=function(){if(current.length>500)paths.push(current.slice());return oldStroke.call(this);};
    try { t=0; drawPitchVolume(); return paths[0]; }
    finally {ctx.beginPath=oldBegin;ctx.moveTo=oldMove;ctx.lineTo=oldLine;ctx.stroke=oldStroke;}
  });
}
function crossings(points) {
  let n=0;
  for(let i=1;i<points.length;i++) if((points[i-1][1]-250)*(points[i][1]-250)<0)n++;
  return n;
}

test('频率档位和示意振幅与波形一致，可暂停并键盘操作', async ({ page }) => {
  await page.addInitScript(() => {
    const raf=window.requestAnimationFrame,cancel=window.cancelAnimationFrame,pending=new Set();
    window.__frames=pending;
    window.requestAnimationFrame=cb=>{const id=raf.call(window,t=>{pending.delete(id);cb(t);});pending.add(id);return id;};
    window.cancelAnimationFrame=id=>{pending.delete(id);return cancel.call(window,id);};
  });
  await page.goto(url);
  await page.getByRole('button',{name:'暂停动画'}).click();
  expect(await page.evaluate(()=>window.__frames.size)).toBe(0);
  await page.getByRole('button',{name:'🎹 音调与响度'}).focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#panel')).toContainText('不表示实际赫兹或分贝');
  const freq=page.getByRole('slider',{name:'频率档位'}), amp=page.getByRole('slider',{name:'振幅（示意）'});
  await freq.fill('3'); await amp.fill('20'); const low=await wave(page);
  await freq.fill('6'); await amp.fill('60'); const high=await wave(page);
  expect(crossings(high)).toBeGreaterThan(crossings(low));
  expect(Math.max(...high.map(p=>Math.abs(p[1]-250)))).toBeGreaterThan(59);
  await expect(page.locator('#pitchVal')).toHaveText('6 档');
  expect(await page.evaluate(()=>window.__frames.size)).toBe(0);
  await page.getByRole('button',{name:/鸟叫/}).click();
  await expect(freq).toHaveValue('6');
  await expect(amp).toHaveValue('20');
  await page.getByRole('button',{name:'继续动画'}).click();
  expect(await page.evaluate(()=>window.__frames.size)).toBe(1);
});

test('介质示例、选择状态和声音产生解释一致', async ({ page }) => {
  await page.goto(url);
  await expect(page.locator('#panel')).toContainText('已经发出的声波仍会继续传播');
  await expect(page.locator('#freqVal')).toContainText('档');
  await page.getByRole('button',{name:'🌊 声音的传播'}).click();
  await expect(page.locator('#panel')).toContainText('不能将这三个例子的快慢顺序推广');
  await expect(page.locator('#panel')).toContainText('声波不能传播');
  await page.getByRole('button',{name:'💧 淡水'}).click();
  await expect(page.getByRole('button',{name:'💧 淡水'})).toHaveClass(/active/);
  await page.getByRole('button',{name:'🎵 声音的产生'}).click();
  await page.getByRole('button',{name:'🌊 声音的传播'}).click();
  await expect(page.getByRole('button',{name:'💧 淡水'})).toHaveClass(/active/);
  expect(await page.evaluate(()=>state.medium)).toBe('water');
});

test('回看不会重复计分，完成后记录可刷新', async ({ page }) => {
  await page.goto(url);
  await page.getByRole('button',{name:'🌊 声音的传播'}).click();
  await page.getByRole('button',{name:'🎹 音调与响度'}).click();
  await page.getByRole('button',{name:'📝 小测验'}).click();
  await page.locator('#quizOpts button').nth(0).focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#quizScoreLabel')).toHaveText('1');
  await page.getByRole('button',{name:'🎵 声音的产生'}).click();
  await page.getByRole('button',{name:'📝 小测验'}).click();
  await expect(page.locator('#quizOpts button').nth(0)).toBeDisabled();
  await expect(page.locator('#quizScoreLabel')).toHaveText('1');
  await page.locator('#quizNext').click(); await page.locator('#quizPrev').click();
  await expect(page.locator('#quizOpts button').nth(0)).toBeDisabled();
  await expect(page.locator('#quizOpts button').nth(0)).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#quizScoreLabel')).toHaveText('1');
  await page.locator('#quizNext').click();
  for (const index of [2,1,1,2,1]) { await page.locator('#quizOpts button').nth(index).click(); await page.locator('#quizNext').click(); }
  await expect(page.locator('#panel')).toContainText('6 / 6');
  await expect(page.locator('#done-mark')).toBeVisible();
  await page.getByRole('button',{name:'🎵 声音的产生'}).click();
  await page.getByRole('button',{name:'📝 小测验'}).click();
  await expect(page.locator('#panel')).toContainText('6 / 6');
  await page.getByRole('button',{name:'🔄 再来一次'}).click();
  await expect(page.locator('#quizScoreLabel')).toHaveText('0');
  await page.reload(); await expect(page.locator('#done-mark')).toBeVisible();
});
