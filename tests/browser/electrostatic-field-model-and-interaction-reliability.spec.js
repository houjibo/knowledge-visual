const {test, expect} = require('@playwright/test');

const url = '/physics/high/electrostatic-field.html';

async function setRange(page, selector, value) {
  const input = page.locator(selector);
  await input.evaluate((element, nextValue) => {
    element.value = String(nextValue);
    element.dispatchEvent(new Event('input', {bubbles: true}));
  }, value);
  await expect(input).toHaveValue(String(value));
}

async function pixelAt(page, selector, x, y) {
  return page.locator(selector).evaluate((canvas, point) => {
    const {data} = canvas.getContext('2d').getImageData(point.x, point.y, 1, 1);
    return [...data];
  }, {x, y});
}

async function advance(page) {
  await page.clock.runFor(1500);
}

test('语义主题标签支持键盘导航并关联四个面板', async ({page, isMobile}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  if (isMobile) await page.setViewportSize({width: 320, height: 844});
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(isMobile ? 320 : 1280);
  if (isMobile) {
    const navigation = await page.locator('.kv-nav').boundingBox();
    const title = await page.locator('.header h1').boundingBox();
    expect(navigation.y + navigation.height).toBeLessThanOrEqual(title.y);
  }
  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(4);
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', {name: '库仑定律'})).toBeVisible();
  await tabs.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(page.getByRole('tabpanel', {name: '电场线'})).toBeVisible();
  await page.keyboard.press('End');
  await expect(tabs.nth(3)).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', {name: '互动练习'})).toBeVisible();
  await page.keyboard.press('Home');
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('img', {name: /库仑力示意图/})).toBeVisible();
  expect(errors).toEqual([]);
});

test('库仑力使用 μC 与米，零电荷中性且方向和反平方关系正确', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await expect(page.locator('#forceValue')).toHaveText('5.99');
  await expect(page.locator('#distValue')).toHaveText('0.15 m');
  await expect(page.locator('#forceDirection')).toHaveAttribute('data-force-type', 'attractive');

  await setRange(page, '#distSlider', 0.3);
  await expect(page.locator('#forceValue')).toHaveText('1.50');
  await setRange(page, '#distSlider', 0.15);
  await setRange(page, '#q2Slider', 3);
  await expect(page.locator('#forceDirection')).toHaveAttribute('data-force-type', 'repulsive');
  await setRange(page, '#q1Slider', 0);
  await expect(page.locator('#forceValue')).toHaveText('0.00');
  await expect(page.locator('#forceDirection')).toHaveAttribute('data-force-type', 'none');
  const neutralChargePixel = await pixelAt(page, '#coulombCanvas', 275, 220);
  expect(neutralChargePixel.slice(0, 3)).toEqual([96, 125, 139]);
  const forceArrowGapAlpha = await page.locator('#coulombCanvas').evaluate(canvas =>
    canvas.getContext('2d').getImageData(330, 200, 1, 1).data[3]);
  expect(forceArrowGapAlpha).toBe(0);
  expect(errors).toEqual([]);
});

test('电势图显示带符号的伏特色图和总电势等势线', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.getByRole('tab', {name: '电势分布'}).click();
  const canvas = page.locator('#potentialCanvas');
  await expect(canvas).toHaveAttribute('data-configuration', 'dipole');
  await expect(page.getByText(/±1 MV 饱和/)).toBeVisible();

  await page.locator('#singlePositive').click();
  const positivePixel = await pixelAt(page, '#potentialCanvas', 410, 250);
  expect(positivePixel[0]).toBeGreaterThan(positivePixel[2]);
  await page.locator('#singleNegative').click();
  const negativePixel = await pixelAt(page, '#potentialCanvas', 410, 250);
  expect(negativePixel[2]).toBeGreaterThan(negativePixel[0]);
  await page.locator('#dipole').click();
  const neutralPixel = await pixelAt(page, '#potentialCanvas', 350, 250);
  expect(Math.max(...neutralPixel.slice(0, 3)) - Math.min(...neutralPixel.slice(0, 3))).toBeLessThan(15);
  expect(errors).toEqual([]);
});

test('电荷画布可键盘添加、移动和删除并播报状态', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.getByRole('tab', {name: '电场线'}).click();
  const canvas = page.getByRole('application', {name: '可交互点电荷画布'});
  const status = page.locator('#fieldStatus');
  await expect(status).toContainText('当前共 2 个电荷');
  await canvas.focus();
  await page.keyboard.press('Shift+Equal');
  await expect(status).toContainText('当前共 3 个电荷');
  await expect(status).toContainText('350, 250 px');
  await page.keyboard.press('ArrowRight');
  await expect(status).toContainText('355, 250 px');
  await page.keyboard.press('Delete');
  await expect(status).toContainText('当前共 2 个电荷');
  expect(errors).toEqual([]);
});

test('Pointer Events 拖动不会额外添加电荷；窄屏触控可在空白处添加', async ({page, isMobile}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.getByRole('tab', {name: '电场线'}).click();
  if (isMobile) await page.setViewportSize({width: 320, height: 844});
  const canvas = page.locator('#fieldCanvas');
  const rect = await canvas.boundingBox();
  const status = page.locator('#fieldStatus');
  if (isMobile) {
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    await page.touchscreen.tap(rect.x + rect.width * 0.82, rect.y + rect.height * 0.72);
    await expect(status).toContainText('当前共 3 个电荷');
  } else {
    await page.mouse.move(rect.x + rect.width * 250 / 700, rect.y + rect.height * 250 / 500);
    await page.mouse.down();
    await page.mouse.move(rect.x + rect.width * 280 / 700, rect.y + rect.height * 280 / 500);
    await page.mouse.up();
    await expect(status).toContainText('当前共 2 个电荷');
    await expect(status).toContainText('280, 280 px');
  }
  expect(errors).toEqual([]);
});

test('测验拒绝快速重复作答，三道不同题计入一次进度，重练不重复累计', async ({page}) => {
  await page.clock.install({time: new Date('2026-01-01T00:00:00Z')});
  await page.addInitScript(() => {
    window.__completionWrites = 0;
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'kv-physics-high-progress' && JSON.parse(value)['electrostatic-field']) {
        window.__completionWrites++;
      }
      return originalSetItem.call(this, key, value);
    };
  });
  await page.goto(url);
  await page.getByRole('tab', {name: '互动练习'}).click();

  const answer = async index => {
    await page.locator('.quiz-option').nth(index).evaluate(button => {
      button.dispatchEvent(new MouseEvent('click', {bubbles: true}));
    });
  };
  await answer(2);
  await page.locator('.quiz-option').nth(0).evaluate(button => {
    button.dispatchEvent(new MouseEvent('click', {bubbles: true}));
  });
  await expect(page.locator('.quiz-option:disabled')).toHaveCount(4);
  await expect(page.locator('#quizResult')).toContainText('正确');
  await advance(page);
  await expect(page.locator('#quizContainer')).toContainText('第 2 / 4 题');

  await answer(1);
  await advance(page);
  await answer(1);
  await expect.poll(() => page.evaluate(() => PageProgress.isDone('electrostatic-field'))).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__completionWrites)).toBe(1);
  await advance(page);
  await answer(0);
  await advance(page);
  await expect(page.locator('#quizScore')).toHaveText('得分：3 / 4');

  await page.locator('#resetQuiz').click();
  await expect(page.locator('#quizContainer')).toContainText('第 1 / 4 题');
  await answer(2);
  await expect.poll(() => page.evaluate(() => window.__completionWrites)).toBe(1);
  await advance(page);
  await expect(page.locator('#quizContainer')).toContainText('第 2 / 4 题');
});
