const {test,expect}=require('@playwright/test');
const url='/math/topics/decimal-multiplication-division/';

async function finish(page) {
  await page.locator('[data-mode="multiply"].mode-tab').click();
  await page.getByLabel('乘法答案').fill('0.20');
  await page.locator('#mul-submit').click(); await page.locator('#mul-submit').click();
  await expect(page.locator('#mul-correct')).toHaveText('1');
  await expect(page.locator('#mul-next')).toBeVisible();
  await page.locator('[data-mode="divide"].mode-tab').click();
  await page.getByLabel('除法答案').fill('0.10');
  await page.locator('#div-submit').click(); await page.locator('#div-submit').click();
  await expect(page.locator('#div-correct')).toHaveText('1');
  await page.locator('[data-mode="challenge"].mode-tab').click();
  await page.locator('#btn-start-challenge').click();
  const opts=page.locator('#ch-options button'); await expect(opts).toHaveCount(4);
  expect(new Set(await opts.allTextContents()).size).toBe(4);
  const answer=opts.getByText('0.1',{exact:true});
  await answer.click(); await answer.dispatchEvent('click');
  await expect(page.locator('#ch-score')).toHaveText('1');
}

test('示例运算符与生成题计算一致',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;});await page.goto(url);
  const ex=page.locator('#example-display');
  for(let i=0;i<3;i++) await ex.click();
  await expect(ex).toContainText('÷'); await expect(page.locator('#calc-demo')).toContainText('÷');
  const failures=await page.evaluate(()=>{
    const errors=[];
    for(let type=0;type<4;type++) for(const sample of [0,.999999]) {
      let count=0;Math.random=()=>count++===0?(type+.1)/4:sample;
      const m=genMulProblem();
      if(Math.abs(m.a*m.b-m.answer)>1e-8) errors.push(['mul',type,sample,m]);
      count=0;Math.random=()=>count++===0?(type+.1)/4:sample;
      const d=genDivProblem();
      if(Math.abs(d.a/d.b-d.answer)>1e-8) errors.push(['div',type,sample,d]);
    }
    return errors;
  });
  expect(failures).toEqual([]);
});

test('三类活动达标并在存储失败后恢复',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;window.oldSet=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('denied');};});
  await page.goto(url,{timeout:10000}); await finish(page);
  await expect(page.locator('#learningProgress')).toContainText('尚未保存');
  await page.evaluate(()=>{Storage.prototype.setItem=window.oldSet;});
  await page.locator('#math-progress-save-notice button').click();
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.reload(); await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
});

test('挑战离开模式及隐藏页面时暂停',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;});await page.clock.install();await page.goto(url);await page.clock.pauseAt(Date.now()+1000);
  await page.locator('[data-mode="challenge"].mode-tab').click();await page.locator('#btn-start-challenge').click();
  await page.clock.runFor(3000);await expect(page.locator('#timer')).toContainText('57');
  await page.locator('[data-mode="divide"].mode-tab').click();await page.clock.runFor(10000);
  await expect(page.locator('#timer')).toContainText('57');
  await page.locator('[data-mode="challenge"].mode-tab').click();
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await page.clock.runFor(3000);await expect(page.locator('#timer')).toContainText('57');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
  await page.clock.runFor(2000);await expect(page.locator('#timer')).toContainText('55');
});
