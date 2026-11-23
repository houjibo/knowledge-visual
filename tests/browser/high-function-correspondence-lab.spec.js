const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/high/function.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/high/function.html';

test('多对一仍是函数，值域小于陪域，预测变化清除反馈', async ({page}) => {
  await page.goto(topic);
  await expect(page.locator('#correspondence-edges line')).toHaveCount(3);
  await expect(page.locator('#correspondence-description')).toContainText('x=-2 指向4');
  await page.locator('#correspondence-check').click();
  await expect(page.locator('#correspondence-feedback')).toContainText('先预测');
  await page.locator('input[name="correspondence-prediction"][value="yes"]').check();
  await page.locator('#correspondence-check').click();
  await expect(page.locator('#correspondence-feedback')).toContainText('预测的值域');
  await page.locator('#correspondence-range input[value="0"]').check();
  await page.locator('#correspondence-range input[value="2"]').check();
  await page.locator('#correspondence-range input[value="4"]').check();
  await page.locator('#correspondence-check').click();
  await expect(page.locator('#correspondence-feedback')).toContainText('实际值域为 {0,4}');
  await expect(page.locator('#correspondence-feedback')).toContainText('再核对');
  await page.locator('#correspondence-range input[value="2"]').uncheck();
  await expect(page.locator('#correspondence-feedback')).toBeHidden();
  await page.locator('#correspondence-check').click();
  await expect(page.locator('#correspondence-feedback')).toContainText('判断正确');
  await expect(page.locator('#correspondence-feedback')).toContainText('不同输入可以同指一个输出');
  await expect(page.locator('#correspondence-feedback')).toContainText('陪域 B={0,2,4}');
});

test('漏配和一对多分别指出反例；自编辑的混合关系同步绘图', async ({page}) => {
  await page.goto(topic);
  await page.locator('[data-correspondence-preset="missing"]').click();
  await expect(page.locator('#correspondence-edges line')).toHaveCount(2);
  await page.locator('input[name="correspondence-prediction"][value="no"]').check();
  await page.locator('#correspondence-check').click();
  await expect(page.locator('#correspondence-feedback')).toContainText('x=0 没有对应值');
  await expect(page.locator('#correspondence-feedback')).toContainText('不能称其有函数值域');
  await page.locator('[data-correspondence-preset="multiple"]').click();
  await expect(page.locator('#correspondence-feedback')).toBeHidden();
  await expect(page.locator('#correspondence-edges line')).toHaveCount(4);
  await page.locator('input[name="correspondence-prediction"][value="no"]').check();
  await page.locator('#correspondence-check').click();
  await expect(page.locator('#correspondence-feedback')).toContainText('x=-2 同时对应 2 和 4');
  await page.locator('input[data-x="-2"][data-y="2"]').uncheck();
  await page.locator('input[data-x="0"][data-y="0"]').uncheck();
  await expect(page.locator('#correspondence-description')).toContainText('x=0 指向无');
  await expect(page.locator('#correspondence-edges line')).toHaveCount(2);
  await page.locator('#correspondence-check').click();
  await expect(page.locator('#correspondence-feedback')).toContainText('x=0 没有对应值');
});

test('320px 下可用键盘修改箭头和提交，无横向溢出', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.goto(topic);
  const arrow = page.locator('input[data-x="0"][data-y="0"]');
  await arrow.focus();
  await page.keyboard.press('Space');
  await expect(arrow).not.toBeChecked();
  await expect(page.locator('#correspondence-description')).toContainText('x=0 指向无');
  await page.locator('input[name="correspondence-prediction"][value="no"]').check();
  await page.locator('#correspondence-check').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#correspondence-feedback')).toContainText('判断正确');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('文件直开与发布子路径均能运行对应模型', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网由共用情境测试验证');
  const release = await startReleaseServer();
  try {
    for (const url of [
      pathToFileURL(resolve(__dirname, '../../math/high/function.html')).href,
      new URL('math/high/function.html', release.base).href
    ]) {
      await page.goto(url);
      await page.locator('input[name="correspondence-prediction"][value="yes"]').check();
      await page.locator('#correspondence-range input[value="0"]').check();
      await page.locator('#correspondence-range input[value="4"]').check();
      await page.locator('#correspondence-check').click();
      await expect(page.locator('#correspondence-feedback')).toContainText('判断正确');
    }
  } finally { await release.close(); }
});
