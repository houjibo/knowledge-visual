const {test, expect} = require('@playwright/test');
const url = '/math/topics/abacus/';
async function finish(page) {
  await page.locator('[data-mode="represent"]').click();
  await page.locator('#repCheck').click();
  await page.locator('[data-mode="read"]').click();
  await page.locator('#readOptions button').getByText('0', {exact:true}).click();
  await page.locator('[data-mode="challenge"]').click();
  await page.locator('#chalStartBtn').click();
  await page.locator('#chalInput').fill('1');
  await page.locator('#chalSubmit').click();
}

test('完成三类活动后保存并在目录显示', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await expect(page.locator('#learningProgress')).toContainText('0/3');
  await page.locator('[data-mode="represent"]').click();
  await page.locator('#repCheck').click();
  await expect(page.locator('#learningProgress')).toContainText('1/3');
  await page.reload();
  await expect(page.locator('#learningProgress')).toContainText('0/3');
  await finish(page);
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.reload();
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.goto('/math/index.html');
  await expect(page.locator('a.topic-node[href="topics/abacus/index.html"] .progress-badge')).toHaveText('✓');
});

test('保存失败后可重试', async ({page}) => {
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

test('切换模式和隐藏页面暂停计时并恢复答题', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.clock.install();
  await page.goto(url);
  await page.clock.pauseAt(Date.now() + 1000);
  await page.locator('[data-mode="challenge"]').click();
  await page.locator('#chalStartBtn').click();
  await page.clock.runFor(3000);
  await expect(page.locator('#chalTimeLeft')).toHaveText('57');
  await page.locator('#chalInput').fill('1');
  await page.locator('#chalSubmit').click();
  await page.locator('[data-mode="read"]').click();
  await page.clock.runFor(10000);
  await expect(page.locator('#chalTimeLeft')).toHaveText('57');
  await page.locator('[data-mode="challenge"]').click();
  await expect(page.locator('#chalInput')).toHaveValue('');
  await expect(page.locator('#chalCorrect')).toHaveText('1');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', {configurable:true, value:true}); document.dispatchEvent(new Event('visibilitychange')); });
  await page.clock.runFor(5000);
  await expect(page.locator('#chalTimeLeft')).toHaveText('57');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', {configurable:true, value:false}); document.dispatchEvent(new Event('visibilitychange')); });
  await page.clock.runFor(2000);
  await expect(page.locator('#chalTimeLeft')).toHaveText('55');
  await page.locator('#chalInput').fill('1');
  await page.locator('#chalSubmit').click();
  await expect(page.locator('#chalCorrect')).toHaveText('2');
});
