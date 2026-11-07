const {test,expect}=require('@playwright/test');
const url='/math/topics/volume/index.html';
const answers=[3000,5,2000,4000,8,1500,2.5,800,6,3.5,4000000,7200];

test('换算题精确判分且只能提交一次，反馈留到主动换题',async ({page})=>{
  await page.goto(url); await page.locator('[data-mode="convert"]').click();
  await page.locator('#convert-check').click(); await expect(page.locator('#convert-score')).toHaveText('✅ 0 / 0');
  await page.getByLabel('换算答案').fill('3000'); await page.getByLabel('换算答案').press('Enter'); await page.getByLabel('换算答案').press('Enter');
  await expect(page.locator('#convert-score')).toHaveText('✅ 1 / 1'); await expect(page.locator('#convert-check')).toBeDisabled();
  await page.waitForTimeout(1400); await expect(page.locator('#convert-question')).toContainText('3 dm³');
  for (const answer of answers.slice(1)) { await page.locator('#convert-next').click(); await page.getByLabel('换算答案').fill(String(answer)); await page.locator('#convert-check').click(); await expect(page.locator('#convert-feedback')).toContainText('正确'); }
  await expect(page.locator('#convert-score')).toHaveText('✅ 12 / 12');
});

test('挑战题选项和条件明确，十五题可完成',async ({page})=>{
  await page.goto(url); await page.locator('[data-mode="challenge"]').click();
  const answerIndices=[0,2,2,1,1,2,2,1,1,2,2,2,0,0,1];
  for(let i=0;i<answerIndices.length;i++) {
    if(i===12) await expect(page.locator('#challenge-options button')).toHaveText(['400 cm³','40 mL','400 cm²','40 cm³']);
    if(i===14) await expect(page.locator('#challenge-question')).toContainText('平均切成');
    const buttons=page.locator('#challenge-options button'); await buttons.nth(answerIndices[i]).click();
    await expect(page.locator('#challenge-feedback')).toContainText('答对');
    for(const btn of await buttons.all()) await expect(btn).toBeDisabled();
    if(i<14) await page.locator('#challenge-next').click();
  }
  await expect(page.locator('#challenge-streak')).toContainText('15');
});

test('进度保存失败时提示并可重试',async ({page})=>{
  await page.addInitScript(()=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('denied');};});
  await page.goto(url); await page.locator('[data-mode="convert"]').click();
  for(let i=0;i<8;i++) { await page.getByLabel('换算答案').fill(String(answers[i])); await page.locator('#convert-check').click(); if(i<7) await page.locator('#convert-next').click(); }
  await expect(page.locator('#learningProgress')).toContainText('尚未保存');
  await page.evaluate(()=>{Storage.prototype.setItem=window.originalSet;}); await page.locator('#math-progress-save-notice button').click();
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成'); await page.reload();
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
});
