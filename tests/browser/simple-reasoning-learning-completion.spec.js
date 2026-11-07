const {test, expect} = require('@playwright/test');
const url = '/math/topics/simple-reasoning/';

async function finish(page) {
  const pattern = await page.evaluate(() => currentPattern.answer);
  const patternButton = page.locator('#patternOptions button').getByText(pattern, {exact:true});
  await patternButton.click();
  await patternButton.click();
  await expect(page.locator('#patternNext')).toBeVisible();
  await expect(page.locator('#scoreText')).toHaveText('答对 1 题');
  await page.locator('[data-mode="eliminate"]').click();
  const data = await page.evaluate(() => ({...eliminateState}));
  for (const name of data.names) {
    const button = page.locator(`[id="ec-${name}-${data.assignment[name]}"]`);
    await button.click(); await button.click();
  }
  const check = page.getByRole('button', {name:'✅ 检查答案'});
  await check.click(); await check.click();
  const first = page.locator(`[id="ec-${data.names[0]}-${data.assignment[data.names[0]]}"]`);
  await first.click();
  await expect(first).toHaveAttribute('aria-label', /确定/);
  await expect(page.locator('#scoreText')).toHaveText('答对 2 题');
  await page.locator('[data-mode="substitute"]').click();
  const substitute = await page.evaluate(() => String(substituteState.answer));
  const subButton = page.locator('#substituteOptions button').getByText(substitute, {exact:true});
  await subButton.click(); await subButton.click();
  await expect(page.locator('#substituteNext')).toBeVisible();
  await page.locator('[data-mode="logic"]').click();
  const logic = await page.evaluate(() => currentLogic.answer);
  const logicButton = page.locator('#logicOptions button').getByText(logic, {exact:true});
  await logicButton.click(); await logicButton.click();
  await expect(page.locator('#logicNext')).toBeVisible();
  await expect(page.locator('#scoreText')).toHaveText('答对 4 题');
}

test('四类活动达标后保存并刷新目录', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await expect(page.locator('#learningProgress')).toContainText('0/4');
  await page.locator('#patternOptions button').getByText('🍌', {exact:true}).click();
  await expect(page.locator('#learningProgress')).toContainText('1/4');
  await page.reload();
  await expect(page.locator('#learningProgress')).toContainText('0/4');
  await finish(page);
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.reload();
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.goto('/math/index.html');
  await expect(page.locator('a.topic-card[href="topics/simple-reasoning/index.html"] .progress-badge')).toHaveText('✓');
});

test('保存失败可重试', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; window.oldSet = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw Error('denied'); }; });
  await page.goto(url);
  await finish(page);
  await expect(page.locator('#learningProgress')).toContainText('尚未保存');
  await page.evaluate(() => { Storage.prototype.setItem = window.oldSet; });
  await page.locator('#math-progress-save-notice button').click();
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.reload();
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
});
