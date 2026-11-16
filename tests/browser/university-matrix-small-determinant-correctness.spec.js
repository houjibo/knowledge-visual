const {test,expect}=require('@playwright/test');
const {resolve}=require('node:path');
const {pathToFileURL}=require('node:url');
const {startReleaseServer}=require('./release-server');
const topic=process.env.KV_PUBLISHED_BASE_URL ? new URL('math/uni/matrix.html',process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/,'/')).href : '/math/uni/matrix.html';
async function open(page,url=topic){await page.goto(url);await page.locator('[data-tab="inverse"]').click();}
async function matrix(page,values){for(const [i,id] of ['s_m11','s_m12','s_m21','s_m22'].entries()) await page.locator('#'+id).fill(String(values[i]));}

test('小非零行列式、零矩阵和精确奇异矩阵分支一致',async({page})=>{
  await page.addInitScript(()=>{const old=CanvasRenderingContext2D.prototype.fillText;window.canvasText=[];CanvasRenderingContext2D.prototype.fillText=function(s,...args){window.canvasText.push(String(s));return old.call(this,s,...args)};});
  await open(page);
  await matrix(page,[0.05,0,0,0.05]);
  await expect(page.locator('#panel')).toContainText('0.0025');
  await expect(page.locator('#panel')).toContainText('rank(M)2');
  await expect(page.locator('#panel')).toContainText('✅ 可逆');
  await expect(page.locator('#panel')).toContainText('零空间{0}');
  expect(await page.evaluate(()=>window.canvasText.some(s=>/M⁻¹ = \[20\.00, -?0\.00; -?0\.00, 20\.00\]/.test(s)))).toBe(true);
  await matrix(page,[0,0,0,0]);
  await expect(page.locator('#panel')).toContainText('rank(M)0');
  await expect(page.locator('#panel')).toContainText('全空间');
  await expect(page.locator('#panel')).toContainText('❌ 奇异');
  await expect(page.locator('#panel .equation')).toHaveCount(1);
  await matrix(page,[0.1,0.2,0.15,0.3]);
  await expect(page.locator('#panel')).toContainText('0.0000');
  await expect(page.locator('#panel')).toContainText('rank(M)1');
  await expect(page.locator('#panel')).toContainText('一条直线');
  await expect(page.locator('#panel')).toContainText('❌ 奇异');
  await matrix(page,[0.05,0,0,-0.05]);
  await expect(page.locator('#panel')).toContainText('-0.0025');
  await expect(page.locator('#panel')).toContainText('rank(M)2');
});

test('键盘连续调节保留焦点和结果',async({page})=>{
  await open(page);await matrix(page,[0.05,0,0,0.05]);
  await page.locator('#s_m11').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
  await expect(page.locator('#s_m11')).toBeFocused();await expect(page.locator('#s_m11')).toHaveValue('0.15');
  await expect(page.locator('#panel')).toContainText('0.0075');await expect(page.locator('#panel')).toContainText('✅ 可逆');
});

test('320px、文件直开与发布子路径',async({page})=>{
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL,'本地文件与构建路径检查');
  await page.setViewportSize({width:320,height:700});await open(page,pathToFileURL(resolve('math/uni/matrix.html')).href);
  await matrix(page,[0.05,0,0,0.05]);await expect(page.locator('#panel')).toContainText('0.0025');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  expect(await page.locator('#panel').evaluate(panel => [...panel.querySelectorAll('.slider-row .val')].every(el => el.getBoundingClientRect().right <= panel.getBoundingClientRect().right - 1))).toBe(true);
  for (const tab of ['det','transform','inverse']) {
    await page.locator('[data-tab="'+tab+'"]').click();
    expect(await page.locator('#panel').evaluate(panel => panel.scrollWidth <= panel.clientWidth)).toBe(true);
  }
  const release=await startReleaseServer();try{await open(page,new URL('math/uni/matrix.html',release.base).href);await matrix(page,[0.05,0,0,0.05]);await expect(page.locator('#panel')).toContainText('✅ 可逆');}finally{await release.close();}
});
