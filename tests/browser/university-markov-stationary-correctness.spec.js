const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');
const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/uni/stochastic-process.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/uni/stochastic-process.html';

test('矩阵的平稳分布、单轨迹频率与距离一致', async ({page}) => {
  await page.goto(topic);
  await page.evaluate(() => { const values = [0.7, 0.8, 0.1, 0.7, 0.8]; let i = 0; Math.random = () => values[i++ % values.length]; });
  const rows = await page.locator('#probTable tbody tr').evaluateAll(rs => rs.map(r => [...r.querySelectorAll('td')].map(td => Number(td.textContent))));
  const pi = [24/61, 22/61, 15/61];
  expect(pi.reduce((a,b) => a+b, 0)).toBeCloseTo(1, 14);
  for (let j=0; j<3; j++) expect(pi.reduce((a,x,i) => a+x*rows[i][j], 0)).toBeCloseTo(pi[j], 14);
  await expect(page.locator('#stationaryDist')).toContainText('(24/61, 22/61, 15/61)');
  await expect(page.locator('#freqA')).toHaveText('1.000');
  for (let i=0; i<5; i++) await page.locator('#btnStep').click();
  await expect(page.locator('#stepCnt')).toHaveText('5');
  await expect(page.locator('#freqA')).toHaveText('0.333');
  await expect(page.locator('#freqB')).toHaveText('0.333');
  await expect(page.locator('#freqC')).toHaveText('0.333');
  const expected = Math.hypot(1/3-pi[0], 1/3-pi[1], 1/3-pi[2]).toFixed(3);
  await expect(page.locator('#convErr')).toHaveText(expected);
  await expect(page.locator('#sec-markov')).toContainText('包含初始状态');
  await expect(page.locator('#sec-markov')).toContainText('不一定逐步减小');
  await expect(page.locator('#sec-markov')).toContainText('时刻分布在 (1,0) 和 (0,1) 之间交替');
  await page.locator('#btnReset').click();
  await expect(page.locator('#stepCnt')).toHaveText('0');
  await expect(page.locator('#convErr')).toHaveText('—');
});

test('练习反馈说明不变性不保证收敛', async ({page}) => {
  await page.goto(topic);
  await page.locator('[data-tab="quiz"]').click();
  await page.locator('.quiz-opt').nth(1).click();
  await expect(page.locator('.quiz-q')).toContainText('概率分布 π', {timeout: 5000});
  await page.locator('.quiz-opt').nth(2).click();
  await expect(page.locator('#fb')).toContainText('仅有不变性并不保证');
  await expect(page.locator('#fb')).toContainText('两状态交替链');
});

test('320px、文件直开和发布子路径能显示修正内容', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '本地文件及构建路径检查');
  await page.setViewportSize({width: 320,height: 700});
  await page.goto(pathToFileURL(resolve('math/uni/stochastic-process.html')).href);
  await expect(page.locator('#stationaryDist')).toContainText('24/61');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.locator('#btnStep').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#stepCnt')).toHaveText('1');
  const release = await startReleaseServer();
  try {
    await page.goto(new URL('math/uni/stochastic-process.html',release.base).href);
    await expect(page.locator('#stationaryDist')).toContainText('24/61');
    await page.locator('#btnStep').click();
    await expect(page.locator('#stepCnt')).toHaveText('1');
  } finally { await release.close(); }
});
