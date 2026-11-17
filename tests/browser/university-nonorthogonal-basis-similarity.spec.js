const {test,expect}=require('@playwright/test');
const {resolve}=require('node:path');
const {pathToFileURL}=require('node:url');
const {startReleaseServer}=require('./release-server');
const topic=process.env.KV_PUBLISHED_BASE_URL
  ?new URL('math/uni/change-of-basis.html',process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/,'/')).href
  :'/math/uni/change-of-basis.html';

async function predict(page,{det,basis,c0,c1,b00}){
  await page.locator('#detGuess').fill(det);await page.locator('#basisGuess').selectOption(basis);
  if(c0!==undefined){await page.locator('#c0Guess').fill(c0);await page.locator('#c1Guess').fill(c1);await page.locator('#b00Guess').fill(b00);}
}
test('斜基坐标、相似矩阵与乘回；揭示不记完成',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(topic);
  await page.locator('#revealAnswer').click();await expect(page.locator('#answerGrid')).toContainText('c=W⁻¹x=[1, 2]');
  await expect(page.locator('#answerGrid')).toContainText('B=W⁻¹AW=[[2, 0] ; [0, 3]]');
  await expect(page.locator('#answerGrid')).toContainText('W(Bc)=[8, 6]；Ax=[8, 6]');
  expect(await page.evaluate(()=>PageProgress.isDone('change-of-basis'))).toBe(false);
  await predict(page,{det:'1',basis:'yes',c0:'1',c1:'2',b00:'3'});await page.locator('#checkPrediction').click();
  await expect(page.locator('#predictionFeedback')).toContainText('再核 矩阵元 B₁₁');await expect(page.locator('#answer')).toBeHidden();
  await page.locator('#b00Guess').fill('2');await page.locator('#checkPrediction').click();await expect(page.locator('#predictionFeedback')).toContainText('已完成预测');
  expect(await page.evaluate(()=>PageProgress.isDone('change-of-basis'))).toBe(true);expect(errors).toEqual([]);
});
test('分数、负行列式、相关列、列空间与无效输入',async({page})=>{
  await page.goto(topic);await page.locator('#preset').selectOption('fraction');await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('c=W⁻¹x=[-1/4, 3/2]');await expect(page.locator('#answerGrid')).toContainText('B=W⁻¹AW=[[1, 1/2] ; [0, 2]]');
  await page.locator('#preset').selectOption('orientation');await page.locator('#revealAnswer').click();await expect(page.locator('#answerGrid')).toContainText('det(W)=-1');await expect(page.locator('#answerGrid')).toContainText('B=W⁻¹AW=[[0, 1] ; [-1, 0]]');
  await page.locator('#preset').selectOption('singular');await expect(page.locator('#coordinateGuess')).toBeHidden();await predict(page,{det:'0',basis:'no'});await page.locator('#checkPrediction').click();await expect(page.locator('#answerGrid')).toContainText('坐标不唯一');expect(await page.evaluate(()=>PageProgress.isDone('change-of-basis'))).toBe(false);
  await page.locator('#preset').selectOption('outside');await page.locator('#revealAnswer').click();await expect(page.locator('#answerGrid')).toContainText('无法用这两列表示 x');
  await page.locator('#preset').selectOption('zero');await page.locator('#revealAnswer').click();await expect(page.locator('#answerGrid')).toContainText('rank(W)=0');
  await page.locator('#w-0-0').fill('4');await expect(page.locator('#inputStatus')).toContainText('输入无效');await expect(page.locator('#answer')).toBeHidden();await expect(page.locator('#w-0-0')).toHaveAttribute('aria-invalid','true');
  await page.locator('#w-0-0').fill('');await expect(page.locator('#inputStatus')).toContainText('空值不能当作 0');await page.locator('#w-0-0').fill('1');await expect(page.locator('#inputStatus')).toBeEmpty();
});
test('320px、键盘、目录与文件直开',async({page,browserName})=>{
  await page.setViewportSize({width:320,height:700});await page.goto(topic);await expect(page.locator('#basisEditor input')).toHaveCount(4);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
  await page.locator('#detGuess').focus();await page.keyboard.type('1');await expect(page.locator('#detGuess')).toHaveValue('1');
  await page.locator('.breadcrumb').getByRole('link',{name:'大学数学'}).click();await page.getByRole('link',{name:/非正交基的坐标与相似变换/}).click();await expect(page).toHaveURL(/change-of-basis\.html$/);
  if(!process.env.KV_PUBLISHED_BASE_URL&&browserName==='chromium'){await page.goto(pathToFileURL(resolve(__dirname,'../../math/uni/change-of-basis.html')).href);await page.locator('#revealAnswer').click();await expect(page.locator('#answerGrid')).toContainText('B=W⁻¹AW');}
});
test('发布包子路径可加载并乘回',async({page})=>{
  test.skip(Boolean(process.env.KV_PUBLISHED_BASE_URL),'仅本地发布包检查');const release=await startReleaseServer();
  try{await page.goto(new URL('math/uni/change-of-basis.html',release.base).href);await page.locator('#revealAnswer').click();await expect(page.locator('#answerGrid')).toContainText('W(Bc)=[8, 6]');}finally{await release.close();}
});
