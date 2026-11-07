const {test, expect} = require('@playwright/test');
const url = '/science/light.html';
async function rayPaths(page) {
  return page.evaluate(() => {
    const proto = CanvasRenderingContext2D.prototype;
    const original = {beginPath: proto.beginPath, moveTo: proto.moveTo, lineTo: proto.lineTo, stroke: proto.stroke};
    let points = [], rays = {};
    proto.beginPath = function() { points = []; return original.beginPath.call(this); };
    proto.moveTo = function(x, y) { points.push([x, y]); return original.moveTo.call(this, x, y); };
    proto.lineTo = function(x, y) { points.push([x, y]); return original.lineTo.call(this, x, y); };
    proto.stroke = function(...args) {
      if (['#fbbf24', '#a78bfa', '#34d399'].includes(this.strokeStyle) && points.length === 2) rays[this.strokeStyle] = points.slice();
      return original.stroke.apply(this, args);
    };
    try { draw(); return rays; } finally { Object.assign(proto, original); }
  });
}

test('反射光与入射光在镜面同侧且关于法线对称', async ({page}) => {
  await page.goto(url);
  const tab = page.getByRole('button', {name: '🪞 光的反射'});
  await tab.focus(); await page.keyboard.press('Enter');
  await expect(tab).toHaveAttribute('aria-pressed', 'true');
  const slider = page.getByLabel('入射方向角（相对法线）');
  await slider.fill('30');
  await expect(page.locator('#angleInfo')).toContainText('入射角 30°；反射角 30°');
  const rays = await rayPaths(page);
  const source = rays['#fbbf24'][0], hit = rays['#fbbf24'][1], reflected = rays['#a78bfa'][1];
  expect(source[0]).toBeLessThan(hit[0]);
  expect(reflected[0]).toBeCloseTo(source[0], 5);
  expect(hit[1] - source[1]).toBeCloseTo(reflected[1] - hit[1], 5);
  await slider.focus(); await page.keyboard.press('Home');
  await expect(page.locator('#angleInfo')).toContainText('入射角 80°');
});

test('空气到水的折射服从斯涅尔定律，垂直入射不偏折', async ({page}) => {
  await page.goto(url);
  await page.getByRole('button', {name: '💧 光的折射'}).click();
  const slider = page.getByLabel('入射方向角（相对法线）');
  await slider.fill('30');
  await expect(page.locator('#angleInfo')).toContainText('折射角 22°');
  let rays = await rayPaths(page);
  const [start, hit] = rays['#fbbf24'];
  const end = rays['#34d399'][1];
  expect(start[1]).toBeLessThan(hit[1]);
  expect(end[1]).toBeGreaterThan(hit[1]);
  const incident = Math.atan2(hit[0] - start[0], hit[1] - start[1]);
  const refracted = Math.atan2(end[0] - hit[0], end[1] - hit[1]);
  expect(Math.sin(incident)).toBeCloseTo(1.33 * Math.sin(refracted), 6);
  await slider.fill('0');
  await expect(page.locator('#angleInfo')).toContainText('入射角 0°；折射角 0°');
  rays = await rayPaths(page);
  expect(rays['#fbbf24'][0][0]).toBeCloseTo(rays['#34d399'][1][0], 5);
  await expect(page.locator('#panel-refract .concept-box')).toContainText('沿法线入射时方向不变');
});
