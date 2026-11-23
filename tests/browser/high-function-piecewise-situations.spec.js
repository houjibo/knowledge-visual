const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/high/function.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/high/function.html';

test('寄件分档：零不在定义域，2 属前档，超过 2 属后档', async ({page}) => {
  await page.goto(topic);
  await page.locator('#piecewise-check').click();
  await expect(page.locator('#piecewise-feedback')).toContainText('先选');
  await page.locator('input[name="piecewise-rule"][value="correct"]').check();
  await page.locator('input[name="piecewise-boundary"][value="second"]').check();
  await page.locator('#piecewise-value').fill('5');
  await page.locator('#piecewise-check').click();
  await expect(page.locator('#piecewise-feedback')).toContainText('请重新检查');
  await expect(page.locator('#piecewise-graph-description')).toContainText('(2,5) 是实心点');
  await expect(page.locator('#piecewise-graph-description')).toContainText('(2,8) 是空心点');
  const endpointColors = await page.locator('#piecewise-canvas').evaluate(canvas => {
    const ctx = canvas.getContext('2d');
    return [ctx.getImageData(178, 115, 1, 1).data.slice(0, 3),
      ctx.getImageData(178, 58, 1, 1).data.slice(0, 3)].map(rgb => Array.from(rgb));
  });
  expect(endpointColors[0]).toEqual([56, 189, 248]);
  expect(endpointColors[1]).toEqual([15, 12, 41]);
  await page.locator('input[name="piecewise-boundary"][value="first"]').check();
  await page.locator('#piecewise-check').click();
  await expect(page.locator('#piecewise-feedback')).toContainText('正确');
  await expect(page.locator('#piecewise-summary')).toContainText('0<w≤5');
  await expect(page.locator('#piecewise-table-body')).toContainText('2.1');
  await page.locator('#piecewise-input').fill('0');
  await expect(page.locator('#piecewise-results')).toBeHidden();
  await page.locator('#piecewise-check').click();
  await expect(page.locator('#piecewise-feedback')).toContainText('0<w≤5');
  await page.locator('#piecewise-input').fill('2.01');
  await page.locator('#piecewise-value').fill('8');
  await page.locator('#piecewise-check').click();
  await expect(page.locator('#piecewise-feedback')).toContainText('后段');
});

test('两段注水：分界点连续，320px 键盘可完成并重置反馈', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.goto(topic);
  await page.locator('#piecewise-scenario').selectOption('tank');
  await page.locator('input[name="piecewise-rule"][value="correct"]').check();
  await page.locator('input[name="piecewise-boundary"][value="first"]').check();
  await page.locator('#piecewise-value').fill('4');
  await page.locator('#piecewise-check').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#piecewise-feedback')).toContainText('正确');
  await expect(page.locator('#piecewise-feedback')).toContainText('4+(t−2)=t+2');
  await expect(page.locator('#piecewise-graph-description')).toContainText('连续');
  await expect(page.locator('#piecewise-table-body')).toContainText('4.1');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#piecewise-scenario').selectOption('shipping');
  await expect(page.locator('#piecewise-feedback')).toBeHidden();
  await expect(page.locator('#piecewise-results')).toBeHidden();
  await expect(page.locator('input[name="piecewise-rule"]:checked')).toHaveCount(0);
});

test('文件直开与发布子路径都能运行分段模型', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网由共用情境测试验证');
  const release = await startReleaseServer();
  try {
    for (const url of [
      pathToFileURL(resolve(__dirname, '../../math/high/function.html')).href,
      new URL('math/high/function.html', release.base).href
    ]) {
      await page.goto(url);
      await page.locator('input[name="piecewise-rule"][value="correct"]').check();
      await page.locator('input[name="piecewise-boundary"][value="first"]').check();
      await page.locator('#piecewise-value').fill('5');
      await page.locator('#piecewise-check').click();
      await expect(page.locator('#piecewise-feedback')).toContainText('正确');
    }
  } finally { await release.close(); }
});
