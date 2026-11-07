const {test, expect} = require('@playwright/test');
const url = '/math/high/probability.html';

test('线段端点始终有效，长度变化清样，区间变化重算频率', async ({page}) => {
  await page.goto(url);
  const tab = page.getByRole('button',{name:'③ 几何概型'});
  await tab.focus(); await page.keyboard.press('Enter');
  const length = page.getByLabel('线段长度 L：');
  const start = page.getByLabel('子区间起点 a：');
  const end = page.getByLabel('子区间终点 b：');
  await start.fill('7'); await expect(end).toHaveValue('8');
  await length.fill('4');
  await expect(start).toHaveValue('3'); await expect(end).toHaveValue('4');
  await expect(start).toHaveAttribute('max','3'); await expect(end).toHaveAttribute('max','4');
  await expect(page.locator('#lineResult')).toContainText('0.2500');
  await end.fill('1'); await expect(start).toHaveValue('0');
  await length.fill('10');
  await expect(start).toHaveAttribute('max','9'); await expect(end).toHaveAttribute('max','10');
  await start.fill('9'); await expect(end).toHaveValue('10');
  await expect(page.locator('#lineResult')).toContainText('0.1000');
  await length.fill('8'); await start.fill('2'); await end.fill('5');
  await page.evaluate(() => { Math.random = () => 0.5; });
  await page.getByRole('button',{name:'📍 随机取点'}).click();
  await expect(page.locator('#lineStats')).toContainText('已取 1 点，区间内 1 点，频率 1.000');
  const location = await page.evaluate(() => {
    const p = CanvasRenderingContext2D.prototype, old = p.arc; let point;
    p.arc = function(x,y,r,...rest) { if (r===4) point=[x,y]; return old.call(this,x,y,r,...rest); };
    try { drawLine(); return point; } finally { p.arc=old; }
  });
  expect(location).toEqual([390,60]);
  await start.fill('6');
  await expect(page.locator('#lineStats')).toContainText('区间内 0 点，频率 0.000');
  await length.fill('7'); await expect(page.locator('#lineStats')).toHaveText('当前无采样点。');
  await expect(page.locator('#lineCanvas')).toHaveAttribute('aria-label', /线段从0到7/);
});

test('蒙特卡洛估算和误差重置，采样图与统计一致', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0.5; });
  await page.goto(url);
  await page.getByRole('button',{name:'③ 几何概型'}).click();
  await page.getByRole('button',{name:'📍 撒100点'}).click();
  await expect(page.locator('#piTotal')).toHaveText('100');
  await expect(page.locator('#piInside')).toHaveText('100');
  await expect(page.locator('#piEstimate')).toHaveText('4.0000');
  await expect(page.locator('#piCanvas')).toHaveAttribute('aria-label', /采样 100 点，圆内 100 点/);
  await page.locator('#p3 .card').nth(1).getByRole('button',{name:'🔄 重置'}).click();
  await expect(page.locator('#piTotal')).toHaveText('0');
  await expect(page.locator('#piEstimate')).toHaveText('-');
  await expect(page.locator('#piError')).toHaveText('-');
});
