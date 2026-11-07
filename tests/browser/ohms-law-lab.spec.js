const {test, expect} = require('@playwright/test');
const url = '/physics/middle/ohms-law.html';

test('理想电路接线与电表连接', async ({page}) => {
  await page.goto(url);
  const drawing = await page.evaluate(() => {
    const p = CanvasRenderingContext2D.prototype;
    const original = {beginPath: p.beginPath, moveTo: p.moveTo, lineTo: p.lineTo, arc: p.arc, stroke: p.stroke, strokeRect: p.strokeRect};
    const paths = [], rects = []; let path = [];
    p.beginPath = function() { path = []; return original.beginPath.call(this); };
    for (const name of ['moveTo', 'lineTo', 'arc']) p[name] = function(...args) { path.push([name, ...args.slice(0, name === 'arc' ? 3 : 2)]); return original[name].apply(this, args); };
    p.stroke = function() { paths.push(path.slice()); return original.stroke.call(this); };
    p.strokeRect = function(...args) { rects.push(args); return original.strokeRect.apply(this, args); };
    try { drawCircuit(state()); return {paths, rects}; } finally { Object.assign(p, original); }
  });
  expect(drawing.rects).toContainEqual([548, 90, 24, 60]);
  for (const path of [
    [['moveTo',80,40],['lineTo',560,40],['lineTo',560,90]],
    [['moveTo',560,150],['lineTo',560,200],['lineTo',316,200]],
    [['moveTo',284,200],['lineTo',80,200],['lineTo',80,125]],
    [['moveTo',560,90],['lineTo',620,90],['lineTo',620,104]],
    [['moveTo',620,136],['lineTo',620,150],['lineTo',560,150]],
    [['arc',300,200,16]], [['arc',620,120,16]],
  ]) expect(drawing.paths).toContainEqual(path);
  await expect(page.locator('#expCanvas')).toHaveAttribute('aria-label', /电流表串联，电压表并联/);
});

test('滑块、工作点、记录上限和清空一致', async ({page}) => {
  await page.goto(url);
  const voltage = page.getByLabel('电压 U'), resistance = page.getByLabel('电阻 R');
  await voltage.fill('12'); await resistance.fill('5');
  await expect(page.locator('#valI')).toHaveText('2.40 A');
  await expect(page.locator('#valK')).toHaveText('0.200 A/V');
  const point = await page.evaluate(() => {
    const p = CanvasRenderingContext2D.prototype, original = p.arc; let result;
    p.arc = function(x,y,r,...rest) { if (r === 7 && this.fillStyle === '#10b981') result = [x,y]; return original.call(this,x,y,r,...rest); };
    try { draw(); return result; } finally { p.arc = original; }
  });
  expect(point[0]).toBeCloseTo(610); expect(point[1]).toBeCloseTo(278);
  await voltage.fill('1'); await resistance.fill('50');
  await expect(page.locator('#valI')).toHaveText('0.02 A');
  await voltage.focus(); await page.keyboard.press('ArrowRight');
  await expect(page.locator('#valU')).toHaveText('1.5 V');
  const record = page.locator('#btnRecord');
  for (let i = 0; i < 8; i++) await record.click();
  await expect(page.locator('#dataBody tr')).toHaveCount(8);
  await expect(page.getByRole('status')).toContainText('8 / 8');
  await expect(record).toBeDisabled();
  await page.locator('#btnClear').click();
  await expect(record).toBeEnabled();
  await expect(page.getByRole('status')).toContainText('0 / 8');
  await expect(page.locator('#dataBody')).toContainText('暂无数据');
});
