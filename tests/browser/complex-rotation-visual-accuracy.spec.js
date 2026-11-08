const {test, expect} = require('@playwright/test');

async function renderComplex(page, {mode = 'rotate', a = 1, b = 0, angle = Math.PI / 2, factor = 1, progress = 0.5} = {}) {
  await page.goto('/math/high/complex-numbers.html');
  return page.evaluate(({mode, a, b, angle, factor, progress}) => {
    currentMode = mode;
    z1 = {a, b};
    rotateAngle = angle;
    scaleFactor = factor;
    animProgress = progress;
    animating = false;
    const visuals = window.__complexVisuals;
    visuals.arcs.length = 0;
    visuals.lines.length = 0;
    visuals.text.length = 0;
    visuals.closedPaths = 0;
    visuals.latestRotationText = '';
    draw();
    return visuals;
  }, {mode, a, b, angle, factor, progress});
}

test.beforeEach(async ({page}) => {
  await page.addInitScript(() => {
    const visuals = window.__complexVisuals = {arcs: [], lines: [], text: [], closedPaths: 0, latestRotationText: ''};
    const originalArc = CanvasRenderingContext2D.prototype.arc;
    CanvasRenderingContext2D.prototype.arc = function(x, y, radius, start, end, anticlockwise) {
      if (this.canvas.id === 'complexCanvas') visuals.arcs.push({x, y, radius, start, end, anticlockwise});
      return originalArc.call(this, x, y, radius, start, end, anticlockwise);
    };
    const originalLineTo = CanvasRenderingContext2D.prototype.lineTo;
    CanvasRenderingContext2D.prototype.lineTo = function(x, y) {
      if (this.canvas.id === 'complexCanvas') visuals.lines.push({x, y});
      return originalLineTo.call(this, x, y);
    };
    const originalFillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function(text, x, y, maxWidth) {
      if (this.canvas.id === 'complexCanvas') {
        const value = String(text);
        visuals.text.push({text: value, x, y});
        if (value.startsWith("z' = ")) visuals.latestRotationText = value;
      }
      return originalFillText.call(this, text, x, y, maxWidth);
    };
    const originalClosePath = CanvasRenderingContext2D.prototype.closePath;
    CanvasRenderingContext2D.prototype.closePath = function() {
      if (this.canvas.id === 'complexCanvas') visuals.closedPaths++;
      return originalClosePath.call(this);
    };
  });
});

test('旋转按角度推进，插值中的点沿实际螺旋轨迹移动', async ({page}) => {
  const visuals = await renderComplex(page, {angle: Math.PI / 2, factor: 2, progress: 0.5});
  const endpoint = visuals.arcs.filter(arc => arc.radius === 6).at(-1);
  expect(endpoint.x).toBeCloseTo(350 + Math.SQRT1_2 * 1.5 * 50, 5);
  expect(endpoint.y).toBeCloseTo(250 - Math.SQRT1_2 * 1.5 * 50, 5);

  const halfwaySpiralPoint = visuals.lines.find(point =>
    Math.abs(point.x - (350 + 1.25 * Math.cos(Math.PI / 8) * 50)) < 0.001 &&
    Math.abs(point.y - (250 - 1.25 * Math.sin(Math.PI / 8) * 50)) < 0.001
  );
  expect(halfwaySpiralPoint).toBeTruthy();
  expect(visuals.text.map(item => item.text)).toContain("z' = 1.1+1.1i");
});

test('角度弧越过 ±π 时仍按滑块指定方向绘制', async ({page}) => {
  const positive = await renderComplex(page, {a: -1, b: 0.01, angle: 0.5, factor: 1, progress: 1});
  const positiveArc = positive.arcs.find(arc => arc.radius === 40);
  expect(positiveArc.start).toBeCloseTo(-Math.atan2(0.01, -1), 8);
  expect(positiveArc.end).toBeCloseTo(-(Math.atan2(0.01, -1) + 0.5), 8);
  expect(positiveArc.anticlockwise).toBe(true);

  const negative = await renderComplex(page, {a: -1, b: -0.01, angle: -0.5, factor: 1, progress: 1});
  const negativeArc = negative.arcs.find(arc => arc.radius === 40);
  expect(negativeArc.start).toBeCloseTo(-Math.atan2(-0.01, -1), 8);
  expect(negativeArc.end).toBeCloseTo(-(Math.atan2(-0.01, -1) - 0.5), 8);
  expect(negativeArc.anticlockwise).toBe(false);
});

test('零复数不绘制辐角或方向箭头，并明确说明辐角未定义', async ({page}) => {
  const visuals = await renderComplex(page, {mode: 'plane', a: 0, b: 0});
  expect(visuals.arcs.some(arc => arc.radius === 30)).toBe(false);
  expect(visuals.closedPaths).toBe(0);
  expect(visuals.text.map(item => item.text)).toContain('arg(z₁) 未定义');

  const rotation = await renderComplex(page, {a: 0, b: 0});
  expect(rotation.arcs.some(arc => arc.radius === 40)).toBe(false);
  expect(rotation.closedPaths).toBe(0);
  expect(rotation.text.map(item => item.text)).toContain('z = 0，零向量的辐角未定义；旋转与缩放后仍为 0');
  expect(rotation.text.map(item => item.text)).toContain("z' = 0");
});

test('共轭复数标签贴合镜像点，负虚部使用减号', async ({page}) => {
  const visuals = await renderComplex(page, {mode: 'plane', a: 2, b: 1});
  const label = visuals.text.find(item => item.text.startsWith('z̄₁ = '));
  expect(label).toMatchObject({text: 'z̄₁ = 2−1i', x: 460, y: 318});
});

test('旋转和缩放滑块通过动画更新复数坐标', async ({page}) => {
  await page.goto('/math/high/complex-numbers.html');
  await page.getByRole('button', {name: /旋转与缩放/}).click();
  await page.locator('#sl-angle').evaluate(input => {
    input.value = '90';
    input.dispatchEvent(new Event('input', {bubbles: true}));
  });
  await page.locator('#sl-scale').evaluate(input => {
    input.value = '2';
    input.dispatchEvent(new Event('input', {bubbles: true}));
  });
  await expect(page.locator('#v-angle')).toHaveText('90°');
  await expect(page.locator('#v-scale')).toHaveText('×2.0');
  await page.getByRole('button', {name: '动画演示'}).click();
  await expect.poll(() => page.evaluate(() => window.__complexVisuals.latestRotationText)).toBe("z' = -2.0+4.0i");
});
