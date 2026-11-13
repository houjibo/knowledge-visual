const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/middle/rational-numbers.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/middle/rational-numbers.html';
const progressKey = 'kv-math-progress-v2';

async function keypad(page, keys) {
  const labels = {'-': '−', '*': '×', '/': '÷'};
  for (const key of keys) {
    const label = labels[key] || key;
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    await page.locator('.calc-key').filter({hasText: new RegExp(`^${escaped}$`)}).click();
  }
}

test('temperature examples and absolute value stay within their visible scales', async ({page}) => {
  await page.goto(topic);
  const boiling = page.locator('.temp-example[data-temp="100"]');
  await boiling.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#tempSlider')).toHaveValue('100');
  await expect(page.locator('#tempDisplay')).toHaveText('+100°C');
  await expect(page.locator('#thermoFill')).toHaveCSS('height', '394px');
  await expect(page.locator('#thermoScale')).toContainText('+100°');
  await expect(page.locator('#tempDesc')).toContainText('标准大气压');
  await page.locator('#tempSlider').fill('0');
  await expect(page.locator('#tempDisplay')).toHaveText('0°C');
  await expect(page.locator('#thermoFill')).not.toHaveCSS('height', '0px');

  await page.getByRole('button', {name: /绝对值/}).click();
  await page.locator('#absInput').fill('-4');
  await expect(page.locator('#absFormula')).toContainText('= 4');
  await expect(page.locator('#absFeedback')).toContainText('左侧');
  const before = await page.locator('#absPoint').evaluate(el => el.style.left);
  await page.locator('#absInput').fill('20');
  await expect(page.locator('#absFeedback')).toContainText('图示保持');
  const after = await page.locator('#absPoint').evaluate(el => el.style.left);
  expect(after).toBe(before);
  await page.locator('#absInput').fill('0');
  await expect(page.locator('#absFormula')).toContainText('= 0');
  await expect(page.locator('#absFeedback')).toContainText('原点');
});

test('keypad handles negative numbers, priority, zero, division by zero and correction', async ({page}) => {
  await page.goto(topic);
  await page.getByRole('button', {name: /有理数运算/}).click();
  await keypad(page, ['-', '3', '+', '5', '=']);
  await expect(page.locator('#calcDisplay')).toContainText('= 2');
  await keypad(page, ['C', '(', '-', '2', ')', '*', '(', '-', '3', ')', '=']);
  await expect(page.locator('#calcDisplay')).toContainText('= 6');
  await expect(page.locator('#calcFeedback')).toContainText('结果为正');
  await keypad(page, ['C', '0', '*', '(', '-', '4', ')', '=']);
  await expect(page.locator('#calcDisplay')).toContainText('= 0');
  await expect(page.locator('#calcFeedback')).toContainText('既不是正数也不是负数');
  await keypad(page, ['C', '1', '/', '0', '=']);
  await expect(page.locator('#calcFeedback')).toContainText('除数不能为 0');
  await expect(page.locator('#calcDisplay')).not.toContainText('Infinity');
  await page.getByRole('button', {name: '退格'}).click();
  await keypad(page, ['2', '=']);
  await expect(page.locator('#calcDisplay')).toContainText('= 0.5');
});

test('distinct exploration and correct predictions control saved progress', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项不替换本机存储实现');
  await page.addInitScript(k => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === k) throw new Error('denied');
      return original.call(this, key, value);
    };
    window.restoreMathWrites = () => { Storage.prototype.setItem = original; };
  }, progressKey);
  await page.goto(topic);
  await page.getByRole('button', {name: /数轴探索/}).click();
  await page.getByRole('button', {name: '标出 +3'}).click({clickCount: 3});
  await page.getByRole('button', {name: '显示相反数'}).click();
  await page.getByRole('button', {name: /绝对值/}).click();
  await page.locator('#absInput').fill('2');
  await page.locator('#absInput').fill('2');
  await page.getByRole('button', {name: /有理数运算/}).click();
  await page.locator('#challengeOptions').getByRole('button', {name: '−2'}).click();
  await expect(page.locator('#challengeFeedback')).toContainText('再想一想');
  await page.locator('#challengeOptions').getByRole('button', {name: '2', exact: true}).click();
  await page.locator('#challengeNext').click();
  await page.locator('#challengeOptions').getByRole('button', {name: '6', exact: true}).click();
  await page.locator('#challengeNext').click();
  await page.locator('#challengeOptions').getByRole('button', {name: '0'}).click();
  expect(await page.evaluate(k => localStorage.getItem(k), progressKey)).toBeNull();

  await page.getByRole('button', {name: /数轴探索/}).click();
  await page.getByRole('button', {name: '标出 -3'}).click();
  await page.getByRole('button', {name: '标出 +1.5'}).click();
  await page.getByRole('button', {name: /绝对值/}).click();
  await page.locator('#absInput').fill('-2');
  await page.locator('#absInput').fill('0');
  await expect(page.locator('#math-progress-save-notice')).toContainText('暂未保存');
  await page.evaluate(() => window.restoreMathWrites());
  await page.getByRole('button', {name: '重试保存'}).click();
  await expect(page.locator('#math-progress-save-notice')).toContainText('已保存');
  const stored = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), progressKey);
  expect(stored['middle:rational-numbers']).toBeTruthy();
});

test('320px and local file keep the controls and feedback usable', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(topic);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.getByRole('button', {name: /绝对值/}).click();
  for (const value of ['-10', '10']) {
    await page.locator('#absInput').fill(value);
    await expect.poll(async () => {
      const visual = await page.locator('#absVisual').boundingBox();
      const point = await page.locator('#absPoint').boundingBox();
      return point.x >= visual.x - 1 && point.x + point.width <= visual.x + visual.width + 1;
    }).toBe(true);
  }
  await page.getByRole('button', {name: /有理数运算/}).focus();
  await page.keyboard.press('Enter');
  await keypad(page, ['1', '/', '3', '=']);
  await expect(page.locator('#calcDisplay')).toContainText('≈ 0.333333');
  await expect(page.locator('#calcFeedback')).toContainText('近似');
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网页面不访问本机文件');
  const localUrl = pathToFileURL(resolve(__dirname, '../../math/middle/rational-numbers.html')).href;
  await page.goto(localUrl);
  await page.getByRole('button', {name: /有理数运算/}).click();
  await keypad(page, ['-', '3', '+', '5', '=']);
  await expect(page.locator('#calcDisplay')).toContainText('= 2');
});
