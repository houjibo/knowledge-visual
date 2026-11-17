const {test,expect}=require('@playwright/test');
const {resolve}=require('node:path');
const {pathToFileURL}=require('node:url');
const {startReleaseServer}=require('./release-server');
const topic=process.env.KV_PUBLISHED_BASE_URL
  ?new URL('math/uni/haar-basis-compression.html',process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/,'/')).href
  :'/math/uni/haar-basis-compression.html';

async function predict(page,{mean,first,error,lossless}){
  await page.locator('#meanGuess').fill(mean);await page.locator('#firstPixelGuess').fill(first);await page.locator('#errorGuess').fill(error);await page.locator('#losslessGuess').selectOption(lossless);
}
test('先算系数再核对；揭示不记完成；精确重建误差',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(topic);
  await page.locator('#revealAnswer').click();await expect(page.locator('#answerGrid')).toContainText('c=[120, 60, 20, 0]');
  await expect(page.locator('#answerGrid')).toContainText('x̂=Wĉ=[90, 90, 30, 30]');
  await expect(page.locator('#verificationInfo')).toContainText('= 400');
  await expect(page.locator('#reconstructedBlock .pixel')).toHaveText(['90','90','30','30']);
  expect(await page.evaluate(()=>PageProgress.isDone('haar-basis-compression'))).toBe(false);
  await predict(page,{mean:'120',first:'90',error:'400',lossless:'yes'});await page.locator('#checkPrediction').click();
  await expect(page.locator('#predictionFeedback')).toContainText('再核 是否精确重建');await expect(page.locator('#answer')).toBeHidden();
  await page.locator('#losslessGuess').selectOption('no');await page.locator('#checkPrediction').click();
  await expect(page.locator('#predictionFeedback')).toContainText('已完成预测');expect(await page.evaluate(()=>PageProgress.isDone('haar-basis-compression'))).toBe(true);expect(errors).toEqual([]);
});
test('均匀、对角、全黑、保留四项与输入边界',async({page})=>{
  await page.goto(topic);await page.locator('#preset').selectOption('uniform');await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('c=[256, 0, 0, 0]');await expect(page.locator('#verificationInfo')).toContainText('本例为精确重建');
  await page.locator('#preset').selectOption('diagonal');await page.locator('#revealAnswer').click();await expect(page.locator('#answerGrid')).toContainText('c=[240, 0, 0, 200]');await expect(page.locator('#verificationInfo')).toContainText('本例为精确重建');
  await page.locator('#preset').selectOption('zero');await page.locator('#revealAnswer').click();await expect(page.locator('#answerGrid')).toContainText('c=[0, 0, 0, 0]');
  await page.locator('#preset').selectOption('contrast');await page.locator('#keepCount').selectOption('4');await page.locator('#revealAnswer').click();await expect(page.locator('#answerGrid')).toContainText('x̂=Wĉ=[100, 80, 40, 20]');
  await page.locator('#pixel-0').fill('256');await expect(page.locator('#inputStatus')).toContainText('输入无效');await expect(page.locator('#answer')).toBeHidden();await expect(page.locator('#pixel-0')).toHaveAttribute('aria-invalid','true');
  await page.locator('#pixel-0').fill('');await expect(page.locator('#inputStatus')).toContainText('空值不能当作 0');await page.locator('#pixel-0').fill('255');await expect(page.locator('#inputStatus')).toBeEmpty();
  for(const [i,value] of ['0','0','0','64'].entries())await page.locator(`#pixel-${i}`).fill(value);
  await page.locator('#keepCount').selectOption('3');await page.locator('#revealAnswer').click();
  await expect(page.locator('#reconstructedBlock .pixel').first()).toHaveText('-16');
  await expect(page.locator('#reconstructedBlock .pixel').first()).toHaveCSS('background-color','rgb(0, 0, 0)');
  await expect(page.locator('#verificationInfo')).toContainText('1024');
});
test('320px、键盘、目录与文件直开',async({page,browserName})=>{
  await page.setViewportSize({width:320,height:700});await page.goto(topic);await expect(page.locator('#pixelEditor input')).toHaveCount(4);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
  await page.locator('#meanGuess').focus();await page.keyboard.type('120');await expect(page.locator('#meanGuess')).toHaveValue('120');
  await page.locator('.breadcrumb').getByRole('link',{name:'大学数学'}).click();await page.getByRole('link',{name:/Haar 基变换与图像系数截断/}).click();await expect(page).toHaveURL(/haar-basis-compression\.html$/);
  if(!process.env.KV_PUBLISHED_BASE_URL&&browserName==='chromium'){await page.goto(pathToFileURL(resolve(__dirname,'../../math/uni/haar-basis-compression.html')).href);await page.locator('#revealAnswer').click();await expect(page.locator('#answerGrid')).toContainText('c=[120, 60, 20, 0]');}
});
test('发布包子路径可加载并完成计算',async({page})=>{
  test.skip(Boolean(process.env.KV_PUBLISHED_BASE_URL),'仅本地发布包检查');const release=await startReleaseServer();
  try{await page.goto(new URL('math/uni/haar-basis-compression.html',release.base).href);await page.locator('#revealAnswer').click();await expect(page.locator('#answerGrid')).toContainText('x̂=Wĉ=[90, 90, 30, 30]');}finally{await release.close();}
});
