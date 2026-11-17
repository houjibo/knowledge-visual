const {test,expect}=require('@playwright/test');
const {resolve}=require('node:path');
const {pathToFileURL}=require('node:url');
const {startReleaseServer}=require('./release-server');
const topic=process.env.KV_PUBLISHED_BASE_URL
  ?new URL('math/uni/svd.html',process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/,'/')).href
  :'/math/uni/svd.html';

async function predict(page,{trace,rank,zero,image}){
  await page.locator('#traceGuess').fill(trace);await page.locator('#rankGuess').fill(rank);await page.locator('#zeroGuess').selectOption(zero);
  for(let i=0;i<3;i++)await page.locator(`#image-${i}`).fill(image[i]);
}
test('先预测再核对；查看示范不记完成；矩形乘回',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(topic);
  await page.locator('#revealAnswer').click();await expect(page.locator('#answerGrid')).toContainText('AᵀA=[[4, 0] ; [0, 1]]');
  await expect(page.locator('#answerGrid')).toContainText('UᵣΣᵣVᵣᵀ≈[[2, 0] ; [0, 1] ; [0, 0]]');
  expect(await page.evaluate(()=>PageProgress.isDone('svd'))).toBe(false);
  await predict(page,{trace:'5',rank:'1',zero:'no',image:['2','1','0']});await page.locator('#checkPrediction').click();
  await expect(page.locator('#predictionFeedback')).toContainText('再核 秩');await expect(page.locator('#answer')).toBeHidden();
  await page.locator('#rankGuess').fill('2');await page.locator('#checkPrediction').click();
  await expect(page.locator('#predictionFeedback')).toContainText('已完成预测');expect(await page.evaluate(()=>PageProgress.isDone('svd'))).toBe(true);expect(errors).toEqual([]);
});
test('秩亏、重复奇异值、零矩阵与编辑重置',async({page})=>{
  await page.goto(topic);await page.locator('#preset').selectOption('rank1');await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('rank=1');await expect(page.locator('#answerGrid')).toContainText('零空间基');await expect(page.locator('#plotExplanation')).toContainText('线段');
  await page.locator('#preset').selectOption('repeated');await page.locator('#revealAnswer').click();await expect(page.locator('#answerGrid')).toContainText('Δ=0');await expect(page.locator('#answerGrid')).toContainText('rank=2');
  await page.locator('#preset').selectOption('zero');await page.locator('#revealAnswer').click();await expect(page.locator('#answerGrid')).toContainText('rank=0');await expect(page.locator('#answerGrid')).toContainText('没有非零奇异方向');await expect(page.locator('#plotExplanation')).toContainText('一点');
  await page.locator('#a-0-0').fill('4');await expect(page.locator('#inputStatus')).toContainText('输入无效');await expect(page.locator('#answer')).toBeHidden();await expect(page.locator('#a-0-0')).toHaveAttribute('aria-invalid','true');
  await page.locator('#a-0-0').fill('1');await expect(page.locator('#inputStatus')).toBeEmpty();await expect(page.locator('#preset')).toHaveValue('custom');
});
test('320px、键盘、目录导航和文件直开',async({page,browserName})=>{
  await page.setViewportSize({width:320,height:700});await page.goto(topic);await expect(page.locator('#matrixEditor input')).toHaveCount(6);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
  await page.locator('#traceGuess').focus();await page.keyboard.type('5');await expect(page.locator('#traceGuess')).toHaveValue('5');
  await page.locator('.breadcrumb').getByRole('link',{name:'大学数学'}).click();await page.getByRole('link',{name:/矩形矩阵的奇异值分解/}).click();await expect(page).toHaveURL(/svd\.html$/);
  if(!process.env.KV_PUBLISHED_BASE_URL&&browserName==='chromium'){
    await page.goto(pathToFileURL(resolve(__dirname,'../../math/uni/svd.html')).href);await page.locator('#revealAnswer').click();await expect(page.locator('#answerGrid')).toContainText('rank=2');
  }
});
test('发布包子路径加载与预测',async({page})=>{
  test.skip(Boolean(process.env.KV_PUBLISHED_BASE_URL),'仅本地发布包构建检查');
  const release=await startReleaseServer();try{await page.goto(new URL('math/uni/svd.html',release.base).href);await page.locator('#revealAnswer').click();await expect(page.locator('#answerGrid')).toContainText('rank=2');}finally{await release.close();}
});
