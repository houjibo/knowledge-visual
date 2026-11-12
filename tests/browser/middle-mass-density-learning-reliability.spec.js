const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');

async function setRange(page, id, value) {
  await page.locator(id).evaluate((input, next) => {
    input.value = String(next);
    input.dispatchEvent(new Event('input', {bubbles: true}));
  }, value);
}

async function completeInitialBalance(page) {
  await page.getByRole('button', {name: /天平使用/}).click();
  await expect(page.locator('#targetMass')).toHaveText('未知');
  await setRange(page, '#riderSlider', 0);
  await page.getByRole('button', {name: '调平空载天平'}).click();
  await page.getByRole('button', {name: '将未知物放左盘'}).click();
  await page.getByRole('button', {name: /^\+20 g/}).click();
  await page.getByRole('button', {name: /^\+5 g/}).click();
  await setRange(page, '#riderSlider', 4);
  await expect(page.locator('#balanceStatus')).toContainText('横梁平衡');
  await page.getByRole('spinbutton', {name: '平衡后读数 (g)'}).fill('25.4');
  await page.getByRole('button', {name: '核对读数'}).click();
  await expect(page.locator('#balanceReadFeedback')).toContainText('读数正确');
  await expect(page.locator('#targetMass')).toHaveText('25.4');
}

test('三个章节和参数可用键盘操作，320px 没有横向溢出', async ({page}, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({width: 320, height: 700});
  await page.goto('/physics/middle/mass-density.html');
  const concept = page.getByRole('button', {name: /质量概念/});
  const balance = page.getByRole('button', {name: /天平使用/});
  const density = page.getByRole('button', {name: /密度计算/});
  await expect(concept).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('slider', {name: '物体选择'})).toBeVisible();

  await balance.focus();
  if (testInfo.project.name === 'desktop') await expect(balance).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(balance).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#panel-balance')).toBeVisible();
  await expect(page.getByRole('slider', {name: '游码位置'})).toBeVisible();
  await expect(page.locator('#panel-concept')).toBeHidden();

  await density.focus();
  await page.keyboard.press('Space');
  await expect(density).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('slider', {name: '质量 (g)'})).toBeVisible();
  await expect(page.getByRole('slider', {name: '体积 (cm³)'})).toBeVisible();
  await expect(page.getByRole('combobox', {name: '参考材料'})).toBeVisible();
  await expect(page.locator('#panel-balance')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  expect(errors).toEqual([]);
});

test('密度以数值比较参考值，重叠与高值都不推断材质', async ({page}) => {
  await page.goto('/physics/middle/mass-density.html');
  await page.getByRole('button', {name: /密度计算/}).click();
  await setRange(page, '#densityMass', 50);
  await setRange(page, '#densityVol', 20);
  await page.getByRole('combobox', {name: '参考材料'}).selectOption('glass');
  await expect(page.locator('#drOut')).toHaveText('2.50');
  await expect(page.locator('#materialComparison')).toContainText('2.60 g/cm³ 相比，低 0.10 g/cm³');
  await expect(page.locator('#materialComparison')).toContainText('仅凭密度不能确定材质');
  await page.getByRole('combobox', {name: '参考材料'}).selectOption('aluminum');
  await expect(page.locator('#materialComparison')).toContainText('2.70 g/cm³ 相比，低 0.20 g/cm³');

  await setRange(page, '#densityMass', 100);
  await setRange(page, '#densityVol', 100);
  await page.getByRole('combobox', {name: '参考材料'}).selectOption('water');
  await expect(page.locator('#materialComparison')).toContainText('在显示精度内相同');

  await setRange(page, '#densityMass', 420);
  await setRange(page, '#densityVol', 20);
  await expect(page.locator('#drOut')).toHaveText('21.00');
  await expect(page.locator('#materialComparison')).not.toContainText('超重物质');
});

test('空载归零、调平、放物与误读均可用键盘修正，未知质量不提前揭晓', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.balanceCanvasLabels = [];
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function(value, ...args) {
      if (this.canvas.id === 'mainCanvas') window.balanceCanvasLabels.push(String(value));
      return original.call(this, value, ...args);
    };
  });
  await page.setViewportSize({width: 320, height: 700});
  await page.goto('/physics/middle/mass-density.html');
  await page.getByRole('button', {name: /天平使用/}).focus();
  await page.keyboard.press('Enter');
  const rider = page.getByRole('slider', {name: '游码位置'});
  const reading = page.getByRole('spinbutton', {name: '平衡后读数 (g)'});
  const calibrate = page.getByRole('button', {name: '调平空载天平'});
  const place = page.getByRole('button', {name: '将未知物放左盘'});
  const newObject = page.getByRole('button', {name: '🔄 换一个未知物'});
  await expect(page.locator('#targetMass')).toHaveText('未知');
  await expect(newObject).toBeDisabled();
  await expect(page.getByRole('button', {name: /^\+20 g/})).toBeDisabled();
  await expect(reading).toBeDisabled();
  await calibrate.click();
  await expect(page.locator('#balanceStatus')).toContainText('先把游码移到0 g');
  await rider.focus();
  await page.keyboard.press('Home');
  await expect(rider).toHaveValue('0');
  await calibrate.focus();
  await page.keyboard.press('Enter');
  await expect(place).toBeEnabled();
  await expect(newObject).toBeEnabled();
  await place.focus();
  await page.keyboard.press('Space');
  await page.getByRole('button', {name: /^\+50 g/}).click();
  await expect(page.locator('#balanceStatus')).toContainText('右盘偏重');
  await expect(page.locator('#targetMass')).toHaveText('未知');
  await page.getByRole('button', {name: '取下上枚砝码'}).click();
  await expect(page.locator('#balanceStatus')).toContainText('右盘偏轻');
  await page.getByRole('button', {name: /^\+20 g/}).click();
  await page.getByRole('button', {name: /^\+5 g/}).click();
  await setRange(page, '#riderSlider', 4);
  await expect(page.locator('#balanceStatus')).toContainText('横梁平衡');
  await expect(page.locator('#targetMass')).toHaveText('未知');
  expect(await page.evaluate(() => window.balanceCanvasLabels)).not.toContain('25.4g');
  await setRange(page, '#riderSlider', 5);
  await expect(reading).toBeDisabled();
  await expect(page.locator('#balanceStatus')).toContainText('右盘偏重');
  await setRange(page, '#riderSlider', 4);
  await expect(reading).toBeEnabled();
  await reading.fill('25.3');
  await page.getByRole('button', {name: '核对读数'}).click();
  await expect(page.locator('#balanceReadFeedback')).toContainText('读数不符');
  await expect(page.locator('#targetMass')).toHaveText('未知');
  await reading.fill('25.4');
  await page.getByRole('button', {name: '核对读数'}).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#targetMass')).toHaveText('25.4');
  expect(await page.evaluate(() => window.balanceCanvasLabels)).toContain('25.4g');
  await expect(page.locator('#completionStatus')).toContainText('密度练习（待完成）');
  expect(await page.evaluate(() => localStorage.getItem('kv-physics-middle-progress'))).toBeNull();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  expect(errors).toEqual([]);
});

test('八个未知物均可用有限砝码和0.1 g游码精确称量', async ({page}) => {
  const cases = [
    [12.5, [10], 25], [25.4, [20, 5], 4], [37.8, [20, 10, 5], 28],
    [48.2, [20, 20, 5], 32], [63.5, [50, 10], 35], [85.0, [50, 20, 10, 5], 0],
    [107.3, [100, 5], 23], [152.6, [100, 50], 26],
  ];
  await page.goto('/physics/middle/mass-density.html');
  await page.getByRole('button', {name: /天平使用/}).click();
  await setRange(page, '#riderSlider', 0);
  await page.getByRole('button', {name: '调平空载天平'}).click();
  let previousMass = 25.4;
  for (let index = 0; index < cases.length; index++) {
    const [mass, weights, rider] = cases[index];
    const otherTargets = cases.map(([candidate]) => candidate).filter(candidate => candidate !== previousMass);
    const slot = otherTargets.indexOf(mass);
    expect(slot).toBeGreaterThanOrEqual(0);
    await page.evaluate(({slot, length}) => { Math.random = () => (slot + 0.5) / length; }, {slot, length: otherTargets.length});
    await page.getByRole('button', {name: '🔄 换一个未知物'}).click();
    await expect(page.locator('#targetMass')).toHaveText('未知');
    await page.getByRole('button', {name: '将未知物放左盘'}).click();
    for (const weight of weights) await page.getByRole('button', {name: new RegExp('^\\+' + weight + ' g')}).click();
    if (index === 3) await expect(page.getByRole('button', {name: /^\+20 g/})).toBeDisabled();
    await setRange(page, '#riderSlider', rider);
    await expect(page.locator('#balanceStatus')).toContainText('横梁平衡');
    await page.getByRole('spinbutton', {name: '平衡后读数 (g)'}).fill(mass.toFixed(1));
    await page.getByRole('button', {name: '核对读数'}).click();
    await expect(page.locator('#targetMass')).toHaveText(mass.toFixed(1));
    previousMass = mass;
  }
  await expect(page.locator('#completionStatus')).toContainText('密度练习（待完成）');
  expect(await page.evaluate(() => localStorage.getItem('kv-physics-middle-progress'))).toBeNull();
});

test('先称量再答密度题才保存，既有旧记录保持原值', async ({page}) => {
  await page.goto('/physics/middle/mass-density.html');
  await completeInitialBalance(page);
  await expect(page.locator('#completionStatus')).toContainText('密度练习（待完成）');
  await page.getByRole('button', {name: /密度计算/}).click();
  await page.getByRole('button', {name: /^B\. 铝/}).click();
  await expect(page.locator('#completionStatus')).toContainText('完成记录已保存在本机');
  const recorded = await page.evaluate(() => localStorage.getItem('kv-physics-middle-progress'));
  await page.evaluate(() => localStorage.setItem('kv-physics-middle-progress', JSON.stringify({'mass-density': 12345})));
  await page.reload();
  await expect(page.locator('#completionStatus')).toContainText('可能按旧规则保存');
  await page.getByRole('button', {name: /密度计算/}).click();
  await page.getByRole('button', {name: /^B\. 铝/}).click();
  expect(await page.evaluate(() => localStorage.getItem('kv-physics-middle-progress'))).toBe(JSON.stringify({'mass-density': 12345}));
  expect(recorded).not.toBeNull();
});

test('练习可改错，单题不记整页，称量读数后才保存且不重复写入', async ({page}) => {
  await page.goto('/physics/middle/mass-density.html');
  await page.getByRole('button', {name: /密度计算/}).click();
  const iron = page.getByRole('button', {name: /^A\. 铁/});
  const aluminum = page.getByRole('button', {name: /^B\. 铝/});
  await iron.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#quizFeedback')).toContainText('可重新选择');
  await expect(aluminum).toBeEnabled();
  await aluminum.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#quizFeedback')).toContainText('答对了');
  await expect(page.locator('#completionStatus')).toContainText('称量未知物并正确读数（待完成）');
  expect(await page.evaluate(() => localStorage.getItem('kv-physics-middle-progress'))).toBeNull();
  for (const option of await page.locator('.quiz-opt').all()) await expect(option).toBeDisabled();
  await completeInitialBalance(page);
  await expect(page.locator('#completionStatus')).toContainText('完成记录已保存在本机');
  const stored = await page.evaluate(() => localStorage.getItem('kv-physics-middle-progress'));
  expect(JSON.parse(stored)['mass-density']).toBeTruthy();

  await page.reload();
  await expect(page.locator('#completionStatus')).toContainText('本机已有完成记录');
  await page.getByRole('button', {name: /密度计算/}).click();
  await page.getByRole('button', {name: /^B\. 铝/}).click();
  await expect(page.locator('#completionStatus')).toContainText('可能按旧规则保存');
  expect(await page.evaluate(() => localStorage.getItem('kv-physics-middle-progress'))).toBe(stored);
});

test('存储拒绝时保留答对资格，主动重试后才宣告保存', async ({page}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    window.blockDensityProgress = true;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'kv-physics-middle-progress' && window.blockDensityProgress) throw new Error('blocked');
      return original.call(this, key, value);
    };
  });
  await page.goto('/physics/middle/mass-density.html');
  await page.getByRole('button', {name: /密度计算/}).click();
  await page.getByRole('button', {name: /^B\. 铝/}).click();
  await completeInitialBalance(page);
  await expect(page.locator('#completionStatus')).toContainText('未保存；可重试');
  await expect(page.getByRole('button', {name: '重试保存完成记录'})).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('kv-physics-middle-progress'))).toBeNull();

  await page.evaluate(() => { window.blockDensityProgress = false; });
  await page.getByRole('button', {name: '重试保存完成记录'}).click();
  await expect(page.locator('#completionStatus')).toContainText('完成记录已保存在本机');
  await expect(page.getByRole('button', {name: '重试保存完成记录'})).toBeHidden();
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('kv-physics-middle-progress')))['mass-density']).toBeTruthy();
});

test('损坏的历史进度原文不被覆盖，修复存储后可重试', async ({page}) => {
  await page.goto('/physics/middle/mass-density.html');
  await page.evaluate(() => localStorage.setItem('kv-physics-middle-progress', '{broken'));
  await page.reload();
  await page.getByRole('button', {name: /密度计算/}).click();
  await page.getByRole('button', {name: /^B\. 铝/}).click();
  await completeInitialBalance(page);
  await expect(page.locator('#completionStatus')).toContainText('未保存');
  expect(await page.evaluate(() => localStorage.getItem('kv-physics-middle-progress'))).toBe('{broken');
  await page.evaluate(() => localStorage.removeItem('kv-physics-middle-progress'));
  await page.getByRole('button', {name: '重试保存完成记录'}).click();
  await expect(page.locator('#completionStatus')).toContainText('已保存在本机');
});

test('画布刻度与全部对照行在可见画布内，高密度扩大横轴', async ({page}) => {
  await page.addInitScript(() => {
    window.drawnLabels = [];
    window.drawnRects = [];
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function(value, x, y, ...rest) {
      if (this.canvas.id === 'mainCanvas') window.drawnLabels.push({value: String(value), x, y});
      return original.call(this, value, x, y, ...rest);
    };
    const originalRect = CanvasRenderingContext2D.prototype.strokeRect;
    CanvasRenderingContext2D.prototype.strokeRect = function(x, y, width, height) {
      if (this.canvas.id === 'mainCanvas') window.drawnRects.push({x, y, width, height});
      return originalRect.call(this, x, y, width, height);
    };
  });
  await page.goto('/physics/middle/mass-density.html');
  let labels = await page.evaluate(() => window.drawnLabels);
  expect(labels.some(item => item.value === '10t')).toBe(true);
  expect(labels.some(item => item.value === '10000t')).toBe(false);
  await page.getByRole('button', {name: /密度计算/}).click();
  labels = await page.evaluate(() => window.drawnLabels);
  const gold = labels.filter(item => item.value === '金').at(-1);
  expect(gold.y).toBeLessThan(520);
  expect(labels.some(item => item.value.includes('横轴上限 20'))).toBe(true);
  await setRange(page, '#densityMass', 420);
  await setRange(page, '#densityVol', 20);
  labels = await page.evaluate(() => window.drawnLabels);
  expect(labels.some(item => item.value.includes('横轴上限 25'))).toBe(true);
  expect(labels.filter(item => item.value === '21.00').at(-1).x).toBeLessThan(720);

  const widths = [];
  for (const volume of [1, 8, 27]) {
    await setRange(page, '#densityVol', volume);
    widths.push(await page.evaluate(() => window.drawnRects.filter(rect => rect.y === 100).at(-1).width));
  }
  expect(widths[1] / widths[0]).toBeCloseTo(2, 5);
  expect(widths[2] / widths[0]).toBeCloseTo(3, 5);
});

test('画布不可用时仍可计算、答题和读取结果', async ({page}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(...args) {
      if (this.id === 'mainCanvas') return null;
      return original.apply(this, args);
    };
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/physics/middle/mass-density.html');
  await expect(page.locator('#canvasFallback')).toBeVisible();
  await page.getByRole('button', {name: /密度计算/}).click();
  await setRange(page, '#densityMass', 50);
  await setRange(page, '#densityVol', 20);
  await expect(page.locator('#drOut')).toHaveText('2.50');
  await page.getByRole('button', {name: /^B\. 铝/}).click();
  await expect(page.locator('#quizFeedback')).toContainText('答对了');
  await completeInitialBalance(page);
  await expect(page.locator('#completionStatus')).toContainText('完成记录已保存在本机');
  expect(errors).toEqual([]);
});

test('直接打开静态文件仍可完成密度比较与键盘练习', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '发布路径由独立用例覆盖');
  const external = [];
  page.on('request', request => { if (!request.url().startsWith('file://')) external.push(request.url()); });
  await page.goto(pathToFileURL(resolve(__dirname, '../../physics/middle/mass-density.html')).href);
  await page.getByRole('button', {name: /密度计算/}).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#panel-density')).toBeVisible();
  await setRange(page, '#densityMass', 54);
  await setRange(page, '#densityVol', 20);
  await expect(page.locator('#drOut')).toHaveText('2.70');
  await page.getByRole('button', {name: /^B\. 铝/}).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#quizFeedback')).toContainText('答对了');
  await completeInitialBalance(page);
  await expect(page.locator('#completionStatus')).toContainText('已保存在本机');
  expect(external).toEqual([]);
});
