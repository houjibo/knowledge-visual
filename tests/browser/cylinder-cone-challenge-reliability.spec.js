const {test,expect}=require('@playwright/test');
const url='/math/topics/cylinder-cone/index.html';
async function answerCorrect(page) {await page.locator('.challenge-opt[data-correct="true"]').click();}

test('挑战答错保留正确答案，重复提交不计分',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;}); await page.goto(url); await page.locator('[data-mode="challenge"]').click();
  await expect(page.locator('.challenge-opt')).toHaveCount(4);
  expect(new Set(await page.locator('.challenge-opt').allTextContents()).size).toBe(4);
  const wrong=page.locator('.challenge-opt[data-correct="false"]').first(); await wrong.click();
  await expect(page.locator('#challenge-feedback')).toContainText('正确答案是 37.68 cm³');
  await expect(page.locator('#challenge-next')).toHaveText('重新开始');
  for(const btn of await page.locator('.challenge-opt').all()) await expect(btn).toBeDisabled();
  await wrong.dispatchEvent('click'); await expect(page.locator('#challenge-status')).toContainText('0 / 5');
  await page.locator('#challenge-next').click(); await expect(page.locator('#challenge-feedback')).toBeEmpty();
});

test('五关保存，十关显示完成并可重新开始',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;}); await page.goto(url); await page.locator('[data-mode="challenge"]').click();
  for(let i=1;i<=10;i++) {
    await answerCorrect(page);
    if(i===4) expect(await page.evaluate(()=>PageProgress.isDone('cylinder-cone'))).toBe(false);
    if(i===5) expect(await page.evaluate(()=>PageProgress.isDone('cylinder-cone'))).toBe(true);
    if(i<10) await page.locator('#challenge-next').click();
  }
  await expect(page.locator('#challenge-feedback')).toContainText('连续答对十题');
  await expect(page.locator('#challenge-progress .done')).toHaveCount(10);
  await page.locator('#challenge-next').click(); await expect(page.locator('#challenge-status')).toContainText('0 / 10');
  await page.reload(); await expect(page.locator('#challenge-status')).toContainText('本主题已完成');
});

test('保存失败后能重试并在地图显示',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;window.oldSet=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('denied');};});
  await page.goto(url); await page.locator('[data-mode="challenge"]').click();
  for(let i=0;i<5;i++){await answerCorrect(page); if(i<4) await page.locator('#challenge-next').click();}
  await expect(page.locator('#challenge-status')).toContainText('尚未保存');
  await page.evaluate(()=>{Storage.prototype.setItem=window.oldSet;}); await page.locator('#math-progress-save-notice button').click();
  await expect(page.locator('#challenge-status')).toContainText('本主题已完成');
  await page.goto('/math/index.html'); await expect(page.locator('a.topic-node[href="topics/cylinder-cone/index.html"] .progress-badge')).toHaveText('✓');
});

test('随机边界的圆锥选项与体积公式一致',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>.999999;}); await page.goto(url); await page.locator('[data-mode="challenge"]').click();
  await expect(page.locator('#challenge-text')).toContainText('圆锥的底面半径是 6 cm，高是 8 cm');
  await expect(page.locator('.challenge-opt[data-correct="true"]')).toHaveText('301.44 cm³');
  expect(new Set(await page.locator('.challenge-opt').allTextContents()).size).toBe(4);
});
