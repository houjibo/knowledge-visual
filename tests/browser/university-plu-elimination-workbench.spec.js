const {test,expect}=require('@playwright/test');
const {resolve}=require('node:path');
const {pathToFileURL}=require('node:url');
const {startReleaseServer}=require('./release-server');
const topic=process.env.KV_PUBLISHED_BASE_URL
  ?new URL('math/uni/plu-elimination.html',process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/,'/')).href
  :'/math/uni/plu-elimination.html';

async function predict(page,{pivot,m21,m31,det,augRank,classification,x1}){
  await page.locator('#pivotGuess').selectOption(pivot);
  if(m21!==undefined)await page.locator('#m21Guess').fill(m21);
  if(m31!==undefined)await page.locator('#m31Guess').fill(m31);
  await page.locator('#detGuess').fill(det);await page.locator('#augRankGuess').fill(augRank);await page.locator('#solutionGuess').selectOption(classification);
  if(x1!==undefined)await page.locator('#x1Guess').fill(x1);
}
test('首列行交换、前代回代与先错后改；揭示不记完成',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(topic);
  await page.locator('#revealAnswer').click();await expect(page.locator('#stepCards')).toContainText('主元来自 A 原第 2 行');
  await expect(page.locator('#answerCards')).toContainText('det(A)=det(P) × U₁₁U₂₂U₃₃=-12');
  await expect(page.locator('#answerCards')).toContainText('x=[-1/6, 3/4, 7/12]');
  await expect(page.locator('#answerCards')).toContainText('Ax=[1, -2, 3]=b');
  expect(await page.evaluate(()=>PageProgress.isDone('plu-elimination'))).toBe(false);
  await predict(page,{pivot:'2',m21:'1/2',m31:'-2/3',det:'-12',augRank:'3',classification:'unique',x1:'-1/6'});await page.locator('#checkPrediction').click();
  await expect(page.locator('#predictionFeedback')).toContainText('再核 m₂₁');await expect(page.locator('#answer')).toBeHidden();
  await page.locator('#m21Guess').fill('2/3');await page.locator('#checkPrediction').click();await expect(page.locator('#predictionFeedback')).toContainText('已完成预测');
  expect(await page.evaluate(()=>PageProgress.isDone('plu-elimination'))).toBe(true);expect(errors).toEqual([]);
});
test('两轮交换、平局、奇异与零首列；编辑清除反馈',async({page})=>{
  await page.goto(topic);await page.locator('#preset').selectOption('two-swaps');await page.locator('#revealAnswer').click();
  await expect(page.locator('#stepCards')).toContainText('同步交换 L 已有的左侧乘数');
  await expect(page.locator('#answerCards')).toContainText('L=[[1, 0, 0] ; [-1/3, 1, 0] ; [-1/3, 1/4, 1]]');
  await expect(page.locator('#answerCards')).toContainText('P 的行顺序：A 原第 2、3、1 行');
  await page.locator('#preset').selectOption('second-swap');await page.locator('#revealAnswer').click();await expect(page.locator('#answerCards')).toContainText('P 的行顺序：A 原第 1、3、2 行');
  await page.locator('#preset').selectOption('tie');await page.locator('#revealAnswer').click();await expect(page.locator('#stepCards')).toContainText('主元来自 A 原第 1 行');
  await page.locator('#preset').selectOption('singular');await page.locator('#revealAnswer').click();await expect(page.locator('#answerCards')).toContainText('Ax=b：无穷多解');await expect(page.locator('#answerCards')).toContainText('xₚ=[-2, 3, 0]');await expect(page.locator('#answerCards')).toContainText('n1=[0, -1, 1]');
  await page.locator('#b-1').fill('3');await expect(page.locator('#answer')).toBeHidden();await predict(page,{pivot:'2',m21:'1/2',m31:'0',det:'0',augRank:'2',classification:'infinite'});await page.locator('#checkPrediction').click();await expect(page.locator('#predictionFeedback')).toContainText('再核 增广秩');await expect(page.locator('#predictionFeedback')).toContainText('再核 解的类型');
  await page.locator('#augRankGuess').fill('3');await page.locator('#solutionGuess').selectOption('none');await page.locator('#checkPrediction').click();await expect(page.locator('#answerCards')).toContainText('0=1');await expect(page.locator('#answerCards')).toContainText('Ax=b：无解');expect(await page.evaluate(()=>PageProgress.isDone('plu-elimination'))).toBe(false);
  await page.locator('#preset').selectOption('inconsistent');await page.locator('#revealAnswer').click();await expect(page.locator('#answerCards')).toContainText('rank([A|b])=3');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
  await page.locator('#preset').selectOption('rank-one');await page.locator('#revealAnswer').click();await expect(page.locator('#answerCards')).toContainText('rank(A)=1');await expect(page.locator('#answerCards')).toContainText('自由列：x2、x3');await expect(page.locator('#answerCards')).toContainText('n2=[0, 0, 1]');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
  await page.locator('#preset').selectOption('zero-column');await predict(page,{pivot:'none',det:'0',augRank:'3',classification:'none'});await page.locator('#checkPrediction').click();await expect(page.locator('#stepCards')).toContainText('第 1 列：无主元');await expect(page.locator('#answerCards')).toContainText('rank(A)=2');expect(await page.evaluate(()=>PageProgress.isDone('plu-elimination'))).toBe(false);
  await page.locator('#preset').selectOption('zero');await page.locator('#revealAnswer').click();await expect(page.locator('#answerCards')).toContainText('rank(A)=0');await expect(page.locator('#answerCards')).toContainText('n3=[0, 0, 1]');
  await page.locator('#preset').selectOption('zero-inconsistent');await page.locator('#revealAnswer').click();await expect(page.locator('#answerCards')).toContainText('rank([A|b])=1');await expect(page.locator('#answerCards')).toContainText('0=1');
  await page.locator('#a-0-0').fill('4');await expect(page.locator('#inputStatus')).toContainText('输入无效');await expect(page.locator('#answer')).toBeHidden();await expect(page.locator('#a-0-0')).toHaveAttribute('aria-invalid','true');
  await page.locator('#a-0-0').fill('');await expect(page.locator('#inputStatus')).toContainText('空值不能当作 0');await page.locator('#a-0-0').fill('1');await expect(page.locator('#inputStatus')).toBeEmpty();
});
test('320px、键盘、目录与文件直开',async({page,browserName})=>{
  await page.setViewportSize({width:320,height:700});await page.goto(topic);await expect(page.locator('#matrixEditor input')).toHaveCount(9);
  await page.locator('#revealAnswer').click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
  await page.locator('#detGuess').focus();await page.keyboard.type('-12');await expect(page.locator('#detGuess')).toHaveValue('-12');
  await page.locator('.breadcrumb').getByRole('link',{name:'大学数学'}).click();await page.getByRole('link',{name:/消元与 PLU 分解/}).click();await expect(page).toHaveURL(/plu-elimination\.html$/);
  if(!process.env.KV_PUBLISHED_BASE_URL&&browserName==='chromium'){await page.goto(pathToFileURL(resolve(__dirname,'../../math/uni/plu-elimination.html')).href);await page.locator('#revealAnswer').click();await expect(page.locator('#answerCards')).toContainText('PA=');}
});
test('发布包子路径可加载并完成乘回',async({page})=>{
  test.skip(Boolean(process.env.KV_PUBLISHED_BASE_URL),'仅本地发布包检查');const release=await startReleaseServer();
  try{await page.goto(new URL('math/uni/plu-elimination.html',release.base).href);await page.locator('#revealAnswer').click();await expect(page.locator('#answerCards')).toContainText('Ax=[1, -2, 3]=b');}finally{await release.close();}
});
