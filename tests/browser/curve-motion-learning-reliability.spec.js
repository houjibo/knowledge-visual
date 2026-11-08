const {test, expect} = require('@playwright/test');

const url = '/physics/high/curve-motion.html';
const visualSections = [
  {index: 0, canvases: ['#boatCanvas']},
  {index: 1, canvases: ['#projectileCanvas', '#angledCanvas']},
  {index: 2, canvases: ['#circularCanvas', '#vertCircleCanvas']},
];

async function expectPainted(canvas) {
  await expect(canvas).toBeVisible();
  const result = await canvas.evaluate(element => {
    const rect = element.getBoundingClientRect();
    if (!element.width || !element.height) {
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

async function setRange(page, selector, value) {
  await page.locator(selector).evaluate((input, nextValue) => {
    input.value = nextValue;
    input.dispatchEvent(new Event('input', {bubbles: true}));
  }, String(value));
  await expect(page.locator(selector)).toHaveValue(String(value));
}

test('五张曲线运动画布在首次显示、标签切换和缩放后均可见并绘制', async ({page}) => {
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

test('运行中的五种模拟切换主题后可恢复并保留参数', async ({page}) => {
  await page.goto(url);
  const animations = [
    {section: 0, button: 0, canvas: '#boatCanvas', slider: '#boatSpeedSlider', value: 5},
    {section: 1, button: 0, canvas: '#projectileCanvas', slider: '#projV0Slider', value: 15},
    {section: 1, button: 1, canvas: '#angledCanvas', slider: '#aAngleSlider', value: 60},
    {section: 2, button: 0, canvas: '#circularCanvas', slider: '#radiusSlider', value: 4},
    {section: 2, button: 1, canvas: '#vertCircleCanvas', slider: '#vertSpeedSlider', value: 15},
  ];

  for (const animation of animations) {
    await page.locator('.tab').nth(animation.section).click();
    await setRange(page, animation.slider, animation.value);
    await page.locator(`#sec${animation.section} .btn-primary`).nth(animation.button).click();
    await expectPainted(page.locator(animation.canvas));

    const hiddenSection = animation.section === 2 ? 0 : animation.section + 1;
    await page.locator('.tab').nth(hiddenSection).click();
    await page.waitForTimeout(120);
    await page.locator('.tab').nth(animation.section).click();

    await expect(page.locator(animation.slider)).toHaveValue(String(animation.value));
    await expectPainted(page.locator(animation.canvas));
  }
});

test('重复答对同一题不达标，答对五道不同题后完成并能刷新恢复', async ({page}) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('curve-motion-test-reset') !== '1') {
      localStorage.clear();
      sessionStorage.setItem('curve-motion-test-reset', '1');
    }
  });
  await page.goto(url);
  await page.locator('.tab').nth(3).click();
  const isDone = () => page.evaluate(() => PageProgress.isDone('curve-motion'));
  const next = page.locator('#sec3 .btn-primary');

  for (let cycle = 0; cycle < 5; cycle++) {
    await page.locator('#qopt1').click();
    if (cycle < 4) {
      await next.click();
      for (let question = 1; question < 8; question++) {
        await page.locator('#qopt0').click();
        await next.click();
      }
    }
  }
  expect(await isDone()).toBe(false);
  await expect(page.locator('#distinctCorrectDisplay')).toHaveText('1 / 5');

  await next.click();
  await page.locator('#qopt2').click();
  await next.click();
  await page.locator('#qopt1').click();
  await next.click();
  await page.locator('#qopt1').click();
  await next.click();
  await page.locator('#qopt2').click();

  expect(await isDone()).toBe(true);
  await expect(page.locator('#distinctCorrectDisplay')).toHaveText('5 / 5');
  await page.reload();
  expect(await isDone()).toBe(true);
  await page.locator('.tab').nth(3).click();
  await expect(page.locator('#distinctCorrectDisplay')).toHaveText('5 / 5');
});
