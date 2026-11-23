const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('chemistry/high/reaction-rate.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/chemistry/high/reaction-rate.html';

test('三个起点守恒且向同一非零动态平衡靠近', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({time: new Date('2026-01-01T00:00:00Z')});
  await page.goto(topic);
  await page.clock.pauseAt(new Date('2026-01-01T00:01:00Z'));
  await page.locator('.tab').nth(2).click();
  await expect(page.locator('#sec2')).toContainText('封闭恒容');
  await expect(page.locator('#sec2')).toContainText('模型相对量');
  const cases = [
    {index: 0, a: '1.000', b: '0.000', forward: '0.500', reverse: '0.000'},
    {index: 1, a: '0.000', b: '1.000', forward: '0.000', reverse: '0.200'},
    {index: 2, a: '0.500', b: '0.500', forward: '0.250', reverse: '0.100'}
  ];
  for (const initial of cases) {
    const button = page.locator('.eq-btn').nth(initial.index);
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#eqA')).toHaveText(initial.a);
    await expect(page.locator('#eqB')).toHaveText(initial.b);
    await expect(page.locator('#vForward')).toHaveText(initial.forward);
    await expect(page.locator('#vReverse')).toHaveText(initial.reverse);
    await page.clock.runFor(50);
    await page.clock.fastForward(16000);
    await expect(page.locator('#eqState')).toContainText('接近平衡');
    const values = await page.locator('#eqA, #eqB, #vForward, #vReverse').allTextContents();
    const [a, b, vf, vr] = values.map(Number);
    expect(a + b).toBeCloseTo(1, 2);
    expect(b / a).toBeCloseTo(2.5, 1);
    expect(vf).toBeGreaterThan(0);
    expect(vr).toBeGreaterThan(0);
    expect(vf).toBeCloseTo(vr, 2);
  }
  await page.locator('.eq-btn').nth(3).click();
  await expect(page.locator('#eqState')).toHaveText('未开始');
  await expect(page.locator('#eqA')).toHaveText('1.000');
  expect(errors).toEqual([]);
});

test('六类扰动的 Q/K、方向和新平衡份额一致', async ({page}) => {
  await page.goto(topic);
  await page.locator('.tab').nth(3).click();
  await expect(page.locator('#sec3')).toContainText('理想气体平衡商示意');
  const cases = [
    {index: 0, ratio: 4, direction: '逆向'},
    {index: 1, ratio: 0.25, direction: '正向'},
    {index: 2, ratio: 0.25, direction: '正向'},
    {index: 3, ratio: 4, direction: '逆向'},
    {index: 4, ratio: 0.763, direction: '正向'},
    {index: 5, ratio: 2.905, direction: '逆向'}
  ];
  for (const entry of cases) {
    await page.locator('.lechat-btn.reset').click();
    await page.locator('.lechat-btn').nth(entry.index).click();
    const ratio = Number(await page.locator('#lechatRatio').innerText());
    expect(ratio).toBeCloseTo(entry.ratio, 2);
    await expect(page.locator('#lechatResult')).toContainText(entry.direction);
    await expect(page.locator('#lechatPostRatio')).toHaveText('1.000');
    for (const id of ['lechatN2', 'lechatH2', 'lechatNH3']) {
      expect(Number(await page.locator(`#${id}`).innerText())).toBeGreaterThan(0);
    }
  }
  await page.locator('.lechat-btn.reset').click();
  for (const index of [4, 5, 2, 0, 3, 1]) {
    await page.locator('.lechat-btn').nth(index).click();
    await expect(page.locator('#lechatPostRatio')).toHaveText('1.000');
  }
  await page.locator('.lechat-btn.reset').click();
  await expect(page.locator('#lechatN2')).toHaveText('8.00');
  await expect(page.locator('#lechatH2')).toHaveText('24.00');
  await expect(page.locator('#lechatNH3')).toHaveText('12.00');
});

test('320px 键盘操作可读，文件直开与发布子路径加载模型', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网路径由上方共用用例验证');
  await page.clock.install({time: new Date('2026-01-01T00:00:00Z')});
  await page.setViewportSize({width: 320, height: 800});
  await page.goto(pathToFileURL(resolve(__dirname, '../../chemistry/high/reaction-rate.html')).href);
  await page.locator('.tab').nth(3).focus();
  await page.keyboard.press('Enter');
  const up = page.locator('.lechat-btn.press-up');
  await up.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#lechatResult')).toContainText('正向移动');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('chemistry/high/reaction-rate.html', release.base).href);
    expect(response.status()).toBe(200);
    await page.clock.pauseAt(new Date('2026-01-01T00:01:00Z'));
    await page.locator('.tab').nth(2).click();
    await page.locator('.eq-btn').nth(1).click();
    await expect(page.locator('#eqA')).toHaveText('0.000');
    await expect(page.locator('#vReverse')).toHaveText('0.200');
  } finally { await release.close(); }
});
