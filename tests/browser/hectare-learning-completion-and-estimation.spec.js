const {test,expect}=require('@playwright/test');
const url='/math/topics/hectares-and-square-kilometers/';
async function finish(page) {
  await page.locator('[data-mode="convert"].mode-tab').click();
  const convert=page.locator('#convertOptions button[data-value="10000"]');
  await convert.click(); await convert.dispatchEvent('click');
  await expect(page.locator('#convertScore')).toContainText('1 / 1');
  await page.locator('[data-mode="apply"].mode-tab').click();
  const correct=await page.evaluate(()=>currentApply.options[currentApply.answer]);
  const apply=page.locator('#applyOptions button').getByText(correct,{exact:true});
  await apply.click(); await apply.dispatchEvent('click');
  await expect(page.locator('#applyScore')).toContainText('1 / 1');
  await page.locator('[data-mode="estimate"].mode-tab').click();
  await page.getByLabel('估计面积').fill('0.7');
  await page.locator('#estimateSubmit').click();
  await page.locator('#estimateSubmit').dispatchEvent('click');
  await expect(page.locator('#estimateScore')).toContainText('1 / 1');
}

test('三项完成后记录并在目录显示',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;}); await page.goto(url);
  await expect(page.locator('#learningProgress')).toContainText('0/3');
  await finish(page);
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.reload(); await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.goto('/math/index.html');
  await expect(page.locator('a[href="topics/hectares-and-square-kilometers/index.html"] .progress-badge').first()).toHaveText('✓');
});

test('估测显示参考范围、两位小数并锁定单题',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;}); await page.goto(url);
  await page.locator('[data-mode="estimate"].mode-tab').click();
  await expect(page.locator('[data-mode="estimate"].mode-content')).toContainText('虚构场地的参考面积');
  const dimensionsAgree = await page.evaluate(() => estimateScenes.every((scene, i) => {
    const parts = estimateDimensions[i].split('×');
    const metres = text => parseFloat(text) * (text.includes('千米') ? 1000 : 1);
    const squareMetres = metres(parts[0]) * metres(parts[1]);
    return Math.abs(squareMetres / (scene.unit === '公顷' ? 10000 : 1000000) - scene.answer) < 1e-9;
  }));
  expect(dimensionsAgree).toBe(true);
  await page.evaluate(()=>{Math.random=()=>.35;genEstimateProblem();});
  await expect(page.locator('#estimateQuestion')).toContainText('1200米×600米');
  await page.getByLabel('估计面积').fill('0.72');
  await expect(page.locator('#estimateValue')).toHaveText('0.72');
  await page.locator('#estimateSubmit').click();
  await page.locator('#estimateSubmit').dispatchEvent('click');
  await expect(page.locator('#estimateScore')).toContainText('1 / 1');
  await expect(page.locator('#estimateResult')).toContainText('参考值 0.72');
  await expect(page.locator('#estimateResult')).toContainText('你的估计：0.72');
  await expect(page.getByLabel('估计面积')).toBeDisabled();
  await page.locator('#estimateNext').click();
  await expect(page.getByLabel('估计面积')).toBeEnabled();
});

test('存储失败可恢复并重试',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;window.oldSet=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('denied');};});
  await page.goto(url); await finish(page);
  await expect(page.locator('#learningProgress')).toContainText('尚未保存');
  await page.evaluate(()=>{Storage.prototype.setItem=window.oldSet;});
  await page.locator('#math-progress-save-notice button').click();
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.reload(); await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
});
