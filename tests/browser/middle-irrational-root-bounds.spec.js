const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/middle/irrational-root-bounds.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/middle/irrational-root-bounds.html';

async function selectNumber(page, n) {
  await page.locator('#radicand').fill(String(n));
  await page.locator('#number-form button').click();
}
async function complete(page, n, whole, tenth) {
  await selectNumber(page, n);
  await page.locator('#whole-answer').fill(String(whole));
  await page.locator('#whole-submit').click();
  await page.locator('#tenth-answer').fill(tenth);
  await page.locator('#tenth-submit').click();
  await page.locator('#reason-options input[value="square-monotone"]').check();
  await page.locator('#reason-submit').click();
  await page.locator('#calculator-input').fill(String(n));
  await page.locator('#calculator-submit').click();
}

test('自选 √50 后候选正方形与数轴同步，非法面积不替换任务', async ({page}) => {
  await page.goto(topic);
  await expect(page.locator('#line-heading')).toHaveText('0—2 数轴');
  await expect(page.locator('#candidate')).toHaveAttribute('max', '2');
  expect(Number(await page.locator('#target-square').getAttribute('width'))).toBeGreaterThan(140);
  await selectNumber(page, 50);
  await expect(page.locator('#line-heading')).toHaveText('0—8 数轴');
  await expect(page.locator('#candidate')).toHaveAttribute('max', '8');
  await page.locator('#candidate').fill('7');
  await expect(page.locator('#candidate-feedback')).toContainText('7.0²=49.00 < 50');
  const smaller = Number(await page.locator('#candidate-square').getAttribute('width'));
  await page.locator('#candidate').fill('7.1');
  await expect(page.locator('#candidate-feedback')).toContainText('7.1²=50.41 > 50');
  const larger = Number(await page.locator('#candidate-square').getAttribute('width'));
  expect(larger).toBeGreaterThan(smaller);
  await expect(page.locator('#number-line')).toHaveAttribute('aria-label', /候选点 7.1/);
  await expect(page.locator('#target-point')).toBeHidden();
  for (const input of ['49', '100', '2.5', 'abc']) {
    await page.locator('#radicand').fill(input);
    await page.locator('#number-form button').click();
    await expect(page.locator('#number-feedback')).toHaveClass(/try/);
    await expect(page.locator('#current-task')).toHaveText('当前任务：√50');
  }
});

test('√2 先整数再十分位，理由和计算器均可纠错', async ({page}) => {
  await page.goto(topic);
  await expect(page.locator('#tenth-answer')).toBeDisabled();
  await expect(page.locator('#calculator-submit')).toBeDisabled();
  await page.locator('#whole-answer').fill('2');
  await page.locator('#whole-submit').click();
  await expect(page.locator('#whole-feedback')).toContainText('没有严格夹住 2');
  await page.locator('#whole-answer').fill('1');
  await page.locator('#whole-answer').press('Enter');
  await expect(page.locator('#whole-feedback')).toContainText('1<√2<2');
  await page.locator('#tenth-answer').fill('1.5');
  await page.locator('#tenth-submit').click();
  await expect(page.locator('#tenth-feedback')).toContainText('没有严格夹住 2');
  await page.locator('#tenth-answer').fill('1.4');
  await page.locator('#tenth-submit').click();
  await expect(page.locator('#tenth-feedback')).toContainText('1.4<√2<1.5');
  await page.locator('#reason-options input[value="reverse"]').check();
  await page.locator('#reason-submit').click();
  await expect(page.locator('#reason-feedback')).toContainText('不会倒过来');
  await expect(page.locator('#calculator-submit')).toBeDisabled();
  await page.locator('#reason-options input[value="square-monotone"]').check();
  await page.locator('#reason-submit').click();
  await page.locator('#calculator-input').fill('3');
  await page.locator('#calculator-submit').click();
  await expect(page.locator('#calculator-feedback')).toContainText('当前题是 √2');
  await expect(page.locator('#target-point')).toBeHidden();
  await page.locator('#calculator-input').fill('2');
  await page.locator('#calculator-input').press('Enter');
  await expect(page.locator('#calculator-feedback')).toContainText('√2≈1.414214');
  await expect(page.locator('#target-point')).toBeVisible();
  await expect(page.locator('#progress-detail')).toContainText('1/3');
});

test('三段不同数值区间全部完成才保存，目录与搜索可找到主题', async ({page}) => {
  await page.goto(topic);
  await complete(page, 2, 1, '1.4');
  await complete(page, 50, 7, '7.0');
  await expect(page.locator('#progress-detail')).toContainText('2/3');
  await complete(page, 90, 9, '9.4');
  await expect(page.locator('#learning-progress')).toContainText('已保存');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('kv-math-progress-v2'))['middle:irrational-root-bounds']);
  expect(saved).toBeTruthy();
  await page.getByRole('link', {name: '返回初中数学目录'}).click();
  await expect(page.locator('a[href="irrational-root-bounds.html"] .progress-badge')).toHaveText('✓');
  await page.goto(process.env.KV_PUBLISHED_BASE_URL ? new URL('index.html', process.env.KV_PUBLISHED_BASE_URL).href : '/index.html');
  await page.locator('#site-query').fill('无理数夹逼');
  await expect(page.locator('#site-results')).toContainText('无理数夹逼实验室');
});

test('320px、键盘与切换题目重置步骤', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.goto(topic);
  await page.locator('#candidate').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#candidate-feedback')).toContainText('1.1²=1.21');
  await page.locator('#whole-answer').focus();
  await page.keyboard.type('1');
  await page.keyboard.press('Enter');
  await expect(page.locator('#tenth-answer')).toBeEnabled();
  await selectNumber(page, 10);
  await expect(page.locator('#tenth-answer')).toBeDisabled();
  await expect(page.locator('#whole-answer')).toHaveValue('');
  await expect(page.locator('#target-point')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('直接文件打开仍可完成自选较大平方根夹逼', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项不访问本机文件');
  await page.goto(pathToFileURL(resolve(__dirname, '../../math/middle/irrational-root-bounds.html')).href);
  await complete(page, 99, 9, '9.9');
  await expect(page.locator('#calculator-feedback')).toContainText('√99≈9.949874');
});

test('存储失败保留已完成三类并支持重试', async ({page}) => {
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
  await complete(page, 2, 1, '1.4');
  await complete(page, 50, 7, '7.0');
  await complete(page, 90, 9, '9.4');
  await expect(page.locator('#learning-progress')).toContainText('暂未保存');
  await page.evaluate(() => window.restoreMathWrites());
  await page.getByRole('button', {name: '重试保存'}).click();
  await expect(page.locator('#learning-progress')).toContainText('已保存');
});
