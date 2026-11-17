const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/high/logic-conditions.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/high/logic-conditions.html';

async function answer(page, forward, reverse) {
  await page.locator(`input[name="forward"][value="${forward}"]`).check();
  await page.locator(`input[name="reverse"][value="${reverse}"]`).check();
  await page.getByRole('button', {name: '核对判断并查看证据'}).click();
}

test('性质命题先错后改，逆向反例和必要／充分关系准确', async ({page}) => {
  await page.goto(topic);
  await page.locator('#presets button[data-preset="property"]').click();
  await answer(page, 'yes', 'yes');
  await expect(page.locator('#feedback')).toContainText('Q⇒P 的方向需重判');
  await expect(page.locator('#result')).toBeHidden();
  await answer(page, 'yes', 'no');
  await expect(page.locator('#result')).toContainText('3 满足前件却不满足后件，是反例');
  await expect(page.locator('#result')).toContainText('P 是 Q 的充分条件；P 不是 Q 的必要条件');
  await expect(page.locator('#result')).toContainText('n=6k');
  await expect(page.locator('#progress-status')).toContainText('1 / 3');
  await page.locator('input[name="reverse"][value="yes"]').check();
  await expect(page.locator('#result')).toBeHidden();
});

test('判定、定义与性质三个实例答对才记完成；手改条件失去实例资格', async ({page}) => {
  await page.goto(topic);
  await page.locator('#presets button[data-preset="criterion"]').click();
  await answer(page, 'yes', 'yes');
  await expect(page.locator('#result')).toContainText('判定条件在整数中也必要');
  await page.locator('#presets button[data-preset="definition"]').click();
  await answer(page, 'yes', 'yes');
  await expect(page.locator('#result')).toContainText('定义给出充要条件');
  await page.locator('#presets button[data-preset="property"]').click();
  await page.getByRole('button', {name: '讨论域成员 3', exact: true}).click();
  await expect(page.locator('#feedback')).toBeHidden();
  await expect(page.locator('#presets button[data-preset="property"]')).toHaveAttribute('aria-pressed', 'false');
  await answer(page, 'yes', 'no');
  await expect(page.locator('#progress-status')).toContainText('2 / 3');
  await page.locator('#presets button[data-preset="property"]').click();
  await answer(page, 'yes', 'no');
  await expect(page.locator('#progress-status')).toContainText('3 / 3');
  await expect(page.locator('#result')).toContainText('学习进度已保存');
  await page.goto(process.env.KV_PUBLISHED_BASE_URL ? new URL('math/high/index.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href : '/math/high/index.html');
  await expect(page.locator('a[href="logic-conditions.html"] .progress-badge')).toBeVisible();
});

test('空前件、同义条件与空讨论域使用当前域真值，320px 键盘不溢出', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.goto(topic);
  await page.getByRole('button', {name: '讨论域成员 -6', exact: true}).focus();
  await page.keyboard.press('Enter');
  for (const n of [-5, -4, -3, -2, -1, 0, 1, 2, 4, 5, 6]) {
    await page.getByRole('button', {name: `讨论域成员 ${n}`, exact: true}).click();
  }
  await expect(page.locator('#current-statement')).toContainText('U = {3}');
  await answer(page, 'yes', 'no');
  await expect(page.locator('#result')).toContainText('空前件');
  await page.locator('#condition-p').selectOption('even');
  await page.locator('#condition-q').selectOption('mult2');
  await expect(page.locator('#result')).toBeHidden();
  await answer(page, 'yes', 'yes');
  await expect(page.locator('#result')).toContainText('充要条件');
  await page.getByRole('button', {name: '讨论域成员 3', exact: true}).click();
  await answer(page, 'yes', 'yes');
  await expect(page.locator('#result')).toContainText('U=∅');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('进度保存失败提示可重试，原答题结果仍可查看', async ({page}) => {
  await page.addInitScript(() => {
    window.__allowProgressWrite = false;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'kv-math-progress-v2' && !window.__allowProgressWrite) throw new Error('blocked');
      return original.call(this, key, value);
    };
  });
  await page.goto(topic);
  for (const [preset, forward, reverse] of [['property', 'yes', 'no'], ['criterion', 'yes', 'yes'], ['definition', 'yes', 'yes']]) {
    await page.locator(`#presets button[data-preset="${preset}"]`).click();
    await answer(page, forward, reverse);
  }
  await expect(page.locator('#math-progress-save-notice')).toContainText('暂未保存');
  await expect(page.locator('#result')).toContainText('定义给出充要条件');
  await page.evaluate(() => { window.__allowProgressWrite = true; });
  await page.getByRole('button', {name: '重试保存'}).click();
  await expect(page.locator('#math-progress-save-notice')).toContainText('已保存');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('kv-math-progress-v2')));
  expect(stored['high:logic-conditions']).toBeTruthy();
});

test('直接文件与发布子路径可加载模型和页面', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网路径由上方共用用例验证');
  await page.goto(pathToFileURL(resolve(__dirname, '../../math/high/logic-conditions.html')).href);
  await page.locator('#presets button[data-preset="property"]').click();
  await answer(page, 'yes', 'no');
  await expect(page.locator('#result')).toContainText('3 满足前件');
  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('math/high/logic-conditions.html', release.base).href);
    expect(response.status()).toBe(200);
    await page.locator('#presets button[data-preset="property"]').click();
    await answer(page, 'yes', 'no');
    await expect(page.locator('#result')).toContainText('3 满足前件');
  } finally { await release.close(); }
});
