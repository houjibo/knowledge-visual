const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');
const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/uni/stochastic-process.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/uni/stochastic-process.html';

async function controlledPage(page, url = topic) {
  await page.addInitScript(() => {
    let pending = new Map(), next = 0;
    window.requestAnimationFrame = fn => { const id = ++next; pending.set(id, fn); return id; };
    window.cancelAnimationFrame = id => pending.delete(id);
    window.advanceBrownFrame = () => { const list = [...pending.values()]; pending.clear(); list.forEach(fn => fn(0)); };
  });
  await page.goto(url);
  await page.locator('[data-tab="brown"]').click();
  await page.evaluate(() => { let i = 0; Math.random = () => (i++ % 2 ? 0 : 1 - Math.exp(-0.5)); });
}

test('二维正态增量与径向期望随时间和尺度一致', async ({page}) => {
  await controlledPage(page);
  await page.locator('#btnBrownRun').click();
  await expect(page.locator('#bTime')).toHaveText('0.05');
  await expect(page.locator('#bMeanDist')).toHaveText((2 * Math.sqrt(0.1)).toFixed(2));
  await expect(page.locator('#bMaxDist')).toHaveText((2 * Math.sqrt(0.1)).toFixed(2));
  await expect(page.locator('#bTheoryDist')).toHaveText((2 * Math.sqrt(Math.PI * 0.05 / 2)).toFixed(2));
  await page.evaluate(() => window.advanceBrownFrame());
  await expect(page.locator('#bTime')).toHaveText('0.10');
  await expect(page.locator('#bMeanDist')).toHaveText((4 * Math.sqrt(0.1)).toFixed(2));
  await expect(page.locator('#bTheoryDist')).toHaveText((2 * Math.sqrt(Math.PI * 0.1 / 2)).toFixed(2));
  await page.locator('#sigma').fill('4');
  await expect(page.locator('#brownStatus')).toContainText('重置并暂停');
  for (const id of ['bTime','bMeanDist','bMaxDist','bTheoryDist']) await expect(page.locator('#'+id)).toHaveText('0.00');
  await page.evaluate(() => window.advanceBrownFrame());
  await expect(page.locator('#bTime')).toHaveText('0.00');
  await page.locator('#btnBrownRun').click();
  await expect(page.locator('#bMeanDist')).toHaveText((4 * Math.sqrt(0.1)).toFixed(2));
  await expect(page.locator('#bTheoryDist')).toHaveText((4 * Math.sqrt(Math.PI * 0.05 / 2)).toFixed(2));
  await page.locator('#nParticles').fill('2');
  await expect(page.locator('#bTime')).toHaveText('0.00');
  await expect(page.locator('#brownStatus')).toContainText('粒子数已更改');
  await expect(page.locator('#sec-brown')).toContainText('离散采样点');
  await expect(page.locator('#sec-brown')).toContainText('当前最大径向距离');
});

test('随机数为零时可以运行、暂停和重置', async ({page}) => {
  await controlledPage(page);
  await page.evaluate(() => { Math.random = () => 0; });
  await page.locator('#btnBrownRun').click();
  await expect(page.locator('#bTime')).toHaveText('0.05');
  await expect(page.locator('#bMeanDist')).toHaveText('0.00');
  await page.locator('#btnBrownPause').click();
  await page.evaluate(() => window.advanceBrownFrame());
  await expect(page.locator('#bTime')).toHaveText('0.05');
  await page.locator('#btnBrownReset').click();
  await expect(page.locator('#bTime')).toHaveText('0.00');
});

test('320px 文件直开、键盘和发布子路径', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '本地文件与构建路径检查');
  await page.setViewportSize({width:320, height:700});
  await controlledPage(page,pathToFileURL(resolve('math/uni/stochastic-process.html')).href);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.locator('#btnBrownRun').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#bTime')).toHaveText('0.05');
  const release = await startReleaseServer();
  try {
    await page.goto(new URL('math/uni/stochastic-process.html',release.base).href);
    await page.locator('[data-tab="brown"]').click();
    await page.locator('#btnBrownRun').click();
    await expect(page.locator('#bTheoryDist')).toHaveText((2 * Math.sqrt(Math.PI * 0.05 / 2)).toFixed(2));
  } finally { await release.close(); }
});
