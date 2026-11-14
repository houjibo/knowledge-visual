const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/middle/square-cube-roots.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/middle/square-cube-roots.html';

async function complete(page, id, answer, reason = 'inverse') {
  await page.locator('#case-select').selectOption(id);
  await page.locator('#prediction').fill(answer);
  await page.locator('#predict-submit').click();
  await page.locator(`#reason-options input[value="${reason}"]`).check();
  await page.locator('#reason-submit').click();
  await page.locator('#calculate').click();
}

test('平方网格与立方分层随边长、层数同步，正负意义分开', async ({page}) => {
  await page.goto(topic);
  await expect(page.locator('#unit-grid .unit')).toHaveCount(16);
  await expect(page.locator('#explore-formula')).toHaveText('4² = 16；反过来，√16 = 4。');
  await page.locator('[name="shape"][value="3"]').check();
  await expect(page.locator('#layer-list li')).toHaveCount(4);
  await expect(page.locator('#figure-caption')).toContainText('已叠 1/4 层，共 16 个');
  await page.locator('#layers').fill('3');
  await expect(page.locator('#figure-caption')).toContainText('已叠 3/4 层，共 48 个');
  await page.locator('#side').fill('10');
  await expect(page.locator('#unit-grid .unit')).toHaveCount(100);
  await expect(page.locator('#layer-list li')).toHaveCount(10);
  await expect(page.locator('#explore-formula')).toHaveText('10³ = 1000；反过来，∛1000 = 10。');
  await expect(page.locator('.note')).toContainText('−64 不是实物体积');
});

test('先预测、再解释、再验算；平方根记号和负数边界正确', async ({page}) => {
  await page.goto(topic);
  await expect(page.locator('#calculate')).toBeDisabled();
  await page.locator('#prediction').fill('-7');
  await page.locator('#predict-submit').click();
  await expect(page.locator('#predict-feedback')).toContainText('非负');
  await expect(page.locator('#reason-fieldset')).toHaveAttribute('disabled', '');
  await page.locator('#prediction').fill('7');
  await page.locator('#prediction').press('Enter');
  await page.locator('#reason-options input[value="both"]').check();
  await page.locator('#reason-submit').click();
  await expect(page.locator('#reason-feedback')).toContainText('正负两个');
  await expect(page.locator('#calculate')).toBeDisabled();
  await page.locator('#reason-options input[value="inverse"]').check();
  await page.locator('#reason-submit').click();
  await page.locator('#calculate').click();
  await expect(page.locator('#challenge-answer')).toContainText('方程 x²=49 有 ±7 两个平方根');
  await expect(page.locator('#progress-detail')).toContainText('1/6');
  await page.locator('#case-select').selectOption('cb--64');
  await page.locator('#prediction').fill('4');
  await page.locator('#predict-submit').click();
  await expect(page.locator('#predict-feedback')).toContainText('负号');
  await page.locator('#prediction').fill('-4');
  await page.locator('#predict-submit').click();
  await page.locator('#reason-options input[value="absolute"]').check();
  await page.locator('#reason-submit').click();
  await expect(page.locator('#reason-feedback')).toContainText('负数的立方根');
  await page.locator('#reason-options input[value="inverse"]').check();
  await page.locator('#reason-submit').click();
  await page.locator('#calculate').click();
  await expect(page.locator('#challenge-answer')).toContainText('∛(-64) = -4');
  await expect(page.locator('#challenge-answer')).toContainText('真实立方体的体积不会是负数');
  await complete(page, 'sq--9', '无解', 'nonnegative');
  await expect(page.locator('#challenge-answer')).toContainText('实数范围无结果');
});

test('六类均验算才保存，重新进入目录有完成徽章，搜索能找到页面', async ({page}) => {
  await page.goto(topic);
  await page.locator('#case-select').selectOption('sq-0');
  await page.locator('#prediction').fill('0');
  await page.locator('#predict-submit').click();
  await expect(page.locator('#progress-detail')).toContainText('0/6');
  await complete(page, 'sq-49', '7');
  await complete(page, 'sq-0', '0');
  await complete(page, 'cb-512', '8');
  await complete(page, 'cb-0', '0');
  await complete(page, 'cb--64', '-4');
  await expect(page.locator('#progress-detail')).toContainText('5/6');
  await complete(page, 'sq--9', '无解', 'nonnegative');
  await expect(page.locator('#learning-progress')).toContainText('已保存');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('kv-math-progress-v2'))['middle:square-cube-roots']);
  expect(stored).toBeTruthy();
  await page.getByRole('link', {name: '返回初中数学目录'}).click();
  await expect(page.locator('a[href="square-cube-roots.html"] .progress-badge')).toHaveText('✓');
  await page.goto(process.env.KV_PUBLISHED_BASE_URL ? new URL('index.html', process.env.KV_PUBLISHED_BASE_URL).href : '/index.html');
  await page.locator('#site-query').fill('立方根');
  await expect(page.locator('#site-results')).toContainText('平方与立方开方实验室');
});

test('320px 不横向溢出，键盘能操作任务与层数', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.goto(topic);
  await page.locator('[name="shape"][value="3"]').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#layer-control')).toBeVisible();
  await page.locator('#layers').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#figure-caption')).toContainText('已叠 2/4 层');
  await page.locator('#prediction').focus();
  await page.keyboard.type('7');
  await page.keyboard.press('Enter');
  await expect(page.locator('#reason-fieldset')).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('直接文件打开仍可完成负数立方根和负数平方根', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项不访问本机文件');
  await page.goto(pathToFileURL(resolve(__dirname, '../../math/middle/square-cube-roots.html')).href);
  await complete(page, 'cb--1000', '-10');
  await expect(page.locator('#challenge-answer')).toContainText('∛(-1000) = -10');
  await complete(page, 'sq--16', '无解', 'nonnegative');
  await expect(page.locator('#challenge-answer')).toContainText('实数范围无结果');
});

test('存储失败保留待保存结果并支持重试', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项不替换本机存储实现');
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === 'kv-math-progress-v2') throw new Error('blocked');
      return original.call(this, name, value);
    };
    window.restoreMathWrites = () => { Storage.prototype.setItem = original; };
  });
  await page.goto(topic);
  await complete(page, 'sq-49', '7');
  await complete(page, 'sq-0', '0');
  await complete(page, 'cb-512', '8');
  await complete(page, 'cb-0', '0');
  await complete(page, 'cb--64', '-4');
  await complete(page, 'sq--9', '无解', 'nonnegative');
  await expect(page.locator('#learning-progress')).toContainText('暂未保存');
  await page.evaluate(() => window.restoreMathWrites());
  await page.getByRole('button', {name: '重试保存'}).click();
  await expect(page.locator('#learning-progress')).toContainText('已保存');
});
