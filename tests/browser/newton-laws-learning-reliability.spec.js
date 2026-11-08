const {test, expect} = require('@playwright/test');

const url = '/physics/high/newton-laws.html';
const visualSections = [
  {index: 0, canvases: ['#inertiaCanvas', '#fmaCanvas', '#n3Canvas']},
  {index: 2, canvases: ['#connectCanvas', '#inclineCanvas']},
];

async function expectPainted(canvas) {
  await expect(canvas).toBeVisible();
  const result = await canvas.evaluate(element => {
    const rect = element.getBoundingClientRect();
    if (element.width === 0 || element.height === 0) {
      return {displayWidth: rect.width, displayHeight: rect.height, width: element.width, height: element.height, painted: false};
    }
    const pixels = element.getContext('2d').getImageData(0, 0, element.width, element.height).data;
    let painted = false;
    for (let alpha = 3; alpha < pixels.length; alpha += 4) {
      if (pixels[alpha] !== 0) { painted = true; break; }
    }
    return {displayWidth: rect.width, displayHeight: rect.height, width: element.width, height: element.height, painted};
  });
  expect(result.displayWidth).toBeGreaterThan(0);
  expect(result.displayHeight).toBeGreaterThan(0);
  expect(result.width).toBeGreaterThan(0);
  expect(result.height).toBeGreaterThan(0);
  expect(result.painted).toBe(true);
}

test('首次显示、切换和缩放后五张画布都能绘制', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);

  for (const section of visualSections) {
    await page.locator('.tab').nth(section.index).click();
    await expect(page.locator(`#sec${section.index}`)).toBeVisible();
    for (const selector of section.canvases) await expectPainted(page.locator(selector));
  }

  await page.setViewportSize({width: 320, height: 844});
  for (const section of visualSections) {
    await page.locator('.tab').nth(section.index).click();
    for (const selector of section.canvases) await expectPainted(page.locator(selector));
  }
  expect(errors).toEqual([]);
});

test('连接体滑块、标签往返和缩放保留参数并重绘', async ({page}) => {
  await page.goto(url);
  await page.locator('.tab').nth(2).click();
  await page.locator('#m1Slider').evaluate(input => {
    input.value = '3';
    input.dispatchEvent(new Event('input', {bubbles: true}));
  });
  await expect(page.locator('#m1Val')).toHaveText('3');
  await expect(page.locator('#connAccel')).toHaveText('3.3');
  await expectPainted(page.locator('#connectCanvas'));

  await page.locator('.tab').nth(0).click();
  await page.locator('.tab').nth(2).click();
  await expect(page.locator('#m1Val')).toHaveText('3');
  await expectPainted(page.locator('#connectCanvas'));
  await expectPainted(page.locator('#inclineCanvas'));

  await page.setViewportSize({width: 320, height: 800});
  await expectPainted(page.locator('#connectCanvas'));
  await expectPainted(page.locator('#inclineCanvas'));

  await page.locator('.tab').nth(0).click();
  await page.locator('#sec0 .btn-primary').nth(1).click();
  await expect(page.locator('#velDisplay')).not.toHaveText('0.0');
  await page.locator('.tab').nth(2).click();
  await page.waitForTimeout(120);
  await page.locator('.tab').nth(0).click();
  await expect(page.locator('#velDisplay')).not.toHaveText('0.0');
  await expectPainted(page.locator('#fmaCanvas'));
});

test('重复答对同题不计为三道不同题，且完成可刷新恢复', async ({page}) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('newton-laws-test-reset') !== '1') {
      localStorage.clear();
      sessionStorage.setItem('newton-laws-test-reset', '1');
    }
  });
  await page.goto(url);
  await page.locator('.tab').nth(3).click();
  const isDone = () => page.evaluate(() => PageProgress.isDone('newton-laws'));

  for (let repeat = 0; repeat < 3; repeat++) {
    await page.locator('#qopt1').click();
    if (repeat < 2) {
      for (let next = 0; next < 8; next++) await page.locator('#sec3 .btn-primary').click();
    }
  }
  expect(await isDone()).toBe(false);
  await expect(page.locator('#distinctCorrectDisplay')).toHaveText('1 / 3');

  await page.locator('#sec3 .btn-primary').click();
  await page.locator('#qopt2').click();
  await expect(page.locator('#distinctCorrectDisplay')).toHaveText('2 / 3');
  await page.locator('#sec3 .btn-primary').click();
  await page.locator('#qopt2').click();
  expect(await isDone()).toBe(true);
  await expect(page.locator('#distinctCorrectDisplay')).toHaveText('3 / 3');

  await page.reload();
  expect(await isDone()).toBe(true);
  await expect(page.locator('#distinctCorrectDisplay')).toHaveText('3 / 3');
});
