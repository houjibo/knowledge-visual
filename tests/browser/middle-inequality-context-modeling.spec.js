const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/middle/inequalities.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/middle/inequalities.html';

async function expression(page, coefficient, fixed, relation, limit) {
  await page.locator('#context-coefficient').fill(coefficient);
  await page.locator('#context-fixed').fill(fixed);
  await page.locator('#context-relation').selectOption(relation);
  await page.locator('#context-limit').fill(limit);
  await page.locator('#context-expression-submit').click();
}
async function tryValue(page, x) { await page.locator('#context-trial').fill(String(x)); }

test('预算模型检查列式、相邻整数及整除边界', async ({page}) => {
  await page.goto(topic);
  await page.locator('[data-mode="context"]').click();
  await expression(page, '4', '3', 'lt', '23');
  await expect(page.locator('#context-expression-feedback')).toContainText('含等号');
  await expect(page.locator('#context-trial')).toBeDisabled();
  await expression(page, '4', '3', 'le', '23');
  await tryValue(page, 5);
  await expect(page.locator('#context-trial-feedback')).toContainText('满足不超过 23');
  await tryValue(page, 6);
  await expect(page.locator('#context-trial-feedback')).toContainText('不满足');
  await page.locator('#context-answer').fill('5');
  await page.locator('#context-reason').selectOption('floor');
  await page.locator('#context-answer-submit').click();
  await expect(page.locator('#context-answer-feedback')).toContainText('连续解为 x ≤ 5');
  await expect(page.locator('#context-answer-feedback')).toContainText('6本时为 27，不满足');
  const data = await page.evaluate(() => localStorage.getItem('kv-math-progress-v2'));
  expect(data === null || !JSON.parse(data)['middle:inequalities']).toBeTruthy();
});

test('非整除预算与最低目标按整数约束取边界，并在切换时重置', async ({page}) => {
  await page.goto(topic);
  await page.locator('[data-mode="context"]').click();
  await page.locator('#context-scenario').selectOption('budget-fraction');
  await expression(page, '4', '3', 'le', '22');
  await tryValue(page, 4);
  await expect(page.locator('#context-trial-feedback')).toContainText('19，满足');
  await tryValue(page, 5);
  await expect(page.locator('#context-trial-feedback')).toContainText('23，不满足');
  await page.locator('#context-answer').fill('4.75');
  await page.locator('#context-answer-submit').click();
  await expect(page.locator('#context-answer-feedback')).toContainText('请输入非负整数');
  await page.locator('#context-answer').fill('4');
  await page.locator('#context-reason').selectOption('ceil');
  await page.locator('#context-answer-submit').click();
  await expect(page.locator('#context-answer-feedback')).toContainText('数量正确');
  await page.locator('#context-reason').selectOption('floor');
  await page.locator('#context-answer-submit').click();
  await expect(page.locator('#context-answer-feedback')).toContainText('连续解为 x ≤ 4.75');
  await page.locator('#context-scenario').selectOption('target-fraction');
  await expect(page.locator('#context-trial')).toBeDisabled();
  await expect(page.locator('#context-coefficient')).toHaveValue('');
  await expression(page, '4', '5', 'ge', '24');
  await tryValue(page, 4);
  await expect(page.locator('#context-trial-feedback')).toContainText('21，不满足');
  await tryValue(page, 5);
  await expect(page.locator('#context-trial-feedback')).toContainText('25，满足');
  await page.locator('#context-answer').fill('5');
  await page.locator('#context-reason').selectOption('ceil');
  await page.locator('#context-answer-submit').click();
  await expect(page.locator('#context-answer-feedback')).toContainText('连续解为 x ≥ 4.75');
  await page.locator('#context-fixed').fill('6');
  await expect(page.locator('#context-trial')).toBeDisabled();
  await expect(page.locator('#context-answer')).toBeDisabled();
});

test('320px 键盘操作和文件直开', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '文件直开仅本地验证');
  await page.setViewportSize({width: 320, height: 740});
  await page.goto(pathToFileURL(resolve(__dirname, '../../math/middle/inequalities.html')).href);
  await page.locator('[data-mode="context"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#sec-context')).toBeVisible();
  await expression(page, '4', '3', 'le', '23');
  await page.locator('#context-trial').focus();
  await page.keyboard.press('End');
  await expect(page.locator('#context-trial-value')).toHaveText('10');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
