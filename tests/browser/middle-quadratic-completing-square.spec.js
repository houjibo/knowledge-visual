const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/middle/quadratic-equation.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/middle/quadratic-equation.html';

async function solve(page, a, b, c) {
  for (const [id, value] of [['coeffA', a], ['coeffB', b], ['coeffC', c]]) {
    await page.locator(`#${id}`).fill(String(value));
  }
  await page.getByRole('button', {name: '🚀 开始配方'}).click();
}

test('非单位及负系数保留等价原式和精确分数', async ({page}) => {
  await page.goto(topic);
  await solve(page, 2, 6, 5);
  const steps = page.locator('#stepsContainer .step-card');
  await expect(steps.nth(1)).toContainText(/2x²\s*\+ 6x\s*\+ 5 = 0\s*→\s*x²\s*\+ 3x/);
  await expect(steps.last()).toContainText('无实数根');
  await solve(page, -3, 1, 2);
  await expect(steps.nth(1)).toContainText(/-3x²\s*\+ 1x\s*\+ 2 = 0\s*→\s*x²\s*−/);
  await expect(steps.nth(2)).toContainText(/x²\s*−\s*1\s*3\s*x/);
  await expect(steps.last()).toContainText('根与系数');
});

test('无理根标记近似，重根和有理根保留精确值', async ({page}) => {
  await page.goto(topic);
  await solve(page, 1, 0, -2);
  await expect(page.locator('#stepsContainer')).toContainText('√8');
  await expect(page.locator('#stepsContainer')).toContainText('≈ 1.4142');
  await solve(page, 1, -2, 1);
  await expect(page.locator('#stepsContainer')).toContainText('重根');
  await solve(page, 2, -3, 1);
  await expect(page.locator('#stepsContainer .step-card').last()).toContainText(/x₁ = 1.*x₂ =\s*1\s*2/s);
});

test('非法输入不沿用旧步骤，判别式区分退化方程', async ({page}) => {
  await page.goto(topic);
  await solve(page, 1, 2, 1);
  for (const value of ['0', '1.5', '', '21', '1e-324']) {
    await solve(page, value, 2, 1);
    await expect(page.locator('#equationDisplay')).toContainText('整数系数');
    await expect(page.locator('#stepsContainer .step-card')).toHaveCount(0);
  }
  await page.getByRole('button', {name: '📊 判别式可视化'}).click();
  await page.locator('#discA').fill('0');
  await page.locator('#discB').fill('0');
  await page.locator('#discC').fill('0');
  await expect(page.locator('#discResult')).toContainText('恒等式');
  await expect(page.locator('#rootsDisplay')).toHaveText('任意实数都是解');
  await page.locator('#discC').fill('1');
  await expect(page.locator('#rootsDisplay')).toHaveText('无解');
  await page.locator('#discB').fill('2');
  await expect(page.locator('#discResult')).toContainText('一次方程');
  await expect(page.locator('#rootsDisplay')).toContainText('−0.50'.replace('−', '-'));
});

test('320px 和文件直开能操作配方', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '文件直开仅本地验证');
  await page.setViewportSize({width: 320, height: 740});
  await page.goto(pathToFileURL(resolve(__dirname, '../../math/middle/quadratic-equation.html')).href);
  await solve(page, 2, 6, 5);
  await expect(page.locator('#stepsContainer')).toContainText('无实数根');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
