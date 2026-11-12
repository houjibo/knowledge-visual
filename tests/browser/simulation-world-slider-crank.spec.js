const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('simulation-world/slider-crank.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/simulation-world/slider-crank.html';
const readoutIds = ['angle-value', 'displacement-value', 'stroke-value', 'travel-value', 'position-value'];

async function controlledClock(page) {
  const time = new Date('2026-11-12T00:00:00Z');
  await page.clock.install({time});
  await page.clock.pauseAt(time);
}

async function numeric(page, id) {
  return Number((await page.locator(`#${id}`).textContent()).trim());
}

async function phase(page) {
  return Number(await page.locator('#mechanism-svg').getAttribute('data-angle'));
}

function phaseDistance(left, right) {
  const difference = Math.abs(left - right) % 360;
  return Math.min(difference, 360 - difference);
}

async function expectPhase(page, angle, tolerance = 0.01) {
  await expect.poll(async () => phaseDistance(await phase(page), angle)).toBeLessThanOrEqual(tolerance);
  expect(phaseDistance(await numeric(page, 'angle-value'), angle)).toBeLessThanOrEqual(tolerance + 0.01);
}

async function setRange(page, selector, value) {
  // Geometry tables exercise the native input event; real Tab/arrow input is checked separately.
  await page.locator(selector).evaluate((input, next) => {
    input.value = String(next);
    input.dispatchEvent(new Event('input', {bubbles: true}));
  }, value);
  await expect(page.locator(selector)).toHaveValue(String(value));
}

async function startWithFractionalPhase(page) {
  const samples = [];
  // A fixed observation time can land on an integer angle at some rAF cadences and speeds.
  // Vary only the preparation's start offset; never retry the edit or its precision assertions.
  for (const offset of [7, 11, 5, 13]) {
    await setRange(page, '#crank-angle', 13);
    await page.clock.runFor(offset);
    const startedAt = await page.evaluate(() => performance.now());
    await page.locator('#start-motion').click();
    await expect(page.locator('#mechanism-svg')).toHaveAttribute('data-running', 'true');
    await page.clock.runFor(37);
    const angle = await phase(page);
    expect(Number.isFinite(angle)).toBe(true);
    expect(phaseDistance(angle, 13)).toBeGreaterThan(0.001);
    samples.push({offset, startedAt, angle});
    if (Math.abs(angle - Math.round(angle)) > 0.001) return angle;
  }
  throw new Error(`Could not prepare a fractional running phase within four start offsets: ${JSON.stringify(samples)}`);
}

async function geometry(page, radius, rodLength, expectedX) {
  const actual = await page.locator('#mechanism-svg').evaluate(svg => {
    const line = id => {
      const node = svg.querySelector(id);
      return Object.fromEntries(['x1', 'y1', 'x2', 'y2'].map(attribute => [attribute, Number(node.getAttribute(attribute))]));
    };
    const pin = svg.querySelector('#slider-pin');
    return {
      crank: line('#crank-arm'), rod: line('#connecting-rod'),
      pin: {x: Number(pin.getAttribute('cx')), y: Number(pin.getAttribute('cy'))},
      viewBox: svg.getAttribute('viewBox'),
    };
  });
  const {crank, rod, pin} = actual;
  expect(actual.viewBox).toBe('0 0 380 240');
  expect(crank.x1).toBeCloseTo(80, 5);
  expect(crank.y1).toBeCloseTo(120, 5);
  expect(Math.hypot(crank.x2 - crank.x1, crank.y2 - crank.y1)).toBeCloseTo(radius, 2);
  expect(rod.x1).toBeCloseTo(crank.x2, 5);
  expect(rod.y1).toBeCloseTo(crank.y2, 5);
  expect(Math.hypot(rod.x2 - rod.x1, rod.y2 - rod.y1)).toBeCloseTo(rodLength, 2);
  expect(pin.x).toBeCloseTo(rod.x2, 5);
  expect(pin.y).toBeCloseTo(rod.y2, 5);
  expect(pin.y).toBeCloseTo(120, 5);
  expect(pin.x).toBeGreaterThanOrEqual(80 + rodLength - radius - 0.01);
  expect(pin.x).toBeLessThanOrEqual(80 + rodLength + radius + 0.01);
  const angle = await phase(page);
  expect(crank.x2).toBeCloseTo(80 + radius * Math.cos(angle * Math.PI / 180), 2);
  expect(crank.y2).toBeCloseTo(120 - radius * Math.sin(angle * Math.PI / 180), 2);
  if (expectedX !== undefined) expect(pin.x - 80).toBeCloseTo(expectedX, 2);
  expect(await numeric(page, 'position-value')).toBeCloseTo(pin.x - 80, 1);
  expect(await numeric(page, 'displacement-value')).toBeCloseTo(radius + rodLength - (pin.x - 80), 1);
  expect(await numeric(page, 'stroke-value')).toBe(2 * radius);
  expect(await numeric(page, 'travel-value')).toBe(4 * radius);
}

async function expectStopped(page) {
  await expect(page.locator('#mechanism-svg')).toHaveAttribute('data-running', 'false');
  await expect(page.locator('#pause-motion')).toBeDisabled();
  await expect(page.locator('#start-motion')).toBeEnabled();
  await expect(page.locator('#motion-status')).toContainText('暂停');
  const before = await page.locator('#mechanism-svg').getAttribute('data-angle');
  await page.clock.runFor(337);
  expect(await page.locator('#mechanism-svg').getAttribute('data-angle')).toBe(before);
}

async function changeMotionPreference(page, reducedMotion) {
  const count = await page.evaluate(() => {
    if (!window.sliderMediaObservation) {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      const observation = {media, events: []};
      media.addEventListener('change', event => observation.events.push(event.matches));
      window.sliderMediaObservation = observation;
    }
    return window.sliderMediaObservation.events.length;
  });
  await page.emulateMedia({reducedMotion});
  // CDP emulation returning does not imply the browser has delivered its native media-change event.
  // Observe the real event before advancing the fake animation clock; do not synthesize an event.
  await expect.poll(() => page.evaluate(index => window.sliderMediaObservation.events.slice(index), count))
    .toContain(reducedMotion === 'reduce');
  await expectStopped(page);
}

async function trackProgress(page) {
  await page.addInitScript(() => {
    window.sliderProgressWrites = [];
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (/progress/.test(String(key))) window.sliderProgressWrites.push([String(key), String(value)]);
      return setItem.call(this, key, value);
    };
  });
}

test('首页分类搜索和模拟目录可发现曲柄场景且不显示学段进度', async ({page}) => {
  await page.goto(process.env.KV_PUBLISHED_BASE_URL || '/');
  const category = page.locator('[data-subject-category="simulation-world"]');
  await expect(category).toHaveAttribute('data-total', '9');
  await expect(category.locator('.subject-badge')).toHaveText('9 个模拟');
  await expect(category.locator('.subject-progress')).toHaveCount(0);
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('simulation-world');
  await page.getByRole('searchbox', {name: '关键词'}).fill('曲柄');
  await page.locator('#site-results a[href="simulation-world/slider-crank.html"]').click();
  await expect(page.getByRole('heading', {name: /曲柄滑块模拟/})).toBeVisible();
  await page.getByRole('navigation', {name: '导航', exact: true}).getByRole('link', {name: '返回模拟世界', exact: true}).click();
  await expect(page.locator('.topic-card')).toHaveCount(9);
  await page.locator('.topic-card[href="slider-crank.html"]').click();
  await expect(page.locator('#mechanism-svg')).toBeVisible();
});

test('默认暂停、控件有名称且单程行程与整圈往返路程分开呈现', async ({page}) => {
  await controlledClock(page);
  await page.goto(topic);
  for (const [id, value, minimum, maximum, step] of [
    ['crank-radius', '40', '20', '60', '10'], ['rod-length', '140', '100', '200', '20'],
    ['input-rpm', '30', '10', '60', '10'], ['crank-angle', '0', '0', '360', '1'],
  ]) {
    const control = page.locator(`#${id}`);
    await expect(control).toHaveAttribute('type', 'range');
    await expect(control).toHaveValue(value);
    await expect(control).toHaveAttribute('min', minimum);
    await expect(control).toHaveAttribute('max', maximum);
    await expect(control).toHaveAttribute('step', step);
    await expect(control).toHaveAccessibleName(/\S/);
  }
  await expect(page.locator('#mechanism-svg')).toHaveAttribute('role', 'img');
  await expect(page.locator('#mechanism-svg')).toHaveAccessibleName(/\S/);
  for (const id of readoutIds) await expect(page.locator(`#${id}`)).toHaveAttribute('aria-live', 'off');
  await expectPhase(page, 0);
  await geometry(page, 40, 140, 180);
  await expect(page.getByRole('heading', {name: /匀速转动.*匀速滑动/})).toBeVisible();
  await expectStopped(page);
});

test('五个解析角度及尺寸边界的真实SVG杆长、端点与读数一致', async ({page}) => {
  await page.goto(topic);
  await setRange(page, '#crank-radius', 60);
  await setRange(page, '#rod-length', 100);
  for (const [angle, x, displacement] of [[0,160,0], [90,80,80], [180,40,120], [270,80,80], [360,160,0]]) {
    await setRange(page, '#crank-angle', angle);
    await expectPhase(page, angle);
    await geometry(page, 60, 100, x);
    expect(await numeric(page, 'displacement-value')).toBe(displacement);
  }
  for (const [radius, rodLength] of [[20,100], [20,200], [60,200]]) {
    await setRange(page, '#crank-radius', radius);
    await setRange(page, '#rod-length', rodLength);
    for (const angle of [0, 45, 90, 180, 270]) {
      await setRange(page, '#crank-angle', angle);
      await geometry(page, radius, rodLength);
    }
  }
  await setRange(page, '#crank-radius', 20);
  await setRange(page, '#rod-length', 100);
  await setRange(page, '#crank-angle', 90);
  expect(await numeric(page, 'displacement-value')).toBeCloseTo(120 - 40 * Math.sqrt(6), 1);
});

test('长短连杆对照只改连杆，保持半径、角度、转速及相同行程', async ({page}) => {
  await page.goto(topic);
  await setRange(page, '#crank-radius', 60);
  await setRange(page, '#input-rpm', 50);
  await setRange(page, '#crank-angle', 90);
  await page.locator('#preset-short-rod').click();
  await expect(page.locator('#rod-length')).toHaveValue('100');
  await geometry(page, 60, 100, 80);
  await page.locator('#preset-long-rod').click();
  await expect(page.locator('#rod-length')).toHaveValue('200');
  await expect(page.locator('#crank-radius')).toHaveValue('60');
  await expect(page.locator('#input-rpm')).toHaveValue('50');
  await expect(page.locator('#crank-angle')).toHaveValue('90');
  await geometry(page, 60, 200, 20 * Math.sqrt(91));
  expect(await numeric(page, 'displacement-value')).toBeLessThan(80);
});

test('15度步进准确绕回，整圈24步复位且重置恢复全部默认', async ({page}) => {
  await controlledClock(page);
  await page.goto(topic);
  await setRange(page, '#crank-angle', 350);
  await page.locator('#step-motion').click();
  await expectPhase(page, 5);
  await expectStopped(page);
  for (let step = 0; step < 23; step++) await page.locator('#step-motion').click();
  await expectPhase(page, 350);
  await setRange(page, '#crank-radius', 60);
  await setRange(page, '#rod-length', 200);
  await setRange(page, '#input-rpm', 60);
  await page.locator('#reset-motion').click();
  await expect(page.locator('#crank-radius')).toHaveValue('40');
  await expect(page.locator('#rod-length')).toHaveValue('140');
  await expect(page.locator('#input-rpm')).toHaveValue('30');
  await expect(page.locator('#crank-angle')).toHaveValue('0');
  await geometry(page, 40, 140, 180);
  await expectStopped(page);
});

test('真实经过时间按rpm推进，重复启动不加速，暂停后不继续移动', async ({page}) => {
  await controlledClock(page);
  await page.goto(topic);
  await setRange(page, '#input-rpm', 10);
  await page.locator('#start-motion').click();
  await page.locator('#start-motion').dispatchEvent('click');
  await page.clock.runFor(32);
  const first = await phase(page);
  const announcement = await page.locator('#motion-status').textContent();
  await page.clock.runFor(1000);
  expect(phaseDistance(await phase(page), first + 60)).toBeLessThan(1);
  expect(await page.locator('#motion-status').textContent()).toBe(announcement);
  await geometry(page, 40, 140);
  await page.locator('#pause-motion').click();
  await expectStopped(page);

  await setRange(page, '#input-rpm', 60);
  await setRange(page, '#crank-angle', 0);
  await page.locator('#start-motion').click();
  await page.clock.runFor(32);
  const fast = await phase(page);
  await page.clock.runFor(250);
  // At most one 16ms frame of quantization, not an arbitrary real-time sleep tolerance.
  expect(phaseDistance(await phase(page), fast + 90)).toBeLessThan(6);
  await page.locator('#pause-motion').click();
  await expectStopped(page);
});

test('每类参数编辑、角度、预设、步进与重置都暂停，不会保留旧播放链', async ({page}) => {
  await controlledClock(page);
  await page.goto(topic);
  const edits = [
    ['曲柄半径', () => setRange(page, '#crank-radius', 50), angle => angle],
    ['连杆长度', () => setRange(page, '#rod-length', 180), angle => angle],
    ['转速', () => setRange(page, '#input-rpm', 40), angle => angle],
    ['手动角度', () => setRange(page, '#crank-angle', 75), () => 75],
    ['短连杆预设', () => page.locator('#preset-short-rod').click(), angle => angle],
    ['长连杆预设', () => page.locator('#preset-long-rod').click(), angle => angle],
    ['步进', () => page.locator('#step-motion').click(), angle => (angle + 15) % 360],
    ['重置', () => page.locator('#reset-motion').click(), () => 0],
  ];
  for (const [name, edit, expectedPhase] of edits) {
    await test.step(name, async () => {
      const before = await startWithFractionalPhase(page);
      // The running phase must really be fractional: reading back the 1° slider would lose it.
      expect(Math.abs(before - Math.round(before))).toBeGreaterThan(0.001);
      await edit();
      await expectPhase(page, expectedPhase(before), 1e-7);
      await expectStopped(page);
    });
  }
});

test('真实Tab、范围方向键与按钮Enter和Space可操作且焦点可见', async ({page}) => {
  await page.goto(topic);
  const radius = page.locator('#crank-radius');
  for (let index = 0; index < 16 && !(await radius.evaluate(input => input === document.activeElement)); index++) await page.keyboard.press('Tab');
  await expect(radius).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(radius).toHaveValue('50');
  await expect(radius).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Home');
  await expect(radius).toHaveValue('20');
  await page.keyboard.press('End');
  await expect(radius).toHaveValue('60');
  for (const [id, expected] of [['rod-length', '160'], ['input-rpm', '40'], ['crank-angle', '1']]) {
    await page.locator(`#${id}`).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator(`#${id}`)).toHaveValue(expected);
  }
  await page.locator('#step-motion').focus();
  await page.keyboard.press('Space');
  await expectPhase(page, 16);
  await expect(page.locator('#step-motion')).toBeFocused();
  await expect(page.locator('#step-motion')).toHaveCSS('outline-style', 'solid');
  await page.locator('#reset-motion').focus();
  await page.keyboard.press('Enter');
  await expectPhase(page, 0);
});

test('隐藏和减少动态变化暂停，返回不自动恢复，减少动态仍可单步', async ({page}) => {
  await controlledClock(page);
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(topic);
  await expectStopped(page);
  await page.locator('#step-motion').click();
  await expectPhase(page, 15);
  await page.locator('#start-motion').click();
  await page.clock.runFor(80);
  await changeMotionPreference(page, 'no-preference');
  await page.locator('#start-motion').click();
  await page.clock.runFor(80);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {configurable: true, value: true});
    Object.defineProperty(document, 'visibilityState', {configurable: true, value: 'hidden'});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expectStopped(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {configurable: true, value: false});
    Object.defineProperty(document, 'visibilityState', {configurable: true, value: 'visible'});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expectStopped(page);
  await page.locator('#start-motion').click();
  await page.clock.runFor(80);
  await changeMotionPreference(page, 'reduce');
  await changeMotionPreference(page, 'no-preference');
});

test('320px极端尺寸不溢出，全部控件与SVG几何可见并保留模型边界', async ({page}, testInfo) => {
  await page.setViewportSize({width: 320, height: 844});
  await page.goto(topic);
  await setRange(page, '#crank-radius', 60);
  await setRange(page, '#rod-length', 200);
  for (const angle of [0, 90, 180, 270]) {
    await setRange(page, '#crank-angle', angle);
    await geometry(page, 60, 200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  }
  for (const id of ['crank-radius', 'rod-length', 'input-rpm', 'crank-angle', 'start-motion', 'pause-motion', 'step-motion', 'reset-motion', 'preset-short-rod', 'preset-long-rod', 'mechanism-svg']) {
    const control = page.locator(`#${id}`);
    await expect(control).toBeVisible();
    const box = await control.boundingBox();
    expect(box.width).toBeGreaterThan(0);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(320);
  }
  if (testInfo.project.name === 'mobile') await page.locator('#preset-short-rod').tap();
  else await page.locator('#preset-short-rod').click();
  await expect(page.locator('#rod-length')).toHaveValue('100');
  await geometry(page, 60, 100);
  await expect(page.locator('#model-note')).toContainText(/摩擦|受力|负载/);
});

test('探索不写学科进度且保留现有记录原文', async ({page}) => {
  await controlledClock(page);
  await trackProgress(page);
  await page.goto(topic);
  expect(await page.evaluate(() => window.sliderProgressWrites)).toEqual([]);
  const existing = {'kv-chemistry-high-progress': '{broken-record', 'kv-computer-primary-progress': '{"repeat-loops":12345}'};
  await page.evaluate(records => {
    for (const [key, value] of Object.entries(records)) localStorage.setItem(key, value);
    window.sliderProgressWrites = [];
  }, existing);
  await setRange(page, '#crank-angle', 90);
  await page.locator('#preset-short-rod').click();
  await page.locator('#step-motion').click();
  await page.locator('#start-motion').click();
  await page.clock.runFor(97);
  await page.locator('#pause-motion').click();
  await page.locator('#reset-motion').click();
  expect(await page.evaluate(() => window.sliderProgressWrites)).toEqual([]);
  expect(await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), Object.keys(existing))).toEqual(existing);
});

test('file直接打开可用键盘探索，UMD资源加载且不请求网络或写进度', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网验收不访问本机文件');
  const network = [], errors = [];
  page.on('request', request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await trackProgress(page);
  await page.goto(pathToFileURL(resolve(__dirname, '../../simulation-world/slider-crank.html')).href);
  expect(await page.evaluate(() => typeof window.SliderCrankModel.position)).toBe('function');
  await page.locator('#crank-angle').focus();
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowRight');
  await page.locator('#step-motion').focus();
  await page.keyboard.press('Enter');
  await expectPhase(page, 16);
  await geometry(page, 40, 140);
  expect(network).toEqual([]);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.sliderProgressWrites)).toEqual([]);
});
