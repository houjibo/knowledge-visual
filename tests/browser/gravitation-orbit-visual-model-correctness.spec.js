const {test, expect} = require('@playwright/test');

const url = '/physics/high/gravitation.html';

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
  expect(state.width).toBe(Math.round(state.clientWidth * state.pixelRatio));
  expect(state.height).toBeGreaterThan(0);
  expect(state.painted).toBe(true);
}

test('主题标签支持键盘导航并同步面板', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(4);
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  await tabs.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(page.locator('#sec-velocity')).toBeVisible();
  await page.keyboard.press('End');
  await expect(tabs.nth(3)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#sec-quiz')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Home');
  expect(errors).toEqual([]);
});

test('发射速度边界来自当前高度并驱动真实分类，暂停续播保留时间状态', async ({page}) => {
  await page.clock.install({time: new Date('2026-01-01T00:00:00Z')});
  await page.goto(url);
  await page.getByRole('tab', {name: '宇宙速度'}).click();
  await setRange(page, '#sVel', 7.7);
  await page.locator('#btnLaunch').click();
  await expect(page.locator('#velInfo')).toHaveAttribute('data-trajectory', 'impact');
  await expect(page.locator('#velInfo')).toContainText('相交');

  await page.locator('#btnResetVel').click();
  await setRange(page, '#sVel', 8.0);
  await page.locator('#btnLaunch').click();
  await expect(page.locator('#velInfo')).toHaveAttribute('data-trajectory', 'elliptic');
  await expect(page.locator('#velInfo')).toContainText('椭圆');
  await page.clock.runFor(200);
  const movingTime = Number(await page.locator('#simulationTime').innerText());
  expect(movingTime).toBeGreaterThan(0);
  await page.locator('#btnLaunch').click();
  const pausedTime = await page.locator('#simulationTime').innerText();
  await page.clock.runFor(200);
  await expect(page.locator('#simulationTime')).toHaveText(pausedTime);
  await page.locator('#btnLaunch').click();
  await page.clock.runFor(200);
  expect(Number(await page.locator('#simulationTime').innerText())).toBeGreaterThan(Number(pausedTime));

  await page.locator('#btnResetVel').click();
  await page.locator('#btnCircularSpeed').click();
  await page.locator('#btnLaunch').click();
  await expect(page.locator('#velInfo')).toHaveAttribute('data-trajectory', 'circular');
  await expect(page.locator('#velInfo')).toContainText('圆轨道');

  await page.locator('#btnResetVel').click();
  await page.locator('#btnEscapeSpeed').click();
  await page.locator('#btnLaunch').click();
  await expect(page.locator('#velInfo')).toHaveAttribute('data-trajectory', 'parabolic');
  await expect(page.locator('#velInfo')).toContainText('抛物线');

  await page.locator('#btnResetVel').click();
  await setRange(page, '#sVel', 12);
  await page.locator('#btnLaunch').click();
  await expect(page.locator('#velInfo')).toHaveAttribute('data-trajectory', 'hyperbolic');
  await expect(page.locator('#velInfo')).toContainText('双曲线');
});

test('轨道预设的高度、地心距离和读数保持一致', async ({page}) => {
  await page.goto(url);
  await page.getByRole('tab', {name: '卫星轨道'}).click();
  await page.locator('#orbitPresetMoon').click();
  await expect(page.locator('#sH')).toHaveValue('378029');
  await expect(page.locator('#vH')).toHaveText('378,029');
  await expect(page.locator('#orbitDistanceInfo')).toContainText('384,400 km');
  const moon = await page.evaluate(() => GravitationModel.orbitParameters(378029));
  await expect(page.locator('#opV')).toHaveText(moon.speedKmPerSec.toFixed(2));
  await expect(page.locator('#opT')).toHaveText((moon.periodSeconds / 86400).toFixed(2) + ' 天');
  await expect(page.locator('#opA')).toHaveText(moon.accelerationMetersPerSec2.toFixed(3));

  await page.locator('#orbitPresetGeo').click();
  await expect(page.locator('#sH')).toHaveValue('35793');
  const geostationary = await page.evaluate(() => GravitationModel.orbitParameters(35793));
  await expect(page.locator('#opT')).toHaveText((geostationary.periodSeconds / 3600).toFixed(2) + ' 小时');
  await page.locator('#orbitPresetLeo').click();
  await expect(page.locator('#sH')).toHaveValue('400');
  const lowOrbit = await page.evaluate(() => GravitationModel.orbitParameters(400));
  await expect(page.locator('#opV')).toHaveText(lowOrbit.speedKmPerSec.toFixed(2));
});

test('首次显示和窄屏缩放后画布可绘制且控件值保留', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await expectPainted(page.locator('#cvLaw'));
  await setRange(page, '#sM', 200);

  await page.getByRole('tab', {name: '宇宙速度'}).click();
  await setRange(page, '#sVel', 8.2);
  await expectPainted(page.locator('#cvVel'));
  await page.setViewportSize({width: 320, height: 844});
  await page.waitForFunction(() => {
    const canvas = document.querySelector('#cvVel');
    return canvas.width === Math.round(canvas.clientWidth * Math.max(1, window.devicePixelRatio || 1));
  });
  await expectPainted(page.locator('#cvVel'));
  await expect(page.locator('#sVel')).toHaveValue('8.2');

  await page.getByRole('tab', {name: '卫星轨道'}).click();
  await page.locator('#orbitPresetMoon').click();
  await expectPainted(page.locator('#cvOrbit'));
  await page.setViewportSize({width: 375, height: 812});
  await page.waitForFunction(() => {
    const canvas = document.querySelector('#cvOrbit');
    return canvas.width === Math.round(canvas.clientWidth * Math.max(1, window.devicePixelRatio || 1));
  });
  await expectPainted(page.locator('#cvOrbit'));
  await expect(page.locator('#sH')).toHaveValue('378029');

  await page.getByRole('tab', {name: '引力定律'}).click();
  await expectPainted(page.locator('#cvLaw'));
  await expect(page.locator('#sM')).toHaveValue('200');
  expect(errors).toEqual([]);
});

test('测验选项作答后锁定，三道不同题首次答对后保存完成状态', async ({page}) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('gravitation-test-reset') !== '1') {
      localStorage.clear();
      sessionStorage.setItem('gravitation-test-reset', '1');
    }
  });
  await page.goto(url);
  await page.getByRole('tab', {name: '互动练习'}).click();
  const isDone = () => page.evaluate(() => PageProgress.isDone('gravitation'));
  const firstQuestion = page.locator('#quiz-question-0 .quiz-option');
  await firstQuestion.nth(0).click();
  await expect(firstQuestion.nth(0)).toBeDisabled();
  await expect(page.locator('#qResult')).toContainText('错误不计入完成进度');
  expect(await isDone()).toBe(false);

  await page.locator('#btnNextQuiz').click();
  await page.locator('#quiz-question-1 .quiz-option').nth(0).click();
  await page.locator('#btnNextQuiz').click();
  await page.locator('#quiz-question-2 .quiz-option').nth(1).click();
  expect(await isDone()).toBe(false);
  await page.locator('#btnNextQuiz').click();
  await page.locator('#quiz-question-3 .quiz-option').nth(1).click();
  expect(await isDone()).toBe(true);
  await page.reload();
  expect(await isDone()).toBe(true);
});

test('循环出现已答题目时再次答对不重复计入完成数', async ({page}) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('gravitation-repeat-reset') !== '1') {
      localStorage.clear();
      sessionStorage.setItem('gravitation-repeat-reset', '1');
    }
  });
  await page.goto(url);
  await page.getByRole('tab', {name: '互动练习'}).click();
  await page.locator('#quiz-question-0 .quiz-option').nth(1).click();
  for (let index = 0; index < 8; index++) await page.locator('#btnNextQuiz').click();
  await expect(page.locator('#quiz-question-0')).toBeVisible();
  await page.locator('#quiz-question-0 .quiz-option').nth(1).click();
  expect(await page.evaluate(() => PageProgress.isDone('gravitation'))).toBe(false);

  await page.locator('#btnNextQuiz').click();
  await page.locator('#quiz-question-1 .quiz-option').nth(0).click();
  expect(await page.evaluate(() => PageProgress.isDone('gravitation'))).toBe(false);
  await page.locator('#btnNextQuiz').click();
  await page.locator('#quiz-question-2 .quiz-option').nth(1).click();
  expect(await page.evaluate(() => PageProgress.isDone('gravitation'))).toBe(true);
});
