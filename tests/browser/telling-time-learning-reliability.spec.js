const {test, expect} = require('@playwright/test');
const url = '/math/topics/telling-time/index.html';

for (const value of [0, 0.999999]) {
  test(`重复随机值 ${value} 时钟表和四个不同选项可加载`, async ({page}) => {
    await page.addInitScript(v => { Math.random = () => v; }, value);
    await page.goto(url);
    await page.locator('[data-mode="choice"]').click();
    const options = page.locator('#choice-options button');
    await expect(options).toHaveCount(4);
    expect(new Set(await options.allTextContents()).size).toBe(4);
  });
}

async function completeActivities(page) {
  await page.locator('#learn-hour-slider').fill('3');
  await page.locator('[data-mode="read"]').click();
  await page.getByLabel('读钟小时').fill('1');
  await page.getByLabel('读钟分钟').fill('0');
  await page.locator('#btn-read-submit').click();
  await page.locator('[data-mode="dial"]').click();
  await page.locator('#dial-hour-slider').fill('1');
  await page.locator('#btn-dial-check').click();
  await page.locator('[data-mode="choice"]').click();
  await page.locator('#choice-options button').getByText('1:00', {exact:true}).click();
}

test('四种活动完成并保存，重复提交不增加连对', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await expect(page.locator('#learning-progress')).toContainText('0/4');
  await page.locator('[data-mode="read"]').click();
  await page.locator('#btn-read-submit').click();
  await expect(page.locator('#read-result')).toContainText('有效');
  await expect(page.locator('#streak')).toHaveText('0');
  await page.locator('[data-mode="learn"]').click();
  await completeActivities(page);
  await expect(page.locator('#learning-progress')).toHaveText('✓ 本主题已完成');
  await expect(page.locator('#streak')).toHaveText('3');
  await page.locator('#choice-options button').getByText('1:00', {exact:true}).dispatchEvent('click');
  await expect(page.locator('#streak')).toHaveText('3');
  await page.reload();
  await expect(page.locator('#learning-progress')).toHaveText('✓ 本主题已完成');
  await page.goto('/math/index.html');
  await expect(page.locator('a.topic-card[href="topics/telling-time/index.html"] .progress-badge')).toHaveText('✓');
});

test('存储不可用时可继续学习并重试进度保存', async ({page}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
    window.originalGetItem = Storage.prototype.getItem;
    window.originalSetItem = Storage.prototype.setItem;
    if (!sessionStorage.getItem('test-storage-restored')) {
      Storage.prototype.getItem = () => { throw new Error('denied'); };
      Storage.prototype.setItem = () => { throw new Error('denied'); };
    }
  });
  await page.goto(url);
  await expect(page.locator('#best-status')).toContainText('不可读取');
  await completeActivities(page);
  await expect(page.locator('#learning-progress')).toContainText('尚未保存');
  await expect(page.locator('#math-progress-save-notice')).toContainText('暂未保存');
  await page.evaluate(() => { Storage.prototype.getItem = window.originalGetItem; Storage.prototype.setItem = window.originalSetItem; sessionStorage.setItem('test-storage-restored', '1'); });
  await page.locator('#math-progress-save-notice button').click();
  await expect(page.locator('#learning-progress')).toHaveText('✓ 本主题已完成');
  await page.reload();
  await expect(page.locator('#learning-progress')).toHaveText('✓ 本主题已完成');
});

test('钟针表示三点半，答错后可主动换题', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('#learn-hour-slider').fill('3');
  await page.locator('#learn-minute-slider').fill('30');
  await expect(page.locator('#learn-time-display')).toHaveText('3:30');
  const hour = page.locator('#learn-hour-hand');
  expect(Number(await hour.getAttribute('x2'))).toBeCloseTo(150 + 70 * Math.cos(15 * Math.PI / 180), 2);
  expect(Number(await hour.getAttribute('y2'))).toBeCloseTo(150 + 70 * Math.sin(15 * Math.PI / 180), 2);
  await page.locator('[data-mode="read"]').click();
  await page.getByLabel('读钟小时').fill('2');
  await page.getByLabel('读钟分钟').fill('0');
  await page.locator('#btn-read-submit').click();
  await expect(page.locator('#read-result')).toContainText('1:00');
  await expect(page.locator('#btn-read-submit')).toBeDisabled();
  await page.locator('#btn-read-next').click();
  await expect(page.locator('#btn-read-submit')).toBeEnabled();
  await page.locator('[data-mode="choice"]').click();
  await page.locator('#choice-options button').filter({hasNotText: '1:00'}).first().click();
  await expect(page.locator('#choice-result')).toContainText('1:00');
  await expect(page.locator('#choice-options button').first()).toBeDisabled();
  await page.locator('#btn-choice-next').click();
  await expect(page.locator('#choice-options button').first()).toBeEnabled();
});
