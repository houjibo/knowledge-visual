const {test, expect} = require('@playwright/test');
const url = '/math/topics/multiplication-intro/';

async function readIntro(page) {
  for (let i = 0; i < 5; i++) await page.locator('#learn-next').click();
}
async function answer(page, mode, id, name) {
  await page.locator(`[data-mode="${mode}"]`).click();
  const value = await page.evaluate(name => ({currentPicAnswer, currentConvAnswer, currentRevAnswer})[name], name);
  const option = page.locator(`#${id}-options button`).filter({hasText: value});
  await option.click();
  await option.dispatchEvent('click');
  await expect(page.locator(`#${id}-correct`)).toHaveText('1');
}
async function finish(page) {
  await readIntro(page);
  await answer(page, 'picture', 'pic', 'currentPicAnswer');
  await answer(page, 'convert', 'conv', 'currentConvAnswer');
  await answer(page, 'reverse', 'rev', 'currentRevAnswer');
}

test('四项达标后保存，刷新及知识地图显示完成', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await expect(page.locator('#learningProgress')).toContainText('0/4');
  await readIntro(page);
  await expect(page.locator('#learningProgress')).toContainText('1/4');
  await page.reload();
  await expect(page.locator('#learningProgress')).toContainText('0/4');
  await finish(page);
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.reload();
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.goto('/math/index.html');
  await expect(page.locator('a.topic-card[href="topics/multiplication-intro/index.html"] .progress-badge')).toHaveText('✓');
});

test('反馈保留并由学习者换题', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await answer(page, 'picture', 'pic', 'currentPicAnswer');
  await page.waitForTimeout(1700);
  await expect(page.locator('#pic-feedback')).toContainText('答对');
  await page.locator('#pic-next').click();
  await expect(page.locator('#pic-feedback')).toHaveText('');
  await expect(page.locator('#pic-next')).toBeHidden();
  await expect(page.locator('#pic-options button').first()).toBeEnabled();
});

test('存储失败后可重试并恢复完成记录', async ({page}) => {
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
