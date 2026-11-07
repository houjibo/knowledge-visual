const {test,expect}=require('@playwright/test');
const url='/math/topics/volume-units/index.html';

test('换算精确判分，每题只计算一次',async ({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;}); await page.goto(url); await page.locator('[data-mode="convert"]').click();
  const input=page.getByLabel('换算答案');
  await input.fill('3000.001'); await page.locator('#btnConvertCheck').click(); await expect(page.locator('#convertWrong')).toHaveText('1');
  await page.locator('#btnNextConvert').click(); await input.fill('3000'); await page.locator('#btnConvertCheck').click();
  await page.locator('#btnConvertCheck').dispatchEvent('click'); await expect(page.locator('#convertCorrect')).toHaveText('1');
});

test('限时挑战一题只能计分一次且只推进一次',async ({page})=>{
  await page.goto(url); await page.locator('[data-mode="challenge"]').click(); await page.locator('#btnStartCh').click();
  const correct=page.locator('#chOptions button').nth(1); await correct.click(); await correct.dispatchEvent('click');
  await expect(page.locator('#chScore')).toHaveText('10');
  for(const btn of await page.locator('#chOptions button').all()) await expect(btn).toBeDisabled();
  await expect(page.locator('#chProblem')).toContainText('1 立方米等于多少升', {timeout:3000});
  await expect(page.locator('#chScore')).toHaveText('10');
});

test('估测总数一致，结束后不会跳到超出题数',async ({page})=>{
  await page.goto(url); await page.locator('[data-mode="estimate"]').click();
  const total=Number(await page.locator('#estTotal').textContent()); expect(total).toBe(10);
  for(let i=0;i<total;i++) { await page.locator('#estOptions button').first().click(); await page.locator('#btnNextEst').click(); }
  await expect(page.locator('#estName')).toHaveText('估测结束！'); await expect(page.locator('#btnNextEst')).toBeHidden();
  await expect(page.locator('#estRound')).toHaveText(String(total));
});

test('完成记录保存失败后继续学习并可重试',async ({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;window.oldSet=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('denied');};});
  await page.goto(url); await page.locator('[data-mode="convert"]').click();
  for(let i=0;i<8;i++){ await page.getByLabel('换算答案').fill('3000'); await page.locator('#btnConvertCheck').click(); if(i<7) await page.locator('#btnNextConvert').click(); }
  await expect(page.locator('#learningProgress')).toContainText('尚未保存');
  await page.evaluate(()=>{Storage.prototype.setItem=window.oldSet;}); await page.locator('#math-progress-save-notice button').click();
  await page.reload(); await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
});
