const {test,expect}=require('@playwright/test');
const {resolve}=require('node:path');
const {pathToFileURL}=require('node:url');
const {startReleaseServer}=require('./release-server');
const topic=process.env.KV_PUBLISHED_BASE_URL
  ?new URL('math/uni/positive-definite.html',process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/,'/')).href
  :'/math/uni/positive-definite.html';

async function predict(page,symmetric,formClass,value){
  await page.locator('#symmetryGuess').selectOption(symmetric);
  await page.locator('#formGuess').selectOption(formClass);
  await page.locator('#valueGuess').fill(value);
}

test('揭示不记完成，预测对称性、符号与 q(v) 后才完成',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(topic);
  await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('q 的类别：严格正定');
  await expect(page.locator('#answerGrid')).toContainText('A 是对称正定矩阵');
  await expect(page.locator('#answerGrid')).toContainText('det(A)=3');
  await expect(page.locator('#answerGrid')).toContainText('q[1, -1] = 2');
  await expect(page.locator('#signCanvas')).toHaveAttribute('role','img');
  expect(await page.evaluate(()=>PageProgress.isDone('positive-definite'))).toBe(false);
  await predict(page,'yes','semipositive','2');
  await page.locator('#checkPrediction').click();
  await expect(page.locator('#predictionFeedback')).toContainText('再核 二次型符号类别');
  await expect(page.locator('#answer')).toBeHidden();
  await page.locator('#formGuess').selectOption('positive');
  await page.locator('#checkPrediction').click();
  await expect(page.locator('#predictionFeedback')).toContainText('已完成预测');
  expect(await page.evaluate(()=>PageProgress.isDone('positive-definite'))).toBe(true);
  expect(errors).toEqual([]);
});

test('六类二次型与非对称反例保留精确见证',async({page})=>{
  await page.goto(topic);
  await page.locator('#preset').selectOption('semipositive');await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('正半定（非零）');
  await expect(page.locator('#answerGrid')).toContainText('零方向：v=');
  await expect(page.locator('#verificationInfo')).toContainText('非零零方向说明只有半正定');
  await page.locator('#preset').selectOption('negative');await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('q 的类别：严格负定');
  await expect(page.locator('#answerGrid')).toContainText('det(A)=2');
  await expect(page.locator('#answerGrid')).toContainText('负方向：v=');
  await page.locator('#preset').selectOption('indefinite');await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('q 的类别：不定');
  await expect(page.locator('#answerGrid')).toContainText('正方向：v=');
  await expect(page.locator('#answerGrid')).toContainText('负方向：v=');
  await page.locator('#preset').selectOption('seminegative');await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('负半定（非零）');
  await expect(page.locator('#answerGrid')).toContainText('零方向：v=');
  await page.locator('#preset').selectOption('zero');await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('q 的类别：零型');
  await expect(page.locator('#answerGrid')).toContainText('零方向：v=');
  await page.locator('#preset').selectOption('asymmetric-positive');await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('A ≠ Aᵀ');
  await expect(page.locator('#answerGrid')).toContainText('q 的类别：严格正定');
  await expect(page.locator('#answerGrid')).toContainText('A 非对称，不称为本课的对称正定矩阵');
  await expect(page.locator('#answerGrid')).toContainText('4det(S) = 15');
  await page.locator('#preset').selectOption('asymmetric-semi');await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('q 的类别：正半定（非零）');
  await expect(page.locator('#answerGrid')).toContainText('S=(A+Aᵀ)/2 = [1, 1 ; 1, 1]');
});

test('编辑撤销旧结果，矩阵及向量边界，错误 q 输入',async({page})=>{
  await page.goto(topic);await page.locator('#revealAnswer').click();
  await page.locator('#a-0-0').fill('');
  await expect(page.locator('#a-0-0')).toHaveAttribute('aria-invalid','true');
  await expect(page.locator('#answer')).toBeHidden();
  await page.locator('#revealAnswer').click();await expect(page.locator('#answer')).toBeHidden();
  await page.locator('#a-0-0').fill('6');await expect(page.locator('#inputStatus')).toContainText('输入无效');
  await page.locator('#a-0-0').fill('2');
  await page.locator('#v-0').fill('4');await expect(page.locator('#v-0')).toHaveAttribute('aria-invalid','true');
  await page.locator('#v-0').fill('0');
  await page.locator('#v-1').fill('0');
  await predict(page,'yes','positive','0.0');await page.locator('#checkPrediction').click();
  await expect(page.locator('#predictionFeedback')).toContainText('再核 当前 q(v)');
  await page.locator('#valueGuess').fill('0');await page.locator('#checkPrediction').click();
  await expect(page.locator('#predictionFeedback')).toContainText('已完成预测');
  await expect(page.locator('#answerGrid')).toContainText('q[0, 0] = 0');
  await expect(page.locator('#answerGrid')).toContainText('A 是对称正定矩阵');
});

test('目录、320px、键盘、文件直开与发布子路径',async({page})=>{
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL,'本地文件与构建路径检查');
  await page.setViewportSize({width:320,height:700});
  await page.goto(pathToFileURL(resolve('math/uni/index.html')).href);
  await page.getByRole('link',{name:/正定性与二次型/}).click();
  await expect(page).toHaveURL(/positive-definite\.html$/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.locator('#revealAnswer').focus();await page.keyboard.press('Enter');
  await expect(page.locator('#answer')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const release=await startReleaseServer();
  try{
    await page.goto(new URL('math/uni/positive-definite.html',release.base).href);
    await page.locator('#preset').selectOption('semipositive');await page.locator('#revealAnswer').click();
    await expect(page.locator('#verificationInfo')).toContainText('非零零方向说明只有半正定');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  }finally{await release.close();}
});
