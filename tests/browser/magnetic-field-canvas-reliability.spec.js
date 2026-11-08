const {test, expect} = require('@playwright/test');

const url = '/physics/high/magnetic-field.html';
const visualSections = [
  {index: 0, canvas: '#fieldCanvas'},
  {index: 1, canvas: '#ampereCanvas'},
  {index: 2, canvas: '#lorentzCanvas'},
  {index: 3, canvas: '#orbitCanvas'},
];

async function expectPainted(canvas) {
  await expect(canvas).toBeVisible();
  const result = await canvas.evaluate(element => {
    const rect = element.getBoundingClientRect();
    let painted = false;
    if (element.width && element.height) {
      const pixels = element.getContext('2d').getImageData(0, 0, element.width, element.height).data;
      for (let alpha = 3; alpha < pixels.length; alpha += 4) {
        if (pixels[alpha] !== 0) { painted = true; break; }
      }
    }
    return {
      displayWidth: rect.width,
      displayHeight: rect.height,
      width: element.width,
      height: element.height,
      painted,
    };
  });
  expect(result.displayWidth).toBeGreaterThan(0);
  expect(result.displayHeight).toBeGreaterThan(0);
  expect(result.width).toBeGreaterThan(0);
  expect(result.height).toBeGreaterThan(0);
  expect(result.painted).toBe(true);
}

async function setRange(page, selector, value) {
  await page.locator(selector).evaluate((input, nextValue) => {
    input.value = nextValue;
    input.dispatchEvent(new Event('input', {bubbles: true}));
  }, String(value));
  await expect(page.locator(selector)).toHaveValue(String(value));
}

test('四个主题的画布在首次进入、切换和窄屏缩放后均可见并绘制', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);

  for (const section of visualSections) {
    await page.locator('.tab').nth(section.index).click();
    await expect(page.locator(`#sec${section.index}`)).toBeVisible();
    await expectPainted(page.locator(section.canvas));
  }

  await page.setViewportSize({width: 320, height: 844});
  for (const section of visualSections) {
    await page.locator('.tab').nth(section.index).click();
    await expectPainted(page.locator(section.canvas));
  }
  expect(errors).toEqual([]);
});

test('磁针位置和三个主题的参数在切换及缩放后保留', async ({page}) => {
  await page.goto(url);
  const fieldCanvas = page.locator('#fieldCanvas');
  const fieldBox = await fieldCanvas.boundingBox();
  await fieldCanvas.click({position: {x: fieldBox.width * 0.75, y: fieldBox.height / 2}});
  await expect(page.locator('#needlePos')).not.toHaveText('—');
  await page.locator('.magnet-btn').nth(1).click();
  await expect(page.locator('.magnet-btn').nth(1)).toHaveClass(/active/);
  const oldWidth = await page.locator('#fieldCanvas').evaluate(canvas => canvas.clientWidth);
  const oldNeedleFraction = await page.evaluate(() => needleX / fieldC.clientWidth);

  await page.locator('.tab').nth(1).click();
  await setRange(page, '#bSlider', 1);
  await expect(page.locator('#forceVal')).toHaveText('0.60');
  await page.locator('#sec1 .btn').nth(1).click();
  await expect(page.locator('#forceDir')).toContainText('向左');

  await page.locator('.tab').nth(2).click();
  await setRange(page, '#vSlider', 4);
  await page.locator('#sec2 .btn').nth(1).click();
  await expect(page.locator('#dirVal')).toContainText('向下偏转');

  await page.locator('.tab').nth(3).click();
  await setRange(page, '#ovSlider', 4);
  await setRange(page, '#obSlider', 1);
  await expect(page.locator('#orVal')).toHaveText('8.0');

  await page.setViewportSize({width: 320, height: 844});
  await page.locator('.tab').nth(0).click();
  await expectPainted(page.locator('#fieldCanvas'));
  await expect(page.locator('.magnet-btn').nth(1)).toHaveClass(/active/);
  await expect(page.locator('#needlePos')).not.toHaveText('—');
  const newWidth = await page.locator('#fieldCanvas').evaluate(canvas => canvas.clientWidth);
  const newNeedleFraction = await page.evaluate(() => needleX / fieldC.clientWidth);
  expect(oldNeedleFraction).toBeGreaterThan(0.5);
  expect(newWidth).toBeLessThan(oldWidth);
  expect(newNeedleFraction).toBeCloseTo(oldNeedleFraction, 1);

  await page.locator('.tab').nth(1).click();
  await expect(page.locator('#bSlider')).toHaveValue('1');
  await expect(page.locator('#forceDir')).toContainText('向左');
  await expectPainted(page.locator('#ampereCanvas'));
  await page.locator('.tab').nth(2).click();
  await expect(page.locator('#vSlider')).toHaveValue('4');
  await expect(page.locator('#dirVal')).toContainText('向下偏转');
  await expectPainted(page.locator('#lorentzCanvas'));
  await page.locator('.tab').nth(3).click();
  await expect(page.locator('#ovSlider')).toHaveValue('4');
  await expect(page.locator('#obSlider')).toHaveValue('1');
  await expect(page.locator('#orVal')).toHaveText('8.0');
  await expectPainted(page.locator('#orbitCanvas'));
});

test('轨道和洛伦兹粒子动画仅在主题可见时推进，并在返回后继续', async ({page}) => {
  await page.goto(url);
  expect(await page.evaluate(() => orbAnimId)).toBe(null);

  await page.locator('.tab').nth(3).click();
  const orbitBefore = await page.evaluate(() => orbAngle);
  await page.waitForTimeout(100);
  const orbitStarted = await page.evaluate(() => orbAngle);
  expect(orbitStarted).not.toBe(orbitBefore);

  await page.locator('.tab').nth(0).click();
  const orbitPaused = await page.evaluate(() => orbAngle);
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => orbAngle)).toBe(orbitPaused);
  await page.locator('.tab').nth(3).click();
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => orbAngle)).not.toBe(orbitPaused);

  await page.locator('.tab').nth(2).click();
  await page.locator('#sec2 .btn').nth(2).click();
  await page.waitForTimeout(100);
  const particleStarted = await page.evaluate(() => particleT);
  expect(particleStarted).toBeGreaterThan(0);
  await page.locator('.tab').nth(0).click();
  const particlePaused = await page.evaluate(() => particleT);
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => particleT)).toBe(particlePaused);
  await page.locator('.tab').nth(2).click();
  await expectPainted(page.locator('#lorentzCanvas'));
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => particleT)).toBeGreaterThan(particlePaused);
});

test('测验同题重复不计入三道题，答对不同题后完成且刷新保留', async ({page}) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('magnetic-field-test-reset') !== '1') {
      localStorage.clear();
      sessionStorage.setItem('magnetic-field-test-reset', '1');
    }
  });
  await page.goto(url);
  await page.locator('.tab').nth(4).click();
  const isDone = () => page.evaluate(() => PageProgress.isDone('magnetic-field'));
  const firstQuestionCorrect = page.locator('#q0 .quiz-option').nth(2);

  await firstQuestionCorrect.click();
  await firstQuestionCorrect.click();
  await firstQuestionCorrect.click();
  expect(await isDone()).toBe(false);
  await page.locator('#q1 .quiz-option').nth(1).click();
  expect(await isDone()).toBe(false);
  await page.locator('#q2 .quiz-option').nth(1).click();
  expect(await isDone()).toBe(true);
  await page.reload();
  expect(await isDone()).toBe(true);
});
