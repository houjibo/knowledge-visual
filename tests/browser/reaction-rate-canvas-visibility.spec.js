const {test, expect} = require('@playwright/test');

const url = '/chemistry/high/reaction-rate.html';
const visualSections = [
  {index: 0, canvases: ['#rateCanvas']},
  {index: 1, canvases: ['#factorTemp', '#factorConc', '#factorCat', '#factorArea']},
  {index: 2, canvases: ['#eqCanvas', '#eqGraph']},
  {index: 3, canvases: ['#lechatCanvas']},
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

test('切换到每个可视化主题后全部画布均已绘制', async ({page}) => {
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

test('切换与缩放保留参数和模拟状态并重绘', async ({page}) => {
  await page.goto(url);
  await page.locator('.tab').nth(1).click();
  await page.locator('#fTempSlider').evaluate(input => {
    input.value = '8';
    input.dispatchEvent(new Event('input', {bubbles: true}));
  });
  await expect(page.locator('#fTempVal')).toHaveText('8');
  await page.locator('.tab').nth(0).click();
  await page.locator('.tab').nth(1).click();
  await expect(page.locator('#fTempVal')).toHaveText('8');
  await expectPainted(page.locator('#factorTemp'));

  await page.locator('.tab').nth(2).click();
  await page.locator('.eq-btn').nth(0).click();
  await expect(page.locator('#vForward')).not.toHaveText('0.00');
  await page.locator('.tab').nth(3).click();
  await page.locator('.tab').nth(2).click();
  await expect(page.locator('.eq-btn').nth(0)).toHaveClass(/active/);
  await expect(page.locator('#vForward')).not.toHaveText('0.00');
  await expectPainted(page.locator('#eqCanvas'));
  await expectPainted(page.locator('#eqGraph'));

  await page.setViewportSize({width: 320, height: 800});
  await expectPainted(page.locator('#eqCanvas'));
  await expectPainted(page.locator('#eqGraph'));
});
