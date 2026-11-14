const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/middle/algebraic-reasoning.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/middle/algebraic-reasoning.html';

async function fourDigit(page, digits, prediction) {
  for (const [id, digit] of [['a', digits[0]], ['b', digits[1]], ['c', digits[2]], ['d', digits[3]]]) {
    await page.locator(`#digit-${id}`).selectOption(String(digit));
  }
  await page.locator(`#div-predict-fieldset input[value="${prediction}"]`).check();
  await page.locator('#div-predict-submit').click();
  await page.locator('#div-split-fieldset input[value="correct"]').check();
  await page.locator('#div-split-submit').click();
  await page.locator('#div-reason-fieldset input[value="multiple"]').check();
  await page.locator('#div-reason-submit').click();
}
async function endingFive(page, a, square) {
  await page.locator('#square-a').selectOption(String(a));
  await page.locator('#square-predict').fill(String(square));
  await page.locator('#square-predict-submit').click();
  await page.locator('#square-split-fieldset input[value="correct"]').check();
  await page.locator('#square-split-submit').click();
  await page.locator('#square-reason-fieldset input[value="factor"]').check();
  await page.locator('#square-reason-submit').click();
}

test('两条推理链先预测、再给恒等式与理由，错误可逐步修正', async ({page}) => {
  await page.goto(topic);
  await expect(page.locator('#div-number')).toHaveText('1233');
  await expect(page.locator('.place .split')).toHaveCount(0);
  await page.locator('#div-predict-fieldset input[value="no"]').check();
  await page.locator('#div-predict-submit').click();
  await expect(page.locator('#div-predict-feedback')).toContainText('1+2+3+3=9');
  await expect(page.locator('#div-split-fieldset input[value="correct"]')).toBeDisabled();
  await page.locator('#div-predict-fieldset input[value="yes"]').check();
  await page.locator('#div-predict-submit').click();
  await expect(page.locator('#div-predict-feedback')).toContainText('1233能被 3 整除');
  await page.locator('#div-split-fieldset input[value="omit"]').check();
  await page.locator('#div-split-submit').click();
  await expect(page.locator('#div-split-feedback')).toContainText('丢掉了');
  await page.locator('#div-split-fieldset input[value="triple"]').check();
  await page.locator('#div-split-submit').click();
  await expect(page.locator('#div-split-feedback')).toContainText('不能把整个各位和再乘 3');
  await page.locator('#div-split-fieldset input[value="correct"]').check();
  await page.locator('#div-split-submit').click();
  await expect(page.locator('.place .split')).toHaveCount(4);
  await expect(page.locator('#place-grid')).toContainText('999a = 999');
  await page.locator('#div-reason-fieldset input[value="first-only"]').check();
  await page.locator('#div-reason-submit').click();
  await expect(page.locator('#div-reason-feedback')).toContainText('剩下的正是各位数字和');
  await page.locator('#div-reason-fieldset input[value="multiple"]').check();
  await page.locator('#div-reason-submit').click();
  await expect(page.locator('#div-conclusion')).toContainText('1233 = 1224 + 9');
  await expect(page.locator('#progress-detail')).toContainText('四位数两类 1/2');

  await page.locator('#square-predict').fill('625');
  await page.locator('#square-predict-submit').click();
  await expect(page.locator('#square-predict-feedback')).toContainText('一块大正方形、两个长条');
  await expect(page.locator('#square-breakdown')).toBeHidden();
  await page.locator('#square-predict').fill('1225');
  await page.locator('#square-predict').press('Enter');
  await page.locator('#square-split-fieldset input[value="no-strips"]').check();
  await page.locator('#square-split-submit').click();
  await expect(page.locator('#square-split-feedback')).toContainText('少算了两块');
  await page.locator('#square-split-fieldset input[value="one-strip"]').check();
  await page.locator('#square-split-submit').click();
  await expect(page.locator('#square-split-feedback')).toContainText('只算了一块');
  await page.locator('#square-split-fieldset input[value="correct"]').check();
  await page.locator('#square-split-submit').click();
  await expect(page.locator('#square-breakdown')).toHaveText('35² = 900 + 150 + 150 + 25 = 1225。');
  await page.locator('#square-reason-fieldset input[value="wrong-factor"]').check();
  await page.locator('#square-reason-submit').click();
  await expect(page.locator('#square-reason-feedback')).toContainText('没有额外的 1');
  await page.locator('#square-reason-fieldset input[value="factor"]').check();
  await page.locator('#square-reason-submit').click();
  await expect(page.locator('#square-conclusion')).toContainText('3×4 个整百加 25');
  await expect(page.locator('#progress-detail')).toContainText('平方两类 1/2');
});

test('示例不计完成，四类独立作答后保存且目录徽章一致', async ({page}) => {
  await page.goto(topic);
  await page.locator('#div-example').click();
  await page.locator('#square-example').click();
  await expect(page.locator('#div-example-text')).toContainText('不计独立完成');
  await fourDigit(page, [1, 2, 3, 3], 'yes');
  await endingFive(page, 3, 1225);
  await expect(page.locator('#progress-detail')).toHaveText('四位数两类 0/2 · 平方两类 0/2');
  await fourDigit(page, [1, 2, 4, 2], 'yes');
  await fourDigit(page, [1, 2, 3, 4], 'no');
  await endingFive(page, 1, 225);
  await expect(page.locator('#progress-detail')).toHaveText('四位数两类 2/2 · 平方两类 1/2');
  await endingFive(page, 7, 5625);
  await expect(page.locator('#learning-progress')).toContainText('已保存');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('kv-math-progress-v2'))['middle:algebraic-reasoning']);
  expect(stored).toBeTruthy();
  await page.reload();
  await expect(page.locator('#progress-detail')).toContainText('本机已有完成记录');
  await page.getByRole('link', {name: /返回初中数学目录/}).click();
  await expect(page.locator('a[href="algebraic-reasoning.html"] .progress-badge')).toHaveText('✓');
});

test('按比例面积图、320px 与键盘操作可用，数字切换清理当前步骤', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.goto(topic);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.locator('#square-a').selectOption('1');
  const small = Number(await page.locator('#square-big').getAttribute('width'));
  expect(small).toBeCloseTo(220 * 10 / 15, 6);
  await page.locator('#square-a').selectOption('9');
  const large = Number(await page.locator('#square-big').getAttribute('width'));
  expect(large).toBeCloseTo(220 * 90 / 95, 6);
  expect(large).toBeGreaterThan(small);
  await expect(page.locator('#square-diagram')).toHaveAttribute('aria-label', /边长为 95/);
  await page.locator('#div-predict-fieldset input[value="yes"]').focus();
  await page.keyboard.press('Space');
  await page.locator('#div-predict-submit').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#div-split-fieldset input[value="correct"]')).toBeEnabled();
  await page.locator('#digit-d').selectOption('4');
  await expect(page.locator('#div-split-fieldset input[value="correct"]')).toBeDisabled();
  await expect(page.locator('#div-predict-fieldset input:checked')).toHaveCount(0);
  await expect(page.locator('.place .split')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('文件直开仍能完成推理', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网页面不访问本机文件');
  const localUrl = pathToFileURL(resolve(__dirname, '../../math/middle/algebraic-reasoning.html')).href;
  await page.goto(localUrl);
  await fourDigit(page, [1, 2, 3, 4], 'no');
  await expect(page.locator('#div-conclusion')).toContainText('1234 = 1224 + 10');
  await endingFive(page, 9, 9025);
  await expect(page.locator('#square-conclusion')).toContainText('9×10 个整百加 25');
});

test('存储失败保留完成并允许重试', async ({page}) => {
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
  await fourDigit(page, [1, 2, 3, 3], 'yes');
  await fourDigit(page, [1, 2, 3, 4], 'no');
  await endingFive(page, 3, 1225);
  await endingFive(page, 7, 5625);
  await expect(page.locator('#learning-progress')).toContainText('暂未保存');
  await expect(page.locator('#math-progress-save-notice')).toContainText('暂未保存');
  await page.evaluate(() => window.restoreMathWrites());
  await page.getByRole('button', {name: '重试保存'}).click();
  await expect(page.locator('#learning-progress')).toContainText('已保存');
});
