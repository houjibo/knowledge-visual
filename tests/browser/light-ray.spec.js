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

async function shadowPaths(page) {
  return page.evaluate(() => {
    const proto = CanvasRenderingContext2D.prototype;
    const original = {beginPath: proto.beginPath, moveTo: proto.moveTo, lineTo: proto.lineTo, stroke: proto.stroke, fill: proto.fill};
    let points = [], line, shadow;
    proto.beginPath = function() { points = []; return original.beginPath.call(this); };
    proto.moveTo = function(x, y) { points.push([x, y]); return original.moveTo.call(this, x, y); };
    proto.lineTo = function(x, y) { points.push([x, y]); return original.lineTo.call(this, x, y); };
    proto.stroke = function(...args) {
      if (this.strokeStyle === 'rgba(251, 191, 36, 0.8)' && points.length === 2) line = points.slice();
      return original.stroke.apply(this, args);
    };
    proto.fill = function(...args) {
      if (this.fillStyle === 'rgba(0, 0, 0, 0.5)' && points.length === 4) shadow = points.slice();
      return original.fill.apply(this, args);
    };
    try { animating = false; draw(); return {line, shadow}; }
    finally { Object.assign(proto, original); }
  });
}

test('点光源被遮挡，影子随位置改变并可键盘重置', async ({page}) => {
  await page.goto(url);
  const slider = page.getByLabel('障碍物位置');
  await slider.focus(); await page.keyboard.press('Home');
  await expect(page.locator('#obstacleInfo')).toContainText('较近');
  const near = await shadowPaths(page);
  expect(near.line[1][0]).toBe(250);
  expect(near.shadow[1][0]).toBe(700);
  expect(near.shadow[1][1]).toBeCloseTo(10, 5);
  expect(near.shadow[2][1]).toBeCloseTo(490, 5);
  await page.keyboard.press('End');
  await expect(page.locator('#obstacleInfo')).toContainText('较远');
  const far = await shadowPaths(page);
  expect(far.line[1][0]).toBe(600);
  expect(far.shadow[2][1] - far.shadow[1][1]).toBeLessThan(near.shadow[2][1] - near.shadow[1][1]);
  expect(far.shadow[1][1]).toBeCloseTo(178, 5);
  await page.locator('#btnReset').click();
  await expect(slider).toHaveValue('350');
  await expect(page.locator('#panel-straight .concept-box')).toContainText('简化为一个点');
});

async function answerAllLight(page) {
  for (const mode of ['straight', 'reflect', 'refract']) {
    await page.locator(`[data-mode="${mode}"]`).click();
    for (let i = 0; i < 3; i++) {
      const options = page.locator(`#quiz-opts-${mode} button`);
      await options.nth(1).focus();
      await page.keyboard.press('Enter');
      await expect(page.locator(`#quiz-fb-${mode}`)).toContainText('正确');
      if (i < 2) await page.locator(`#quiz-next-${mode}`).click();
    }
    await expect(page.locator(`#quiz-next-${mode}`)).toBeDisabled();
  }
}

test('键盘答题保留错误反馈，重新开始九题后完成', async ({page}) => {
  await page.goto(url);
  await expect(page.locator('#light-progress')).toContainText('全部九题');
  const first = page.locator('#quiz-opts-straight button').first();
  await first.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#quiz-fb-straight')).toContainText('不对');
  await page.locator('#quiz-next-straight').click();
  await page.locator('#quiz-prev-straight').click();
  await expect(page.locator('#quiz-fb-straight')).toContainText('不对');
  await expect(page.locator('#quiz-opts-straight button').first()).toBeDisabled();
  await page.locator('#panel-straight [data-quiz-restart]').click();
  await answerAllLight(page);
  await expect(page.locator('#light-progress')).toContainText('已完成');
  await page.reload();
  await expect(page.locator('#light-progress')).toContainText('已完成');
});

test('九题达标时写入失败可重试保存', async ({page}) => {
  await page.addInitScript(() => {
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('denied'); };
  });
  await page.goto(url);
  await answerAllLight(page);
  await expect(page.locator('#light-progress')).toContainText('进度未保存');
  await expect(page.locator('#done-mark')).toBeHidden();
  await page.locator('#panel-refract [data-quiz-restart]').click();
  await expect(page.locator('#light-progress')).toContainText('进度未保存');
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
  await page.locator('#retrySave').click();
  await expect(page.locator('#light-progress')).toContainText('已完成');
  await expect(page.locator('#done-mark')).toBeVisible();
  await page.reload();
  await expect(page.locator('#light-progress')).toContainText('已完成');
});
