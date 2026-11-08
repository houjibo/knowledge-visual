const {test, expect} = require('@playwright/test');

const url = '/physics/high/momentum.html';
const canvasByTab = ['#impulseCanvas', '#collisionCanvas', '#recoilCanvas'];
const canvasHeights = {'#impulseCanvas': 280, '#collisionCanvas': 300, '#recoilCanvas': 280};
const panelByTab = ['#panel-impulse', '#panel-collision', '#panel-recoil', '#panel-quiz'];

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
    const ratio = window.devicePixelRatio || 1;
    let painted = false;
    if (element.width > 0 && element.height > 0) {
      const pixels = element.getContext('2d').getImageData(0, 0, element.width, element.height).data;
      for (let alpha = 3; alpha < pixels.length; alpha += 4) {
        if (pixels[alpha] !== 0) { painted = true; break; }
      }
    }
    return {
      id: element.id,
      cssWidth: rect.width,
      cssHeight: rect.height,
      clientWidth: element.clientWidth,
      clientHeight: element.clientHeight,
      width: element.width,
      height: element.height,
      ratio,
      painted,
    };
  });
  expect(state.cssWidth).toBeGreaterThan(0);
  expect(state.cssHeight).toBeGreaterThan(0);
  expect(state.clientHeight).toBe(canvasHeights[`#${state.id}`]);
  expect(state.width).toBe(Math.round(state.clientWidth * state.ratio));
  expect(state.height).toBe(Math.round(state.clientHeight * state.ratio));
  expect(state.painted).toBe(true);
}

async function selectTab(page, index) {
  const tab = page.getByRole('tab').nth(index);
  await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator(panelByTab[index])).toBeVisible();
}

async function advanceUntilCollision(page) {
  for (let step = 0; step < 30; step++) {
    if (await page.evaluate(() => colState.collided)) return;
    await page.clock.runFor(200);
  }
  throw new Error('collision did not occur within six simulated seconds');
}

test('主题键盘导航、画布首次显示、回切和缩放后均绘制正确', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);

  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(4);
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  await expectPainted(page.locator(canvasByTab[0]));
  await selectTab(page, 1);
  await expectPainted(page.locator(canvasByTab[1]));
  await selectTab(page, 2);
  await expectPainted(page.locator(canvasByTab[2]));

  await tabs.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Home');
  await expect(tabs.nth(0)).toBeFocused();
  await page.keyboard.press('End');
  await expect(tabs.nth(3)).toBeFocused();
  await expect(page.locator(panelByTab[3])).toBeVisible();

  await selectTab(page, 0);
  await setRange(page, '#massSlider', 3);
  await selectTab(page, 1);
  await setRange(page, '#m1Slider', 4);
  await selectTab(page, 0);
  await expect(page.locator('#massSlider')).toHaveValue('3');
  await selectTab(page, 1);
  await expect(page.locator('#m1Slider')).toHaveValue('4');

  await page.setViewportSize({width: 320, height: 800});
  for (let index = 0; index < canvasByTab.length; index++) {
    await selectTab(page, index);
    await expectPainted(page.locator(canvasByTab[index]));
  }
  expect(errors).toEqual([]);
});

test('冲量按设定时长计算，锁定本次输入并可立即重置', async ({page}) => {
  await page.clock.install({time: new Date('2026-01-01T00:00:00Z')});
  await page.goto(url);
  await setRange(page, '#massSlider', 4);
  await setRange(page, '#v0Slider', 2);
  await setRange(page, '#forceSlider', 5);
  await setRange(page, '#impulseDurationSlider', 2);
  await page.locator('#applyForceButton').click();
  for (const selector of ['#massSlider', '#v0Slider', '#forceSlider', '#impulseDurationSlider']) {
    await expect(page.locator(selector)).toBeDisabled();
  }
  await page.clock.runFor(2000);
  await expect(page.locator('#impulseVal')).toHaveText('10.0');
  await expect(page.locator('#pInitVal')).toHaveText('8.0');
  await expect(page.locator('#pCurVal')).toHaveText('18.0');
  const momentumAfterTwoSeconds = Number(await page.locator('#pCurVal').innerText());

  await setRange(page, '#impulseDurationSlider', 4);
  await page.locator('#applyForceButton').click();
  await page.clock.runFor(4000);
  await expect(page.locator('#impulseVal')).toHaveText('20.0');
  const momentumAfterFourSeconds = Number(await page.locator('#pCurVal').innerText());
  expect(momentumAfterFourSeconds).toBe(28);
  expect(momentumAfterFourSeconds - 8).toBe(5 * 4);
  expect(momentumAfterFourSeconds).toBeGreaterThan(momentumAfterTwoSeconds);

  await setRange(page, '#impulseDurationSlider', 6);
  await page.locator('#applyForceButton').click();
  await page.clock.runFor(100);
  await page.locator('#resetImpulseButton').click();
  const resetValues = await page.evaluate(() => ({
    t: impulseState.t,
    velocity: impulseState.v,
    impulse: document.querySelector('#impulseVal').textContent,
    momentum: document.querySelector('#pCurVal').textContent,
  }));
  await expect(page.locator('#massSlider')).toBeEnabled();
  await page.clock.runFor(3000);
  expect(await page.evaluate(() => ({
    t: impulseState.t,
    velocity: impulseState.v,
    impulse: document.querySelector('#impulseVal').textContent,
    momentum: document.querySelector('#pCurVal').textContent,
  }))).toEqual(resetValues);
});

test('碰撞三种模型守恒关系正确且动量柱方向匹配正负号', async ({page}) => {
  await page.clock.install({time: new Date('2026-01-01T00:00:00Z')});
  await page.goto(url);
  await selectTab(page, 1);
  await expectPainted(page.locator('#collisionCanvas'));

  const initialBars = await page.locator('#collisionCanvas').evaluate(canvas => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const ratio = canvas.width / width;
    const image = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    const colorAt = (x, y) => {
      const offset = (Math.round(y * ratio) * image.width + Math.round(x * ratio)) * 4;
      return Array.from(image.data.slice(offset, offset + 4));
    };
    return {
      center: width / 2,
      aPositive: colorAt(width / 2 + 32, height - 45),
      aNegative: colorAt(width / 2 - 32, height - 45),
      bPositive: colorAt(width / 2 + 32, height - 25),
      bNegative: colorAt(width / 2 - 32, height - 25),
    };
  });
  expect(initialBars.aPositive[0]).toBeGreaterThan(initialBars.aPositive[2] * 1.5);
  expect(initialBars.aNegative[0]).toBeLessThan(initialBars.aPositive[0] * 0.5);
  expect(initialBars.bNegative[2]).toBeGreaterThan(initialBars.bNegative[0] * 1.5);
  expect(initialBars.bPositive[2]).toBeLessThan(initialBars.bNegative[2] * 0.5);

  const initialMomentum = Number(await page.locator('#pTotalVal').innerText());
  const initialEnergy = Number(await page.locator('#keTotalVal').innerText());
  for (const type of ['elastic', 'inelastic', 'partial']) {
    await page.locator('#collisionType').selectOption(type);
    await page.locator('#collisionStartButton').click();
    for (const selector of ['#m1Slider', '#v1Slider', '#m2Slider', '#v2Slider', '#collisionType']) {
      await expect(page.locator(selector)).toBeDisabled();
    }
    await advanceUntilCollision(page);
    const values = await page.evaluate(() => ({
      momentum: Number(document.querySelector('#pTotalVal').textContent),
      energy: Number(document.querySelector('#keTotalVal').textContent),
    }));
    expect(values.momentum).toBeCloseTo(initialMomentum, 1);
    if (type === 'elastic') expect(values.energy).toBeCloseTo(initialEnergy, 1);
    else expect(values.energy).toBeLessThan(initialEnergy);
    await page.locator('#collisionResetButton').click();
    await expect(page.locator('#collisionType')).toBeEnabled();
  }
});

test('三个模拟重置都会取消旧计时器，反冲输入结束后回到一致初态', async ({page}) => {
  await page.clock.install({time: new Date('2026-01-01T00:00:00Z')});
  await page.goto(url);

  await page.locator('#applyForceButton').click();
  await page.clock.runFor(100);
  await page.locator('#resetImpulseButton').click();
  await page.clock.runFor(1000);
  expect(await page.evaluate(() => impulseState.t)).toBe(0);

  await selectTab(page, 1);
  await page.locator('#collisionStartButton').click();
  await page.clock.runFor(100);
  await page.locator('#collisionResetButton').click();
  await page.clock.runFor(1000);
  expect(await page.evaluate(() => colState.t)).toBe(0);

  await selectTab(page, 2);
  await page.locator('#recoilFireButton').click();
  await page.clock.runFor(100);
  await page.locator('#resetRecoilButton').click();
  await page.clock.runFor(1000);
  expect(await page.evaluate(() => recoilState.t)).toBe(0);
  expect(await page.locator('#recoilTotalP').innerText()).toBe('0.00');

  await page.locator('#recoilFireButton').click();
  for (const selector of ['#mainMassSlider', '#projMassSlider', '#projVelSlider']) {
    await expect(page.locator(selector)).toBeDisabled();
  }
  const recoil = await page.evaluate(() => ({
    mainMomentum: Number(document.querySelector('#recoilMainP').textContent),
    projectileMomentum: Number(document.querySelector('#recoilProjP').textContent),
    total: Number(document.querySelector('#recoilTotalP').textContent),
    velocity: Number(document.querySelector('#recoilMainV').textContent),
  }));
  expect(recoil.mainMomentum + recoil.projectileMomentum).toBeCloseTo(0, 1);
  expect(recoil.total).toBeCloseTo(0, 2);
  await page.clock.runFor(6500);
  await expect(page.locator('#mainMassSlider')).toBeEnabled();
  await setRange(page, '#mainMassSlider', 6);
  await expect(page.locator('#recoilMainV')).toHaveText('0.0');
  await expect(page.locator('#recoilTotalP')).toHaveText('0.00');
});

test('切换到其他主题时运行中的模拟继续保留并更新状态', async ({page}) => {
  await page.clock.install({time: new Date('2026-01-01T00:00:00Z')});
  await page.goto(url);

  await page.locator('#applyForceButton').click();
  await page.clock.runFor(100);
  const impulseTime = await page.evaluate(() => impulseState.t);
  await selectTab(page, 1);
  await page.clock.runFor(100);
  expect(await page.evaluate(() => impulseState.applying)).toBe(true);
  expect(await page.evaluate(() => impulseState.t)).toBeGreaterThan(impulseTime);

  await page.locator('#collisionStartButton').click();
  await page.clock.runFor(60);
  const collisionTime = await page.evaluate(() => colState.t);
  await selectTab(page, 0);
  await page.clock.runFor(100);
  expect(await page.evaluate(() => colState.running)).toBe(true);
  expect(await page.evaluate(() => colState.t)).toBeGreaterThan(collisionTime);

  await selectTab(page, 2);
  await page.locator('#recoilFireButton').click();
  await page.clock.runFor(60);
  const recoilTime = await page.evaluate(() => recoilState.t);
  await selectTab(page, 0);
  await page.clock.runFor(100);
  expect(await page.evaluate(() => recoilState.fired)).toBe(true);
  expect(await page.evaluate(() => recoilState.t)).toBeGreaterThan(recoilTime);
});

test('测验选项支持键盘，同一题仅计分一次且三道不同题完成后可恢复', async ({page}) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('momentum-test-reset') !== '1') {
      localStorage.clear();
      sessionStorage.setItem('momentum-test-reset', '1');
    }
  });
  await page.goto(url);
  await selectTab(page, 3);
  const isDone = () => page.evaluate(() => PageProgress.isDone('momentum'));
  const q1 = page.locator('#quiz1Card .quiz-option');
  await q1.nth(0).focus();
  await page.keyboard.press('Enter');
  for (let index = 0; index < 4; index++) await expect(q1.nth(index)).toBeDisabled();
  await expect(page.locator('#q1Exp')).toBeVisible();
  await q1.nth(0).evaluate(button => button.click());
  expect(await isDone()).toBe(false);

  for (const [qid, answer] of [['q2', 0], ['q3', 1]]) {
    const option = page.locator(`#quiz${qid.slice(1)}Card .quiz-option`).nth(answer);
    await option.focus();
    await page.keyboard.press('Space');
    await expect(option).toBeDisabled();
  }
  expect(await isDone()).toBe(false);
});

test('首次答对三道不同题会记录完成状态并在刷新后保留', async ({page}) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('momentum-test-reset') !== '1') {
      localStorage.clear();
      sessionStorage.setItem('momentum-test-reset', '1');
    }
  });
  await page.goto(url);
  await selectTab(page, 3);
  for (const [question, answer] of [[1, 2], [2, 0], [3, 1]]) {
    const option = page.locator(`#quiz${question}Card .quiz-option`).nth(answer);
    await option.focus();
    await page.keyboard.press(question === 1 ? 'Enter' : 'Space');
    await expect(option).toBeDisabled();
  }
  const isDone = () => page.evaluate(() => PageProgress.isDone('momentum'));
  expect(await isDone()).toBe(true);
  await page.reload();
  expect(await isDone()).toBe(true);
});
