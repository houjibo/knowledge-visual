const {test, expect} = require('@playwright/test');

const url = '/chemistry/high/02-periodic.html';

async function expectPainted(page, selector) {
  const result = await page.locator(selector).evaluate(canvas => {
    const rect = canvas.getBoundingClientRect();
    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let painted = false;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] !== 0) { painted = true; break; }
    }
    return {displayWidth: rect.width, width: canvas.width, painted};
  });
  expect(result.displayWidth).toBeGreaterThan(0);
  expect(result.width).toBeGreaterThan(0);
  expect(result.painted).toBe(true);
}

test('三个 tab 可切换且趋势画布绘制、无脚本错误', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await expect(page).toHaveTitle(/元素周期律/);
  await page.locator('#tab0').click();
  await expect(page.locator('#sec0')).toBeVisible();
  await page.locator('#tab1').click();
  await expect(page.locator('#sec1')).toBeVisible();
  // Trend canvas lives in the trend section and paints after switching.
  await expectPainted(page, '#cvTrend');
  await page.locator('#tab2').click();
  await expect(page.locator('#sec2')).toBeVisible();
  expect(errors).toEqual([]);
});

test('周期表网格可选择并显示元素详情', async ({page}) => {
  await page.goto(url);
  const cells = page.locator('#ptGrid .pt-cell:not(.empty)');
  expect(await cells.count()).toBe(36);
  await cells.first().click();
  await expect(page.locator('#detailCard')).toBeVisible();
  await expect(page.locator('#dSym')).not.toBeEmpty();
});

test('规律预测答对五题以上记录完成且可刷新恢复', async ({page}) => {
  await page.goto(url);
  await page.locator('#tab2').click();
  const isDone = () => page.evaluate(() => PageProgress.isDone('02-periodic'));
  expect(await isDone()).toBe(false);
  // 8-question quiz answers; threshold is 60% = 5 correct.
  const correct = [1, 1, 0, 1, 1, 2, 1, 1];
  for (const index of correct) {
    await page.locator('#quizOpts .quiz-opt').nth(index).click();
    await page.locator('button[onclick^="nextQuiz"]').click();
  }
  await expect(page.locator('#quizResult')).toContainText('已记录完成');
  expect(await isDone()).toBe(true);
  await page.reload();
  expect(await isDone()).toBe(true);
});

test('320px 窄屏无横向溢出且 tab 可点', async ({page}) => {
  await page.setViewportSize({width: 320, height: 800});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(url);
  await page.locator('#tab1').click();
  await expect(page.locator('#tab1')).toHaveClass(/active/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
});
