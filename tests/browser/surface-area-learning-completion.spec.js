const {test, expect}=require('@playwright/test');
const url='/math/topics/surface-area/index.html';
async function finish(page) {
  await page.locator('[data-mode="unfold"]').click(); await page.locator('#unfoldBtn').click();
  await page.locator('[data-mode="practice"]').click();
  for (let i=0;i<3;i++) {
    await page.getByLabel('表面积答案').fill('32'); await page.locator('#submitBtn').click();
    if (i<2) await page.locator('#practiceNext').click();
  }
  await page.locator('[data-mode="challenge"]').click();
  for (const answer of ['600 cm²','1300 cm²','74 m²']) {
    await page.locator('#challengeOptions button').getByText(answer,{exact:true}).click(); await page.locator('#nextBtn').click();
  }
}

test('计算题只计分一次，输入精确且主动换题', async ({page}) => {
  await page.addInitScript(()=>{Math.random=()=>0;}); await page.goto(url);
  await page.locator('[data-mode="practice"]').click();
  const input=page.getByLabel('表面积答案');
  await input.fill('32.5'); await page.locator('#submitBtn').click(); await expect(page.locator('#feedback')).toContainText('整数');
  await input.fill('32'); await page.locator('#submitBtn').click(); await input.press('Enter');
  await expect(page.locator('#correctCount')).toHaveText('1'); await expect(page.locator('#submitBtn')).toBeDisabled();
  await page.waitForTimeout(1700); await expect(input).toHaveValue('32');
  await page.locator('#practiceNext').click(); await input.fill('31'); await page.locator('#submitBtn').click();
  await expect(page.locator('#wrongCount')).toHaveText('1'); await expect(page.locator('#feedback')).toContainText('32 cm²');
});

test('三类活动达标后记录进度并在地图显示', async ({page}) => {
  await page.addInitScript(()=>{Math.random=()=>0;}); await page.goto(url);
  await expect(page.locator('#learningProgress')).toContainText('0/3');
  await page.locator('[data-mode="unfold"]').click(); await page.locator('#unfoldBtn').click();
  await expect(page.locator('#learningProgress')).toContainText('1/3'); await page.reload();
  await expect(page.locator('#learningProgress')).toContainText('0/3');
  await finish(page); await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.reload(); await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.goto('/math/index.html'); await expect(page.locator('a.topic-node[href="topics/surface-area/index.html"] .progress-badge')).toHaveText('✓');
});

test('重复同一应用题不满足不同题目要求，存储失败可重试', async ({page}) => {
  await page.addInitScript(()=>{Math.random=()=>0; window.oldSet=Storage.prototype.setItem; Storage.prototype.setItem=()=>{throw Error('denied');};});
  await page.goto(url); await page.locator('[data-mode="unfold"]').click(); await page.locator('#unfoldBtn').click();
  await page.locator('[data-mode="practice"]').click();
  for(let i=0;i<3;i++){await page.getByLabel('表面积答案').fill('32'); await page.locator('#submitBtn').click(); if(i<2) await page.locator('#practiceNext').click();}
  await page.locator('[data-mode="challenge"]').click();
  for(let i=0;i<2;i++) {
    await page.evaluate(()=>{ currentChallenge=0; loadChallenge(); });
    await page.locator('#challengeOptions button').getByText('600 cm²',{exact:true}).click();
  }
  await expect(page.locator('#learningProgress')).toContainText('2/3');
  await page.locator('#nextBtn').click(); await page.locator('#challengeOptions button').getByText('1300 cm²',{exact:true}).click();
  await page.locator('#nextBtn').click(); await page.locator('#challengeOptions button').getByText('74 m²',{exact:true}).click();
  await expect(page.locator('#learningProgress')).toContainText('尚未保存');
  await page.evaluate(()=>{Storage.prototype.setItem=window.oldSet;}); await page.locator('#math-progress-save-notice button').click();
  await page.reload(); await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
});
