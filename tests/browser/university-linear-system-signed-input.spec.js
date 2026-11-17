const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');
const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/uni/linear-systems.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/uni/linear-systems.html';

async function setSystem(page) {
  const values = {a00:1,a01:0,a02:0,b0:1,a10:0,a11:1,a12:-1,b1:-1,a20:0,a21:0,a22:1,b2:3};
  for (const [id,value] of Object.entries(values)) await page.locator('#'+id).fill(String(value));
}

async function finish(page) {
  for (let i = 0; i < 20; i++) {
    if (await page.locator('#gaussResult').isVisible() && await page.locator('#gaussResult').textContent()) break;
    await page.locator('#gaussNext').click();
  }
}

test('有符号系数的预览、增广矩阵和唯一解一致', async ({page}) => {
  await page.goto(topic);
  await expect(page.locator('#equation1')).toHaveText('2x + 4y + 1z = 4');
  await setSystem(page);
  await expect(page.locator('#equation0')).toHaveText('1x + 0y + 0z = 1');
  await expect(page.locator('#equation1')).toHaveText('0x + 1y − 1z = -1');
  await expect(page.locator('#equation2')).toHaveText('0x + 0y + 1z = 3');
  expect(await page.evaluate(() => buildAugMatrix())).toEqual([[1,0,0,1],[0,1,-1,-1],[0,0,1,3]]);
  await finish(page);
  await expect(page.locator('#gaussResult')).toContainText('x = 1, y = 2, z = 3');
  const input = await page.evaluate(() => readGaussInput());
  for (let i=0;i<3;i++) expect(input.A[i].reduce((sum,a,j)=>sum+a*[1,2,3][j],0)).toBe(input.b[i]);
});

test('无效与越界输入停止旧解，修复后从新系统重新开始', async ({page}) => {
  await page.goto(topic);
  await setSystem(page);
  await finish(page);
  await expect(page.locator('#gaussResult')).toContainText('唯一解');
  await page.locator('#a12').fill('');
  await expect(page.locator('#a12')).toHaveAttribute('aria-invalid','true');
  await expect(page.locator('#gaussNext')).toBeDisabled();
  await expect(page.locator('#gaussAuto')).toBeDisabled();
  await expect(page.locator('#gaussResult')).toBeEmpty();
  await expect(page.locator('#equation1')).toContainText('无效系数');
  await page.locator('#a12').fill('101');
  await expect(page.locator('#gaussInputStatus')).toContainText('输入无效');
  await page.locator('#a12').fill('-1');
  await expect(page.locator('#gaussNext')).toBeEnabled();
  await expect(page.locator('#gaussSteps .step')).toHaveCount(1);
  await finish(page);
  await expect(page.locator('#gaussResult')).toContainText('x = 1, y = 2, z = 3');
  await page.locator('#gaussAuto').click();
  await page.locator('#b1').fill('-2');
  await expect(page.locator('#gaussSteps .step')).toHaveCount(1);
  await expect(page.locator('#equation1')).toHaveText('0x + 1y − 1z = -2');
});

test('320px、键盘、文件直开和发布子路径仍能编辑与消元', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL,'本地文件与构建路径检查');
  await page.setViewportSize({width:320,height:700});
  await page.goto(pathToFileURL(resolve('math/uni/linear-systems.html')).href);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.locator('#a12').focus();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('-1');
  await expect(page.locator('#equation1')).toContainText('− 1z');
  const release=await startReleaseServer();
  try {
    await page.goto(new URL('math/uni/linear-systems.html',release.base).href);
    await setSystem(page);
    await finish(page);
    await expect(page.locator('#gaussResult')).toContainText('x = 1, y = 2, z = 3');
  } finally {await release.close();}
});
