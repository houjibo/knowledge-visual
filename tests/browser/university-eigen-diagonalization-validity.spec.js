const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');
const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/uni/eigenvalues.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/uni/eigenvalues.html';

async function openDiag(page, url=topic) {
  await page.goto(url);
  await page.locator('[data-tab="diag"]').click();
}

async function matrix(page, values) {
  for (const [index,id] of ['diag-a','diag-b','diag-c','diag-d'].entries())
    await page.locator('#'+id).fill(String(values[index]));
  await page.getByRole('button', {name:'计算对角化'}).click();
}

async function phase(page, value) {
  await page.locator('#diagSlider').evaluate((slider, next) => {
    slider.value = String(next);
    slider.dispatchEvent(new Event('input', {bubbles:true}));
  }, value);
}

function closeMatrix(actual, expected, tolerance=1e-8) {
  for (let i=0;i<4;i++) expect(Math.abs(actual[i]-expected[i])).toBeLessThan(tolerance);
}

test('缺陷矩阵不伪称可对角化，标量重根使用独立标准基', async ({page}) => {
  const errors=[];
  page.on('pageerror', error => errors.push(error.message));
  await openDiag(page);
  await expect(page.locator('#diagPlay')).toBeDisabled();
  await matrix(page, [1,1,0,1]);
  await expect(page.locator('#diagInfo')).toContainText('只有一条独立特征线');
  await expect(page.locator('#diagInfo')).not.toContainText('数值核验通过');
  await expect(page.locator('#diagPlay')).toBeDisabled();
  await expect(page.locator('#diagSlider')).toBeDisabled();
  await page.evaluate(() => setDiagPhase(100));
  expect(await page.evaluate(() => diagFrameMatrix)).toEqual([1,0,0,1]);
  expect(errors).toEqual([]);

  await page.locator('[data-tab="calc"]').click();
  for (const [index,id] of ['calc-a','calc-b','calc-c','calc-d'].entries())
    await page.locator('#'+id).fill(String([1,1,0,1][index]));
  await page.getByRole('button', {name:'逐步计算'}).click();
  for (let i=0;i<4;i++) await page.getByRole('button', {name:'下一步 ▶'}).click();
  await expect(page.locator('#calcDetailText')).toContainText('只有一条独立特征线');
  await page.locator('[data-tab="diag"]').click();

  await matrix(page, [2,0,0,2]);
  await expect(page.locator('#diagInfo')).toContainText('重根标量矩阵');
  await expect(page.locator('#diagInfo')).toContainText('数值核验通过');
  await expect(page.locator('#diagPlay')).toBeEnabled();
  expect(await page.evaluate(() => diagData.P)).toEqual([1,0,0,1]);
  await phase(page, 100);
  closeMatrix(await page.evaluate(() => diagFrameMatrix), [2,0,0,2]);
  await matrix(page, [0,0,0,0]);
  await expect(page.locator('#diagInfo')).toContainText('重根标量矩阵');
  await phase(page, 100);
  closeMatrix(await page.evaluate(() => diagFrameMatrix), [0,0,0,0]);
  expect(errors).toEqual([]);
});

test('不同实根动画依次应用 P⁻¹、Λ、P，修改输入撤销旧验证', async ({page}) => {
  const errors=[];
  page.on('pageerror', error => errors.push(error.message));
  await openDiag(page);
  await matrix(page, [4,2,1,3]);
  await expect(page.locator('#diagInfo')).toContainText('数值核验通过');
  const data = await page.evaluate(() => ({P:diagData.P, Pinv:diagData.Pinv, Lambda:diagData.Lambda, A:diagData.A}));
  for (const [percent, expected, label] of [
    [0,[1,0,0,1],'阶段1：P⁻¹'],
    [33,data.Pinv,'阶段1：P⁻¹'],
    [66,[data.Lambda[0]*data.Pinv[0],data.Lambda[0]*data.Pinv[1],data.Lambda[3]*data.Pinv[2],data.Lambda[3]*data.Pinv[3]],'阶段2：ΛP⁻¹'],
    [100,data.A,'阶段3：PΛP⁻¹']
  ]) {
    await phase(page, percent);
    await expect(page.locator('#diagPhase')).toContainText(label);
    closeMatrix(await page.evaluate(() => diagFrameMatrix), expected);
  }
  await page.locator('#diagPlay').click();
  await expect.poll(() => page.evaluate(() => diagAnimPhase)).toBeGreaterThan(0);
  await page.locator('#diag-b').fill('3');
  await expect(page.locator('#diagResult')).toBeHidden();
  await expect(page.locator('#diagPlay')).toBeDisabled();
  await expect(page.locator('#diagSlider')).toBeDisabled();
  expect(await page.evaluate(() => diagTimer)).toBeNull();
  expect(await page.evaluate(() => diagFrameMatrix)).toEqual([1,0,0,1]);
  await page.locator('#diag-a').fill('');
  await expect(page.locator('#diag-a')).toHaveAttribute('aria-invalid','true');
  await expect(page.locator('#diagInfo')).toContainText('矩阵输入无效');
  expect(errors).toEqual([]);
});

test('复根、零根、近重根及无效输入不会产生虚假验证', async ({page}) => {
  await openDiag(page);
  await matrix(page, [0,-1,1,0]);
  await expect(page.locator('#diagInfo')).toContainText('共轭复特征值');
  await expect(page.locator('#diagPlay')).toBeDisabled();
  await matrix(page, [2,0,0,0]);
  await expect(page.locator('#diagInfo')).toContainText('数值核验通过');
  await phase(page, 100);
  closeMatrix(await page.evaluate(() => diagFrameMatrix), [2,0,0,0]);
  await matrix(page, [1,1,0,1.000000000001]);
  await expect(page.locator('#diagInfo')).toContainText('当前数值精度不足');
  await expect(page.locator('#diagInfo')).not.toContainText('不能在实数域对角化');
  await expect(page.locator('#diagPlay')).toBeDisabled();
  await page.locator('#diag-a').fill('');
  await expect(page.locator('#diag-a')).toHaveAttribute('aria-invalid','true');
  await expect(page.locator('#diagInfo')).toContainText('矩阵输入无效');
  await page.locator('#diag-a').fill('101');
  await expect(page.locator('#diagInfo')).toContainText('矩阵输入无效');
  await page.locator('#diag-a').fill('4');
  await matrix(page, [4,2,1,3]);
  await expect(page.locator('#diagInfo')).toContainText('数值核验通过');
});

test('320px、键盘、静态文件与发布子路径可验证和取消动画', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '本地文件与构建路径检查');
  await page.setViewportSize({width:320,height:700});
  await openDiag(page,pathToFileURL(resolve('math/uni/eigenvalues.html')).href);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.getByRole('button', {name:'计算对角化'}).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#diagPlay')).toBeEnabled();
  await page.locator('#diagSlider').focus();
  await page.keyboard.press('End');
  await expect(page.locator('#diagSlider')).toBeFocused();
  await expect(page.locator('#diagPhase')).toContainText('阶段3：PΛP⁻¹');
  const release=await startReleaseServer();
  try {
    await openDiag(page,new URL('math/uni/eigenvalues.html',release.base).href);
    await matrix(page,[1,1,0,1]);
    await expect(page.locator('#diagInfo')).toContainText('只有一条独立特征线');
    await matrix(page,[2,0,0,2]);
    await expect(page.locator('#diagInfo')).toContainText('数值核验通过');
  } finally {await release.close();}
});
