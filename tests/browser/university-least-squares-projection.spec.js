const {test,expect}=require('@playwright/test');
const {resolve}=require('node:path');
const {pathToFileURL}=require('node:url');
const {startReleaseServer}=require('./release-server');
const topic=process.env.KV_PUBLISHED_BASE_URL
  ?new URL('math/uni/least-squares.html',process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/,'/')).href
  :'/math/uni/least-squares.html';

async function fillPrediction(page,p,e) {
  for(let i=0;i<3;i++) {
    await page.locator(`#projectionGuess-${i}`).fill(p[i]);
    await page.locator(`#residualGuess-${i}`).fill(e[i]);
  }
}

test('先预测 p 与 e，揭示不记完成，候选误差精确比较',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(topic);
  await page.locator('#revealAnswer').click();
  await expect(page.locator('#answer')).toBeVisible();
  await expect(page.locator('#answerGrid')).toContainText('[7/6, 5/3, 13/6]');
  await expect(page.locator('#answerGrid')).toContainText('[-1/6, 1/3, -1/6]');
  await expect(page.locator('#verificationInfo')).toContainText('最小 ‖b−Ax‖² = 1/6');
  await expect(page.locator('#geometry svg')).toHaveAttribute('role','img');
  expect(await page.evaluate(()=>PageProgress.isDone('least-squares'))).toBe(false);
  await page.locator('#b-0').fill('0');
  await expect(page.locator('#answer')).toBeHidden();
  await page.locator('#b-0').fill('1');
  await page.locator('#memberGuess').selectOption('no');
  await page.locator('#uniqueGuess').selectOption('no');
  await fillPrediction(page,['7/6','5/3','13/6'],['-1/6','1/3','-1/6']);
  await page.locator('#checkPrediction').click();
  await expect(page.locator('#predictionFeedback')).toContainText('再核 系数唯一性');
  await expect(page.locator('#answer')).toBeHidden();
  await page.locator('#uniqueGuess').selectOption('yes');
  await page.locator('#checkPrediction').click();
  await expect(page.locator('#predictionFeedback')).toContainText('已完成预测');
  expect(await page.evaluate(()=>PageProgress.isDone('least-squares'))).toBe(true);
  await page.locator('#checkCandidate').click();
  await expect(page.locator('#candidateFeedback')).toContainText('还未达到最小值');
  await page.locator('#candidate-0').fill('7/6');
  await page.locator('#candidate-1').fill('1/2');
  await page.locator('#checkCandidate').click();
  await expect(page.locator('#candidateFeedback')).toContainText('比最小值多 0 = ‖p−Ax‖²');
  await expect(page.locator('#candidateFeedback')).toContainText('达到唯一的最小二乘系数');
  expect(errors).toEqual([]);
});

test('相关列、零矩阵、零残差和零投影分支正确',async({page})=>{
  await page.goto(topic);
  await page.locator('#preset').selectOption('dependent');
  await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('两列相关：AᵀA 不可逆；系数不唯一，但投影唯一');
  await expect(page.locator('#answerGrid')).toContainText('[-1/9, -2/9, 2/9]');
  await page.locator('#candidate-0').fill('-1/9');
  await page.locator('#candidate-1').fill('0');
  await page.locator('#checkCandidate').click();
  await expect(page.locator('#candidateFeedback')).toContainText('比最小值多 0');
  await page.locator('#candidate-0').fill('-19/9');
  await page.locator('#candidate-1').fill('1');
  await page.locator('#checkCandidate').click();
  await expect(page.locator('#candidateFeedback')).toContainText('比最小值多 0');
  await expect(page.locator('#candidateFeedback')).toContainText('系数可不同，投影仍相同');
  await page.locator('#preset').selectOption('zero');
  await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('零矩阵：AᵀA 不可逆，所有系数都得到同一零投影');
  await expect(page.locator('#answerGrid')).toContainText('‖e‖² = 14');
  await expect(page.locator('#geometry svg')).toContainText('p=0');
  await expect(page.locator('#geometry line[marker-end]')).toHaveCount(1);
  for(let i=0;i<3;i++) await page.locator(`#b-${i}`).fill('0');
  await page.locator('#revealAnswer').click();
  await expect(page.locator('#geometry svg')).toContainText('b=p=e=0');
  await expect(page.locator('#geometry line[marker-end]')).toHaveCount(0);
  await page.locator('#preset').selectOption('in-column');
  await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('e=0：b 已在 C(A) 中');
  await expect(page.locator('#geometry svg')).toContainText('e=0');
  await expect(page.locator('#geometry line[marker-end]')).toHaveCount(1);
  await page.locator('#preset').selectOption('orthogonal');
  await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('p=0：b 与 C(A) 正交');
  await expect(page.locator('#geometry line[marker-end]')).toHaveCount(1);
});

test('编辑与无效分数撤销旧结果，恢复后只取新输入',async({page})=>{
  await page.goto(topic);
  await page.locator('#revealAnswer').click();
  await page.locator('#a-0-0').fill('');
  await expect(page.locator('#a-0-0')).toHaveAttribute('aria-invalid','true');
  await expect(page.locator('#answer')).toBeHidden();
  await expect(page.locator('#inputStatus')).toContainText('输入无效');
  await page.locator('#revealAnswer').click();
  await expect(page.locator('#answer')).toBeHidden();
  await page.locator('#a-0-0').fill('6');
  await expect(page.locator('#inputStatus')).toContainText('输入无效');
  await page.locator('#a-0-0').fill('1');
  await page.locator('#b-2').fill('3');
  await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('e=0：b 已在 C(A) 中');
  await page.locator('#candidate-0').fill('1/0');
  await page.locator('#checkCandidate').click();
  await expect(page.locator('#candidateFeedback')).toContainText('系数输入无效');
});

test('大学目录、320px、键盘、文件直开和发布子路径可学习',async({page})=>{
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL,'本地文件与构建路径检查');
  await page.setViewportSize({width:320,height:700});
  await page.goto(pathToFileURL(resolve('math/uni/index.html')).href);
  await page.getByRole('link',{name:/投影与最小二乘/}).click();
  await expect(page).toHaveURL(/least-squares\.html$/);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.locator('#revealAnswer').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#answer')).toBeVisible();
  const release=await startReleaseServer();
  try {
    await page.goto(new URL('math/uni/least-squares.html',release.base).href);
    await page.locator('#preset').selectOption('zero');
    await page.locator('#revealAnswer').click();
    await expect(page.locator('#verificationInfo')).toContainText('最小 ‖b−Ax‖² = 14');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  } finally {await release.close();}
});
