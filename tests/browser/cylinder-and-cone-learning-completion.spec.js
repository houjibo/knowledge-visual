const {test,expect}=require('@playwright/test');
const url='/math/topics/cylinder-and-cone/index.html';
async function finish(page) {
  await page.getByRole('button',{name:'🔍 展开图'}).click(); await page.locator('#btn-cylinder-unfold').click(); await page.locator('#btn-cone-unfold').click();
  await page.getByRole('button',{name:'🧮 计算'}).click();
  for(let i=0;i<3;i++) { await page.locator('#calc-options button').getByText('12.56 cm²',{exact:true}).click(); if(i<2) await page.locator('#calc-next').click(); }
  await page.getByRole('button',{name:'🏆 挑战'}).click(); await page.locator('#challenge-start-area button').click();
  for(let i=0;i<10;i++) { await page.locator('#ch-options button').getByText('12.56 cm²',{exact:true}).click(); await page.locator('#ch-next').click(); }
}

test('三项活动达标后保存，刷新和知识目录保持记录',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;}); await page.goto(url);
  await expect(page.locator('#learningProgress')).toContainText('0/3');
  await page.getByRole('button',{name:'🔍 展开图'}).click(); await page.locator('#btn-cylinder-unfold').click(); await page.locator('#btn-cone-unfold').click();
  await expect(page.locator('#learningProgress')).toContainText('1/3'); await page.reload(); await expect(page.locator('#learningProgress')).toContainText('0/3');
  await finish(page); await expect(page.locator('#ch-final')).toContainText('10/10'); await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.reload(); await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.goto('/math/index.html'); await expect(page.locator('a.topic-card[href="topics/cylinder-and-cone/index.html"] .progress-badge')).toHaveText('✓');
});

test('计算与挑战保留反馈并防止重复计分',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;}); await page.goto(url); await page.getByRole('button',{name:'🧮 计算'}).click();
  const answer=page.locator('#calc-options button').getByText('12.56 cm²',{exact:true}); await answer.click(); await answer.dispatchEvent('click');
  await expect(page.locator('#calc-correct')).toHaveText('1'); await page.waitForTimeout(1600); await expect(page.locator('#calc-result')).toContainText('答对');
  await page.getByRole('button',{name:'🏆 挑战'}).click(); await page.locator('#challenge-start-area button').click();
  const wrong=page.locator('#ch-options button').filter({hasNotText:'12.56 cm²'}).first(); await wrong.click(); await wrong.dispatchEvent('click');
  await expect(page.locator('#ch-score')).toHaveText('0'); await expect(page.locator('#ch-options .correct')).toHaveText('12.56 cm²');
  await page.waitForTimeout(1600); await expect(page.locator('#ch-q-num')).toHaveText('1'); await page.locator('#ch-next').click(); await expect(page.locator('#ch-q-num')).toHaveText('2');
});

test('保存失败后恢复并重试',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;window.oldSet=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('denied');};});
  await page.goto(url); await finish(page); await expect(page.locator('#learningProgress')).toContainText('尚未保存');
  await page.evaluate(()=>{Storage.prototype.setItem=window.oldSet;}); await page.locator('#math-progress-save-notice button').click();
  await page.reload(); await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
});
