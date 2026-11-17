const {test,expect}=require('@playwright/test');
const {resolve}=require('node:path');
const {pathToFileURL}=require('node:url');
const {startReleaseServer}=require('./release-server');
const topic=process.env.KV_PUBLISHED_BASE_URL
  ?new URL('math/uni/symmetric-spectral.html',process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/,'/')).href
  :'/math/uni/symmetric-spectral.html';

async function predict(page,{trace,pattern,eigen,image}){
  await page.locator('#traceGuess').fill(trace);
  await page.locator('#patternGuess').selectOption(pattern);
  await page.locator('#eigenGuess').selectOption(eigen);
  for(let i=0;i<2;i++)await page.locator(`#image-${i}`).fill(image[i]);
}

test('先预测再核对；揭示不记完成；正交谱乘回',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(topic);await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('λ₁=3；λ₂=1');
  await expect(page.locator('#answerGrid')).toContainText('v1=P1v = [1, 1]');
  await expect(page.locator('#answerGrid')).toContainText('v2=P2v = [0, 0]');
  await expect(page.locator('#answerGrid')).toContainText('Av=[3, 3]');
  await expect(page.locator('#verificationInfo')).toContainText('A=QΛQᵀ');
  await expect(page.locator('#spectralCanvas')).toHaveAttribute('role','img');
  expect(await page.evaluate(()=>PageProgress.isDone('symmetric-spectral'))).toBe(false);
  await predict(page,{trace:'4',pattern:'distinct',eigen:'no',image:['3','3']});
  await page.locator('#checkPrediction').click();
  await expect(page.locator('#predictionFeedback')).toContainText('再核 v 是否为特征向量');
  await expect(page.locator('#answer')).toBeHidden();
  await page.locator('#eigenGuess').selectOption('yes');await page.locator('#checkPrediction').click();
  await expect(page.locator('#predictionFeedback')).toContainText('已完成预测');
  expect(await page.evaluate(()=>PageProgress.isDone('symmetric-spectral'))).toBe(true);
  expect(errors).toEqual([]);
});

test('无理根、对角、异号、标量重根和零向量分支',async({page})=>{
  await page.goto(topic);
  await page.locator('#preset').selectOption('irrational');await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('Δ=(a−d)²+4b²=5');
  await expect(page.locator('#answerGrid')).toContainText('√5');
  await expect(page.locator('#answerGrid')).toContainText('v 不是特征向量');
  await page.locator('#preset').selectOption('diagonal');await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('λ₁=3；λ₂=1');
  await expect(page.locator('#answerGrid')).toContainText('q1 = [1, 0] / √(1)');
  await page.locator('#preset').selectOption('mixed');await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('√20');
  await page.locator('#preset').selectOption('scalar');await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('重复特征值：A 是标量矩阵');
  await expect(page.locator('#answerGrid')).toContainText('正交特征基并不唯一');
  await expect(page.locator('#plotExplanation')).toContainText('任意非零 v 都是特征向量');
  await page.locator('#preset').selectOption('zero');await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('v=0 不是特征向量');
  await expect(page.locator('#plotExplanation')).toContainText('零向量不是特征向量');
  await expect(page.locator('#spectralCanvas')).toHaveAttribute('aria-label',/零向量没有箭头/);
});

test('编辑撤销结果、对称联动和输入边界',async({page})=>{
  await page.goto(topic);await page.locator('#revealAnswer').click();
  await page.locator('#a-0-1').fill('3');
  await expect(page.locator('#a-1-0')).toHaveText('3');
  await expect(page.locator('#answer')).toBeHidden();
  await page.locator('#a-0-0').fill('');await expect(page.locator('#a-0-0')).toHaveAttribute('aria-invalid','true');
  await page.locator('#revealAnswer').click();await expect(page.locator('#answer')).toBeHidden();
  await page.locator('#a-0-0').fill('6');await expect(page.locator('#inputStatus')).toContainText('输入无效');
  await page.locator('#a-0-0').fill('2');
  await page.locator('#v-0').fill('4');await expect(page.locator('#v-0')).toHaveAttribute('aria-invalid','true');
  await page.locator('#preset').selectOption('zero');
  await predict(page,{trace:'0',pattern:'repeated',eigen:'no',image:['0','0']});
  await page.locator('#checkPrediction').click();
  await expect(page.locator('#predictionFeedback')).toContainText('已完成预测');
});

test('目录、320px、键盘、文件直开与发布子路径',async({page})=>{
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL,'本地文件与构建路径检查');
  await page.setViewportSize({width:320,height:700});
  await page.goto(pathToFileURL(resolve('math/uni/index.html')).href);
  await page.getByRole('link',{name:/实对称矩阵的谱分解/}).click();
  await expect(page).toHaveURL(/symmetric-spectral\.html$/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.locator('#revealAnswer').focus();await page.keyboard.press('Enter');
  await expect(page.locator('#answer')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const release=await startReleaseServer();
  try{
    await page.goto(new URL('math/uni/symmetric-spectral.html',release.base).href);
    await page.locator('#preset').selectOption('irrational');await page.locator('#revealAnswer').click();
    await expect(page.locator('#verificationInfo')).toContainText('A=QΛQᵀ');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  }finally{await release.close();}
});
