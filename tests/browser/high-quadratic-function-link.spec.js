const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/high/inequality.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/high/inequality.html';

test('先预测再比较方程根、函数零点与正值区间', async ({page}) => {
  await page.goto(topic);
  await page.getByRole('button', {name: /一元二次不等式/}).click();
  await expect(page.locator('#quadratic-lab')).toBeVisible();
  await page.locator('#quadratic-task-scenario').selectOption('none-up');
  await page.locator('#quadratic-task-check').click();
  await expect(page.locator('#quadratic-task-feedback')).toContainText('先选');
  await page.locator('input[name="quadratic-task-roots"][value="2"]').check();
  await page.locator('input[name="quadratic-task-region"][value="outside"]').check();
  await page.locator('#quadratic-task-check').click();
  await expect(page.locator('#quadratic-task-feedback')).toContainText('应为 0 个实零点');
  await expect(page.locator('#quadratic-solution')).toHaveText('ℝ');
  await page.locator('input[name="quadratic-task-roots"][value="0"]').check();
  await page.locator('input[name="quadratic-task-region"][value="all"]').check();
  await page.locator('#quadratic-task-check').click();
  await expect(page.locator('#quadratic-task-feedback')).toContainText('正确');
  await expect(page.locator('#quadratic-root-count')).toHaveText('0');
});

test('实际情境列式、根边界精确值和手机键盘路径', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.goto(topic);
  await page.getByRole('button', {name: /一元二次不等式/}).click();
  await page.locator('#quadratic-task-scenario').selectOption('garden');
  await page.locator('input[name="quadratic-task-model"][value="area-greater"]').check();
  await page.locator('input[name="quadratic-task-roots"][value="2"]').check();
  await page.locator('input[name="quadratic-task-region"][value="inside"]').check();
  await page.locator('#quadratic-task-check').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#quadratic-task-feedback')).toContainText('正确');
  await expect(page.locator('#quadratic-solution')).toHaveText('(1, 4)');
  await expect(page.locator('#quadratic-task-feedback')).toContainText('0<x<5');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#slA').selectOption('0.5');
  await expect(page.locator('#quadratic-task-feedback')).toBeHidden();
  await page.locator('#slB').evaluate(el => { el.value = '0'; el.dispatchEvent(new Event('input', {bubbles:true})); });
  await page.locator('#slC').evaluate(el => { el.value = '-1'; el.dispatchEvent(new Event('input', {bubbles:true})); });
  await expect(page.locator('#quadratic-zeros')).toContainText('√8');
  await expect(page.locator('#quadratic-solution')).toContainText('√8');
  await page.locator('#slB').evaluate(el => { el.value = '0.5'; el.dispatchEvent(new Event('input', {bubbles:true})); });
  await page.locator('#slC').evaluate(el => { el.value = '0'; el.dispatchEvent(new Event('input', {bubbles:true})); });
  await expect(page.locator('#quadratic-disc')).toHaveText('0.25');
});

test('文件直开与发布子路径都能加载二次模型', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网由共用流程验证');
  const paths = [pathToFileURL(resolve(__dirname, '../../math/high/inequality.html')).href];
  const release = await startReleaseServer();
  paths.push(new URL('math/high/inequality.html', release.base).href);
  try {
    for (const path of paths) {
      await page.goto(path);
      await page.getByRole('button', {name: /一元二次不等式/}).click();
      await page.locator('#quadratic-task-scenario').selectOption('garden');
      await expect(page.locator('#quadratic-task-prompt')).toContainText('面积大于 4');
      await page.locator('input[name="quadratic-task-model"][value="area-greater"]').check();
      await page.locator('input[name="quadratic-task-roots"][value="2"]').check();
      await page.locator('input[name="quadratic-task-region"][value="inside"]').check();
      await page.locator('#quadratic-task-check').click();
      await expect(page.locator('#quadratic-zeros')).toHaveText('1，4');
    }
  } finally { await release.close(); }
});
