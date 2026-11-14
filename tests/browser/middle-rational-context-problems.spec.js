const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/middle/rational-context-problems.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/middle/rational-context-problems.html';
const progressKey = 'kv-math-progress-v2';

async function answer(page, id, expression, result, meaning) {
  await page.locator('#scenario-select').selectOption(id);
  await page.locator(`#expression-options input[value="${expression}"]`).check();
  await page.locator('#expression-submit').click();
  await page.locator('#result-answer').fill(result);
  await page.locator('#result-submit').click();
  await page.locator(`#meaning-options input[value="${meaning}"]`).check();
  await page.locator('#meaning-submit').click();
}

test('列式、带符号结果和单位解释分别给出可操作反馈', async ({page}) => {
  await page.goto(topic);
  await expect(page.locator('#scenario-story')).toContainText('−6°C');
  await expect(page.locator('#axis-end')).toBeHidden();
  await expect(page.locator('#meaning-options')).toBeHidden();
  await page.locator('#expression-options input[value="warm-start"]').check();
  await page.locator('#expression-submit').click();
  await expect(page.locator('#expression-feedback')).toContainText('起点应写成 −6');
  await expect(page.locator('#result-answer')).toBeDisabled();
  await page.locator('#expression-options input[value="warm-right"]').check();
  await page.locator('#expression-submit').click();
  await expect(page.locator('#axis-move')).toBeVisible();
  await expect(page.locator('#axis-end')).toBeHidden();
  await expect(page.locator('#axis')).toHaveAttribute('aria-label', /向右移动 9 个单位/);
  await page.locator('#result-answer').fill('-3');
  await page.locator('#result-submit').click();
  await expect(page.locator('#result-feedback')).toContainText('正负号');
  await page.locator('#result-answer').fill('3');
  await page.locator('#result-submit').click();
  await expect(page.locator('#axis-end')).toBeVisible();
  await expect(page.locator('#meaning-options')).toBeVisible();
  await expect(page.locator('#end-label')).toHaveText('+3');
  await page.locator('#meaning-options input[value="warm-unit"]').check();
  await page.locator('#meaning-submit').click();
  await expect(page.locator('#meaning-feedback')).toContainText('°C');
  await page.locator('#meaning-options input[value="warm-above"]').check();
  await page.locator('#meaning-submit').click();
  await expect(page.locator('#progress-detail')).toContainText('正结果 1/1 · 负结果 0/1');
});

test('正负两类情境独立完成后保存，重载与目录一致', async ({page}) => {
  await page.goto(topic);
  await answer(page, 'warming', 'warm-right', '3', 'warm-above');
  await expect(page.locator('#learning-progress')).not.toContainText('已保存');
  await answer(page, 'height', 'height-left', '-5', 'height-below');
  await expect(page.locator('#axis-move')).toHaveClass(/left/);
  await expect(page.locator('#end-label')).toHaveText('−5');
  await expect(page.locator('#learning-progress')).toContainText('已保存');
  const stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey);
  expect(stored['middle:rational-context-problems']).toBeTruthy();
  await page.reload();
  await expect(page.locator('#progress-detail')).toContainText('本机已有完成记录');
  await page.getByRole('link', {name: /返回初中数学目录/}).click();
  await expect(page.locator('a[href="rational-context-problems.html"] .progress-badge')).toHaveText('✓');
});

test('查看示例不计完成，存储失败可重试', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项不替换本机存储实现');
  await page.addInitScript(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new Error('blocked');
      return original.call(this, name, value);
    };
    window.restoreMathWrites = () => { Storage.prototype.setItem = original; };
  }, progressKey);
  await page.goto(topic);
  await page.locator('#show-solution').click();
  await expect(page.locator('#solution')).toContainText('示例不计独立完成');
  await answer(page, 'warming', 'warm-right', '3', 'warm-above');
  await expect(page.locator('#meaning-feedback')).toContainText('不计入独立完成');
  await answer(page, 'height', 'height-left', '-5', 'height-below');
  await expect(page.locator('#progress-detail')).toContainText('正结果 0/1 · 负结果 1/1');
  await answer(page, 'cooling', 'cool-down', '2.5', 'cool-above');
  await expect(page.locator('#learning-progress')).toContainText('暂未保存');
  await expect(page.locator('#math-progress-save-notice')).toContainText('暂未保存');
  await page.evaluate(() => window.restoreMathWrites());
  await page.getByRole('button', {name: '重试保存'}).click();
  await expect(page.locator('#learning-progress')).toContainText('已保存');
});

test('320px、键盘及直接文件打开保持列式与小数反馈', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.goto(topic);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.locator('#scenario-select').selectOption('robot');
  await page.locator('#expression-options input[value="robot-right"]').focus();
  await page.keyboard.press('Space');
  await page.locator('#expression-submit').focus();
  await page.keyboard.press('Enter');
  await page.locator('#result-answer').fill('−0.750');
  await page.locator('#result-answer').press('Enter');
  await expect(page.locator('#end-label')).toHaveText('−0.75');
  await expect(page.locator('#axis')).toHaveAttribute('aria-label', /终点 −0.75m/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网页面不访问本机文件');
  const localUrl = pathToFileURL(resolve(__dirname, '../../math/middle/rational-context-problems.html')).href;
  await page.goto(localUrl);
  await answer(page, 'height', 'height-left', '-5', 'height-below');
  await expect(page.locator('#meaning-feedback')).toContainText('低于基准面 5m');
});
