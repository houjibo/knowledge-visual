const {test, expect} = require('@playwright/test');

const url = '/physics/high/mechanical-energy.html';
const canvasByTab = ['#workCanvas', '#keCanvas', '#conservCanvas'];
const panelByTab = ['#panel-work', '#panel-kinetic', '#panel-conservation'];

async function setRange(page, selector, value) {
  const range = page.locator(selector);
  await range.evaluate((input, nextValue) => {
    input.value = String(nextValue);
    input.dispatchEvent(new Event('input', {bubbles: true}));
  }, value);
  await expect(range).toHaveValue(String(value));
}

async function expectPainted(canvas) {
  await expect(canvas).toBeVisible();
  const state = await canvas.evaluate(element => {
    const rect = element.getBoundingClientRect();
    let painted = false;
    if (element.width > 0 && element.height > 0) {
      const pixels = element.getContext('2d').getImageData(0, 0, element.width, element.height).data;
      for (let alpha = 3; alpha < pixels.length; alpha += 4) {
        if (pixels[alpha] !== 0) { painted = true; break; }
      }
    }
    return {
      cssWidth: rect.width,
      cssHeight: rect.height,
      clientWidth: element.clientWidth,
      pixelRatio: Math.max(1, window.devicePixelRatio || 1),
      width: element.width,
      height: element.height,
      painted,
    };
  });
  expect(state.cssWidth).toBeGreaterThan(0);
  expect(state.cssHeight).toBeGreaterThan(0);
  expect(state.width).toBeGreaterThan(0);
  expect(state.height).toBeGreaterThan(0);
  expect(state.width).toBe(Math.round(state.clientWidth * state.pixelRatio));
  expect(state.painted).toBe(true);
}

test('主题键盘切换、往返和窄屏缩放后均绘制活动画布', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);

  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(4);
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  for (let index = 0; index < canvasByTab.length; index++) {
    await tabs.nth(index).click();
    await expect(page.locator(panelByTab[index])).toBeVisible();
    await expectPainted(page.locator(canvasByTab[index]));
  }

  await tabs.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Home');
  await expect(tabs.nth(0)).toBeFocused();
  await page.keyboard.press('End');
  await expect(tabs.nth(3)).toBeFocused();
  await expect(page.locator('#panel-quiz')).toBeVisible();

  await tabs.nth(0).click();
  await setRange(page, '#forceSlider', 12);
  await tabs.nth(1).click();
  await setRange(page, '#massSlider', 3);
  await tabs.nth(0).click();
  await expect(page.locator('#forceSlider')).toHaveValue('12');
  await tabs.nth(1).click();
  await expect(page.locator('#massSlider')).toHaveValue('3');
  await tabs.nth(2).click();
  await setRange(page, '#releaseHeightSlider', 3.5);
  await tabs.nth(0).click();
  await tabs.nth(2).click();
  await expect(page.locator('#releaseHeightSlider')).toHaveValue('3.5');
  await expect(page.locator('#conservTotal')).toHaveText('35.0');

  await page.setViewportSize({width: 320, height: 800});
  for (let index = 0; index < canvasByTab.length; index++) {
    await tabs.nth(index).click();
    await expectPainted(page.locator(canvasByTab[index]));
  }
  expect(errors).toEqual([]);
});

test('功与平均功率随力、角度、位移和时间正确更新', async ({page}) => {
  await page.goto(url);
  await setRange(page, '#forceSlider', 10);
  await setRange(page, '#angleSlider', 0);
  await setRange(page, '#dispSlider', 5);
  await setRange(page, '#timeSlider', 5);
  await expect(page.locator('#workValue')).toHaveText('50.0');
  await expect(page.locator('#workType')).toHaveText('正功');
  await expect(page.locator('#powerValue')).toHaveText('10.0');

  await setRange(page, '#timeSlider', 10);
  await expect(page.locator('#powerValue')).toHaveText('5.0');
  await setRange(page, '#angleSlider', 90);
  await expect(page.locator('#workValue')).toHaveText('0.0');
  await expect(page.locator('#workType')).toHaveText('零功');
  await expect(page.locator('#powerValue')).toHaveText('0.0');

  await setRange(page, '#angleSlider', 180);
  await expect(page.locator('#workValue')).toHaveText('-50.0');
  await expect(page.locator('#workType')).toHaveText('负功');
  await expect(page.locator('#powerValue')).toHaveText('-5.0');
});

test('动能定理动画按实际时间推进并保持合力功等于动能变化', async ({page}) => {
  await page.clock.install({time: new Date('2026-01-01T00:00:00Z')});
  await page.goto(url);
  await page.getByRole('tab').nth(1).click();
  await page.locator('#launchKEButton').click();
  await expect(page.locator('#massSlider')).toBeDisabled();
  await expect(page.locator('#v0Slider')).toBeDisabled();
  await expect(page.locator('#fnetSlider')).toBeDisabled();
  await page.clock.runFor(1000);

  const positive = await page.evaluate(() => ({
    initial: Number(document.querySelector('#keInitVal').textContent),
    current: Number(document.querySelector('#keCurVal').textContent),
    work: Number(document.querySelector('#wNetVal').textContent),
    velocity: Number(document.querySelector('#velocityVal').textContent),
    elapsed: Number(document.querySelector('#keTimeVal').textContent),
  }));
  expect(positive.velocity).toBeGreaterThan(2);
  expect(positive.velocity).toBeLessThan(2.7);
  expect(positive.elapsed).toBeGreaterThan(0.8);
  expect(positive.elapsed).toBeLessThan(1.1);
  expect(Math.abs(positive.current - positive.initial - positive.work)).toBeLessThanOrEqual(0.1);

  await page.locator('#resetKEButton').click();
  await expect(page.locator('#fnetSlider')).toBeEnabled();
  await setRange(page, '#fnetSlider', -5);
  await page.locator('#launchKEButton').click();
  await page.clock.runFor(1000);
  const negative = await page.evaluate(() => ({
    initial: Number(document.querySelector('#keInitVal').textContent),
    current: Number(document.querySelector('#keCurVal').textContent),
    work: Number(document.querySelector('#wNetVal').textContent),
    velocity: Number(document.querySelector('#velocityVal').textContent),
  }));
  expect(negative.velocity).toBeLessThan(-2);
  expect(Math.abs(negative.current - negative.initial - negative.work)).toBeLessThanOrEqual(0.1);
});

test('可调高度自由落体在下落和落地停止时保持总机械能', async ({page}) => {
  await page.clock.install({time: new Date('2026-01-01T00:00:00Z')});
  await page.goto(url);
  await page.getByRole('tab').nth(2).click();
  await setRange(page, '#ballMassSlider', 2);
  await setRange(page, '#releaseHeightSlider', 4);
  await expect(page.locator('#conservTotal')).toHaveText('80.0');
  await page.locator('#releaseConservButton').click();
  await expect(page.locator('#releaseHeightSlider')).toBeDisabled();

  const totals = [];
  for (const milliseconds of [150, 150, 200, 250, 250]) {
    await page.clock.runFor(milliseconds);
    totals.push(Number(await page.locator('#conservTotal').innerText()));
  }
  expect(totals.every(total => total === 80)).toBe(true);
  await expect(page.locator('#releaseHeightSlider')).toBeEnabled();
  await expect(page.locator('#conservKE')).toHaveText('80.0');
  await expect(page.locator('#conservPE')).toHaveText('0.0');
  await expect(page.locator('#conservTotal')).toHaveText('80.0');

  await page.locator('#resetConservButton').click();
  await expect(page.locator('#releaseHeightSlider')).toHaveValue('6');
  await expect(page.locator('#conservTotal')).toHaveText('120.0');
});

test('拖动小球会同步释放高度并启动无耗散下落', async ({page}) => {
  await page.clock.install({time: new Date('2026-01-01T00:00:00Z')});
  await page.goto(url);
  await page.getByRole('tab').nth(2).click();
  const canvas = page.locator('#conservCanvas');
  const box = await canvas.boundingBox();
  const centerX = box.x + box.width / 2;
  const startY = box.y + (320 - 6 * 35);
  const targetY = box.y + (320 - 3 * 35);
  await page.mouse.move(centerX, startY);
  await page.mouse.down();
  await page.mouse.move(centerX, targetY);
  await page.mouse.up();

  await expect(page.locator('#releaseHeightSlider')).toHaveValue('3');
  await expect(page.locator('#releaseHeightSlider')).toBeDisabled();
  await expect(page.locator('#conservTotal')).toHaveText('30.0');
  await page.clock.runFor(200);
  await expect(page.locator('#conservTotal')).toHaveText('30.0');
});

test('测验每题只计一次，三道不同题答对后保存完成状态', async ({page}) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('mechanical-energy-test-reset') !== '1') {
      localStorage.clear();
      sessionStorage.setItem('mechanical-energy-test-reset', '1');
    }
  });
  await page.goto(url);
  await page.getByRole('tab').nth(3).click();
  const isDone = () => page.evaluate(() => PageProgress.isDone('mechanical-energy'));
  const firstCorrect = page.locator('#quiz1 .quiz-option').nth(0);

  await firstCorrect.focus();
  await page.keyboard.press('Enter');
  await expect(firstCorrect).toBeDisabled();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  expect(await isDone()).toBe(false);

  await page.locator('#quiz2 .quiz-option').nth(1).click();
  expect(await isDone()).toBe(false);
  await page.locator('#quiz3 .quiz-option').nth(2).click();
  expect(await isDone()).toBe(true);
  await expect(page.locator('#quiz3 .quiz-option').nth(3)).toContainText('粗糙');
  await page.reload();
  expect(await isDone()).toBe(true);
});
