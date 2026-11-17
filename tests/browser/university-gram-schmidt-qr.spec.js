const {test,expect}=require('@playwright/test');
const {resolve}=require('node:path');
const {pathToFileURL}=require('node:url');
const {startReleaseServer}=require('./release-server');
const topic=process.env.KV_PUBLISHED_BASE_URL
  ?new URL('math/uni/gram-schmidt-qr.html',process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/,'/')).href
  :'/math/uni/gram-schmidt-qr.html';

async function predict(page,{coefficient,rank,direction,residual}) {
  await page.locator('#coefficientGuess').fill(coefficient);
  await page.locator('#rankGuess').selectOption(String(rank));
  await page.locator('#directionGuess').selectOption(direction);
  for(let i=0;i<3;i++)await page.locator(`#residual-${i}`).fill(residual[i]);
}

test('先预测再核对；揭示不记完成；精确 QR 乘回',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(topic);
  await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('u₂ = a₂−p = [0, -1, 1]');
  await expect(page.locator('#answerGrid')).toContainText('q1 = [1, 1, 1] / √(3)');
  await expect(page.locator('#answerGrid')).toContainText('R 第 1 行 = [√(3), √(3)]');
  await expect(page.locator('#answerGrid')).toContainText('QR = [1, 1 ; 1, 0 ; 1, 2]');
  await expect(page.locator('#geometry svg')).toHaveAttribute('role','img');
  expect(await page.evaluate(()=>PageProgress.isDone('gram-schmidt-qr'))).toBe(false);
  await predict(page,{coefficient:'1',rank:1,direction:'yes',residual:['0','-1','1']});
  await page.locator('#checkPrediction').click();
  await expect(page.locator('#predictionFeedback')).toContainText('再核 秩');
  await expect(page.locator('#answer')).toBeHidden();
  await page.locator('#rankGuess').selectOption('2');
  await page.locator('#checkPrediction').click();
  await expect(page.locator('#predictionFeedback')).toContainText('已完成预测');
  expect(await page.evaluate(()=>PageProgress.isDone('gram-schmidt-qr'))).toBe(true);
  expect(errors).toEqual([]);
});

test('相关、首列零、次列零、零矩阵和分数投影',async({page})=>{
  await page.goto(topic);
  await page.locator('#preset').selectOption('dependent');
  await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('rank(A) = 1；Q 为 3×1');
  await expect(page.locator('#answerGrid')).toContainText('u₂ = a₂−p = [0, 0, 0]');
  await expect(page.locator('#geometry line[marker-end]')).toHaveCount(1);
  await page.locator('#preset').selectOption('first-zero');
  await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('q1 = [1, 2, 3] / √(14) （来自 a2）');
  await expect(page.locator('#answerGrid')).toContainText('QR = [0, 1 ; 0, 2 ; 0, 3]');
  await expect(page.locator('#geometry line[marker-end]')).toHaveCount(1);
  await page.locator('#preset').selectOption('second-zero');
  await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('QR = [1, 0 ; 2, 0 ; 3, 0]');
  await expect(page.locator('#geometry line[marker-end]')).toHaveCount(0);
  await page.locator('#preset').selectOption('zero');
  await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('Q 没有列；零向量不能归一化');
  await expect(page.locator('#answerGrid')).toContainText('QR = [0, 0 ; 0, 0 ; 0, 0]');
  await expect(page.locator('#geometry line[marker-end]')).toHaveCount(0);
  await page.locator('#preset').selectOption('fractional');
  await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('c = 1/2');
  await expect(page.locator('#answerGrid')).toContainText('u₂ = a₂−p = [0, 1, 0]');
  await expect(page.locator('#answerGrid')).toContainText('QR = [2, 1 ; 0, 1 ; 0, 0]');
});

test('编辑撤销旧结果，输入约束与分数原始边界',async({page})=>{
  await page.goto(topic);
  await page.locator('#revealAnswer').click();
  await page.locator('#a-0-0').fill('');
  await expect(page.locator('#a-0-0')).toHaveAttribute('aria-invalid','true');
  await expect(page.locator('#answer')).toBeHidden();
  await page.locator('#revealAnswer').click();
  await expect(page.locator('#answer')).toBeHidden();
  await page.locator('#a-0-0').fill('6');
  await expect(page.locator('#inputStatus')).toContainText('输入无效');
  await page.locator('#a-0-0').fill('1');
  await page.locator('#preset').selectOption('fractional');
  await predict(page,{coefficient:'2000000/4000000',rank:2,direction:'yes',residual:['0','1','0']});
  await page.locator('#checkPrediction').click();
  await expect(page.locator('#predictionFeedback')).toContainText('再核 投影系数 c');
  await page.locator('#coefficientGuess').fill('1/2');
  await page.locator('#checkPrediction').click();
  await expect(page.locator('#predictionFeedback')).toContainText('已完成预测');
});

test('目录、320px、键盘、文件直开和发布子路径',async({page})=>{
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL,'本地文件与构建路径检查');
  await page.setViewportSize({width:320,height:700});
  await page.goto(pathToFileURL(resolve('math/uni/index.html')).href);
  await page.getByRole('link',{name:/Gram–Schmidt 与 QR/}).click();
  await expect(page).toHaveURL(/gram-schmidt-qr\.html$/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.locator('#revealAnswer').focus();await page.keyboard.press('Enter');
  await expect(page.locator('#answer')).toBeVisible();
  const release=await startReleaseServer();
  try {
    await page.goto(new URL('math/uni/gram-schmidt-qr.html',release.base).href);
    await page.locator('#preset').selectOption('first-zero');
    await page.locator('#revealAnswer').click();
    await expect(page.locator('#verificationInfo')).toContainText('QR=A');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  } finally {await release.close();}
});
