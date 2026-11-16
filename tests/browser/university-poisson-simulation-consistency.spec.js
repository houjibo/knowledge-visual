const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');
const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/uni/stochastic-process.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/uni/stochastic-process.html';
async function open(page,url=topic){ await page.goto(url); await page.locator('[data-tab="poisson"]').click(); }

test('样本间隔、强度切换和理论值一致', async ({page}) => {
  await open(page);
  await expect(page.locator('#pCount')).toHaveText('—');
  await expect(page.locator('#pTheory')).toHaveText('90.0');
  await page.evaluate(() => { const values=[Math.exp(-15),Math.exp(-24),Math.exp(-57)]; let i=0; Math.random=()=>values[i++]; });
  await page.locator('#btnRunPoisson').click();
  await expect(page.locator('#pCount')).toHaveText('2');
  await expect(page.locator('#pMeanInt')).toHaveText('8.00');
  await expect(page.locator('#poissonStatus')).toContainText('已生成 30 秒样本');
  await expect(page.locator('#sec-poisson')).toContainText('不含起点到首次到达');
  await expect(page.locator('#sec-poisson')).toContainText('每次到达相互独立');
  await page.locator('#lambda').fill('2');
  await expect(page.locator('#pCount')).toHaveText('—');
  await expect(page.locator('#pMeanInt')).toHaveText('—');
  await expect(page.locator('#pTheory')).toHaveText('60.0');
  await expect(page.locator('#pTheoryInt')).toHaveText('0.50');
  await expect(page.locator('#poissonStatus')).toContainText('旧样本已清除');
  await page.locator('#btnResetPoisson').click();
  await expect(page.locator('#pCount')).toHaveText('—');
  await expect(page.locator('#pTheory')).toHaveText('60.0');
});

test('零事件样本与未生成区分且零随机值不会卡住', async ({page}) => {
  await open(page);
  const before=await page.locator('#cvPoisson').evaluate(c=>c.toDataURL());
  await page.evaluate(()=>{ Math.random=()=>0; });
  await page.locator('#btnRunPoisson').click();
  await expect(page.locator('#pCount')).toHaveText('0');
  await expect(page.locator('#pMeanInt')).toHaveText('—');
  await expect(page.locator('#poissonStatus')).toContainText('已生成');
  expect(await page.locator('#cvPoisson').evaluate(c=>c.toDataURL())).not.toEqual(before);
  await page.locator('#btnResetPoisson').click();
  await expect(page.locator('#pCount')).toHaveText('—');
});

test('超出事件上限时丢弃不完整结果且可重新运行', async ({page}) => {
  await open(page);
  await page.evaluate(()=>{ Math.random=()=>0.999999; });
  await page.locator('#btnRunPoisson').click();
  await expect(page.locator('#pCount')).toHaveText('—');
  await expect(page.locator('#pMeanInt')).toHaveText('—');
  await expect(page.locator('#poissonStatus')).toContainText('未生成完整样本');
  await page.evaluate(()=>{ Math.random=()=>0; });
  await page.locator('#btnRunPoisson').click();
  await expect(page.locator('#pCount')).toHaveText('0');
});

test('320px、键盘、文件直开及发布子路径', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL,'本地文件及构建路径检查');
  await page.setViewportSize({width:320,height:700});
  await open(page,pathToFileURL(resolve('math/uni/stochastic-process.html')).href);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.evaluate(()=>{ Math.random=()=>0; });
  await page.locator('#btnRunPoisson').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#pCount')).toHaveText('0');
  const release=await startReleaseServer();
  try {
    await open(page,new URL('math/uni/stochastic-process.html',release.base).href);
    await page.evaluate(()=>{ Math.random=()=>0; });
    await page.locator('#btnRunPoisson').click();
    await expect(page.locator('#pCount')).toHaveText('0');
  } finally { await release.close(); }
});
