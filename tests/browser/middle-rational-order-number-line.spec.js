const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/middle/rational-order-number-line.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/middle/rational-order-number-line.html';
const progressKey = 'kv-math-progress-v2';

async function setSlider(page, id, value) {
  await page.locator(id).evaluate((node, next) => {
    node.value = String(next);
    node.dispatchEvent(new Event('input', {bubbles: true}));
  }, value);
}
async function answer(page, id, a, b, relation, reason) {
  await page.locator('#case-select').selectOption(id);
  await setSlider(page, '#slider-a', a);
  await setSlider(page, '#slider-b', b);
  await page.locator('#check-positions').click();
  await page.locator(`input[name="relation"][value="${relation}"]`).check();
  await page.locator(`input[name="reason"][value="${reason}"]`).check();
  await page.locator('#check-comparison').click();
}

test('先定位两个负数，再比较并解释；错误反馈允许修正', async ({page}) => {
  await page.goto(topic);
  await expect(page.locator('#prompt')).toContainText('A = −3、B = −1');
  await expect(page.locator('#check-comparison')).toBeDisabled();
  await page.locator('#check-positions').click();
  await expect(page.locator('#position-feedback')).toContainText('A、B 的位置还不对');
  await setSlider(page, '#slider-a', -3);
  await setSlider(page, '#slider-b', -1);
  await expect(page.locator('#axis')).toHaveAttribute('aria-label', /A 在 −3，B 在 −1；A 在 B 左边/);
  await page.locator('#check-positions').click();
  await expect(page.locator('#position-feedback')).toContainText('两个点都放对了');
  await page.locator('input[name="relation"][value="greater"]').check();
  await page.locator('input[name="reason"][value="right"]').check();
  await page.locator('#check-comparison').click();
  await expect(page.locator('#comparison-feedback')).toContainText('负数也遵循');
  await page.locator('input[name="relation"][value="less"]').check();
  await page.locator('#check-comparison').click();
  await expect(page.locator('#comparison-feedback')).toContainText('大小关系正确');
  await page.locator('input[name="reason"][value="left"]').check();
  await page.locator('#check-comparison').click();
  await expect(page.locator('#comparison-feedback')).toContainText('−3 < −1');
  await expect(page.locator('#progress-detail')).toContainText('两个负数 1/1');
});

test('跨零与异写同值完成后写入进度，目录显示徽章', async ({page}) => {
  await page.goto(topic);
  await answer(page, 'negative-decimals', -1.5, -0.5, 'less', 'left');
  await answer(page, 'cross-zero', -0.75, 0.5, 'less', 'left');
  await answer(page, 'equal-negative', -0.5, -0.5, 'equal', 'same');
  await expect(page.locator('#comparison-feedback')).toContainText('−1/2 = −0.5');
  await expect(page.locator('#axis')).toHaveAttribute('aria-label', /两点在同一刻度/);
  await expect(page.locator('#learning-progress')).toContainText('已保存');
  const stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey);
  expect(stored['middle:rational-order-number-line']).toBeTruthy();
  await page.reload();
  await expect(page.locator('#progress-detail')).toContainText('本机已有完成记录');
  await page.getByRole('link', {name: /返回初中数学目录/}).click();
  await expect(page.locator('a[href="rational-order-number-line.html"] .progress-badge')).toHaveText('✓');
});

test('查看示例不计数，存储失败可重试', async ({page}) => {
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
  await expect(page.locator('#solution')).toContainText('本题不计独立完成');
  await answer(page, 'negative-decimals', -1.5, -0.5, 'less', 'left');
  await answer(page, 'cross-zero', -0.75, 0.5, 'less', 'left');
  await answer(page, 'equal-positive', 0.5, 0.5, 'equal', 'same');
  await expect(page.locator('#learning-progress')).toContainText('暂未保存');
  await expect(page.locator('#math-progress-save-notice')).toContainText('暂未保存');
  await page.evaluate(() => window.restoreMathWrites());
  await page.getByRole('button', {name: '重试保存'}).click();
  await expect(page.locator('#learning-progress')).toContainText('已保存');
});

test('320px 键盘、文件直开和分数刻度一致', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.goto(topic);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.locator('#case-select').selectOption('equal-negative');
  await page.locator('#slider-a').focus();
  await page.keyboard.press('Home');
  for (let i = 0; i < 14; i++) await page.keyboard.press('ArrowRight');
  await page.locator('#slider-b').focus();
  await page.keyboard.press('Home');
  for (let i = 0; i < 14; i++) await page.keyboard.press('ArrowRight');
  await expect(page.locator('#value-a')).toHaveText('A 当前在 −0.5');
  await page.locator('#check-positions').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#position-feedback')).toContainText('两个点都放对了');
  await page.locator('input[name="relation"][value="equal"]').focus();
  await page.keyboard.press('Space');
  await page.locator('input[name="reason"][value="same"]').focus();
  await page.keyboard.press('Space');
  await page.locator('#check-comparison').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#comparison-feedback')).toContainText('−1/2 = −0.5');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网页面不访问本机文件');
  await page.goto(pathToFileURL(resolve(__dirname, '../../math/middle/rational-order-number-line.html')).href);
  await answer(page, 'cross-zero', -0.75, 0.5, 'less', 'left');
  await expect(page.locator('#comparison-feedback')).toContainText('−3/4 < 1/2');
});
