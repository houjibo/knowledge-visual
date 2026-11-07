const {test, expect} = require('@playwright/test');
const url = '/math/middle/probability-intro.html';
async function chart(page) {
  return page.evaluate(() => {
    const p = CanvasRenderingContext2D.prototype, old = {arc: p.arc, fillText: p.fillText}, points = [], labels = [];
    p.arc = function(x, y, r, ...rest) { if (r === 5) points.push([x,y]); return old.arc.call(this,x,y,r,...rest); };
    p.fillText = function(text, ...rest) { labels.push(String(text)); return old.fillText.call(this,text,...rest); };
    try { draw(); return {points,labels}; } finally { Object.assign(p, old); }
  });
}
test('每次改变球数开始新实验，读数与画布频率同步', async ({page}) => {
  await page.goto(url);
  const visual = page.getByRole('region', {name:'实验图表，可左右滚动'});
  const dimensions = await visual.evaluate(el => ({viewport: el.clientWidth, content: el.scrollWidth, page: document.documentElement.scrollWidth, screen: window.innerWidth}));
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.screen);
  if (dimensions.viewport < 640) {
    expect(dimensions.content).toBeGreaterThan(dimensions.viewport);
    await visual.evaluate(el => { el.scrollLeft = el.scrollWidth; });
    expect(await visual.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
  }
  const red = page.getByLabel('红球个数'), blue = page.getByLabel('蓝球个数');
  await expect(page.locator('#infoTheory')).toHaveText('3/5 = 0.600');
  await page.evaluate(() => { Math.random = () => 0.2; });
  await page.locator('#btnDraw1').click();
  await expect(page.locator('#infoFreq')).toHaveText('1.000');
  await expect(page.locator('#experimentStatus')).toContainText('第 1 次摸出红球');
  let graph = await chart(page);
  expect(graph.points).toEqual([[386,100]]);
  expect(graph.labels).toEqual(expect.arrayContaining(['0','25','50']));
  await page.evaluate(() => { Math.random = () => 0.9; });
  await page.locator('#btnDraw1').click();
  await expect(page.locator('#infoRedN')).toHaveText('1 次');
  await expect(page.locator('#infoFreq')).toHaveText('0.500');
  graph = await chart(page); expect(graph.points).toEqual([[392,250]]);
  await red.fill('8');
  await expect(page.locator('#experimentStatus')).toContainText('已清空上一轮结果');
  await expect(page.locator('#infoN')).toHaveText('0 次');
  await expect(page.locator('#infoTheory')).toHaveText('8/10 = 0.800');
  await expect(page.locator('#infoFreq')).toHaveText('—');
  await expect(page.locator('#simCanvas')).toHaveAttribute('aria-label', /尚未摸球/);
  await page.evaluate(() => { Math.random = () => 0.2; });
  await page.locator('#btnDraw50').click();
  await expect(page.locator('#infoN')).toHaveText('50 次');
  await expect(page.locator('#infoRedN')).toHaveText('50 次');
  await page.locator('#btnDraw50').click(); await page.locator('#btnDraw1').click();
  graph = await chart(page);
  expect(graph.points).toEqual([[680,100]]);
  expect(graph.labels).toEqual(expect.arrayContaining(['101','51']));
  await blue.focus(); await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#infoTheory')).toHaveText('8/9 = 0.889');
  await expect(page.locator('#infoN')).toHaveText('0 次');
  await expect(blue).toHaveValue('1');
  await page.locator('#btnDraw1').click(); await page.locator('#btnReset').click();
  await expect(page.locator('#infoN')).toHaveText('0 次');
  await expect(red).toHaveValue('8'); await expect(blue).toHaveValue('1');
  await expect(page.locator('#experimentStatus')).toContainText('球数保持不变');
});
