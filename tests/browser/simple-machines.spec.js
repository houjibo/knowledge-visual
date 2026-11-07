const {test, expect} = require('@playwright/test');
const url = '/science/simple-machines.html';

async function geometry(page) {
  return page.evaluate(() => {
    const proto = CanvasRenderingContext2D.prototype;
    const original = {fillRect: proto.fillRect, moveTo: proto.moveTo, lineTo: proto.lineTo};
    let ends, last, ropes = [];
    const transformed = (ctx, x, y) => {
      const point = new DOMPoint(x, y).matrixTransform(ctx.getTransform());
      return [point.x, point.y];
    };
    proto.fillRect = function(x, y, w, h) {
      if (x === -315 && w === 630) ends = [transformed(this, x, 0), transformed(this, x + w, 0)];
      return original.fillRect.call(this, x, y, w, h);
    };
    proto.moveTo = function(x, y) { last = transformed(this, x, y); return original.moveTo.call(this, x, y); };
    proto.lineTo = function(x, y) {
      const next = transformed(this, x, y);
      if (last && Math.abs(next[1] - last[1] - 18) < 0.01) ropes.push([last, next]);
      return original.lineTo.call(this, x, y);
    };
    try { draw(); return {ends, ropes}; }
    finally { Object.assign(proto, original); }
  });
}

test('杠杆三种状态的杆方向、吊线和读数一致', async ({page}) => {
  await page.goto(url);
  let result = await geometry(page);
  expect(result.ends[0][1]).toBeCloseTo(result.ends[1][1], 5);
  await expect(page.locator('#infoState')).toContainText('水平平衡');
  await page.getByLabel('左盘钩码数').fill('4');
  result = await geometry(page);
  expect(result.ends[0][1]).toBeGreaterThan(result.ends[1][1]);
  expect(result.ropes).toHaveLength(2);
  for (const [start, end] of result.ropes) expect(start[0]).toBeCloseTo(end[0], 5);
  await expect(page.locator('#infoBalance')).toContainText('左 12 vs 右 6');
  await expect(page.locator('#machCanvas')).toHaveAttribute('aria-label', /左端下沉/);
  await page.getByLabel('右盘钩码数').fill('6');
  await page.getByLabel('右盘位置（格）').fill('4');
  result = await geometry(page);
  expect(result.ends[1][1]).toBeGreaterThan(result.ends[0][1]);
  await expect(page.locator('#infoState')).toContainText('右端下沉');
});

test('动滑轮绳索沿轮底绕行并明确理想条件', async ({page}) => {
  await page.goto(url);
  const pulley = page.getByRole('button', {name: '🪢 滑轮'});
  await pulley.focus();
  await page.keyboard.press('Enter');
  await expect(pulley).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#legendLabel')).toContainText('理想情况');
  await expect(page.locator('.equation')).toContainText('忽略摩擦和滑轮重量');
  await expect(page.locator('#rowL')).toBeHidden();
  const arcs = await page.evaluate(() => {
    const proto = CanvasRenderingContext2D.prototype, original = proto.arc, result = [];
    proto.arc = function(x, y, radius, start, end, anticlockwise) {
      if (x === 510 && y === 200 && radius === 34) result.push({start, end, anticlockwise: !!anticlockwise, stroke: this.strokeStyle});
      return original.call(this, x, y, radius, start, end, anticlockwise);
    };
    try { draw(); return result; } finally { proto.arc = original; }
  });
  expect(arcs.some(a => a.start === 0 && a.end === Math.PI && !a.anticlockwise && a.stroke === '#fbbf24')).toBe(true);
});
