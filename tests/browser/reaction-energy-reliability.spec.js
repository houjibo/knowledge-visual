const {test, expect} = require('@playwright/test');

const url = '/chemistry/high/reaction-energy.html';

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

test('探究模式画布绘制、切换 tab 无脚本错误', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await expect(page).toHaveTitle(/化学反应与能量/);
  await expect(page.locator('#energyCanvas')).toBeVisible();
  await expectPainted(page, '#energyCanvas');

  await page.locator('.tab[data-mode="practice"]').click();
  await expect(page.locator('#sec-practice')).toBeVisible();
  await page.locator('.tab[data-mode="quiz"]').click();
  await expect(page.locator('#sec-quiz')).toBeVisible();
  expect(errors).toEqual([]);
});

test('类型切换与双滑块往返更新信息并重绘', async ({page}) => {
  await page.goto(url);
  await page.locator('.demo-btn[data-type="endo"]').click();
  await expect(page.locator('.demo-btn[data-type="endo"]')).toHaveClass(/active/);
  await page.locator('.demo-btn[data-type="exo"]').click();
  await expect(page.locator('.demo-btn[data-type="exo"]')).toHaveClass(/active/);

  await page.fill('#sliderDH', '120');
  await expect(page.locator('#valDH')).toContainText('120 kJ/mol');
  await page.fill('#sliderEa', '60');
  await expect(page.locator('#valEa')).toContainText('60 kJ/mol');
  await expectPainted(page, '#energyCanvas');
});

test('计算模式数字输入校验并给反馈', async ({page}) => {
  await page.goto(url);
  await page.locator('.tab[data-mode="practice"]').click();
  const items = page.locator('#sec-practice .practice-item');
  await expect(items).toHaveCount(3);
  // Correct answers: a1=-183, a2=-110.5, a3=445.
  await page.fill('#a1', '-183');
  await page.locator('[data-check="a1"]').click();
  await expect(page.locator('#fb-a1')).toContainText('正确');
  await page.fill('#a3', '445');
  await page.locator('[data-check="a3"]').click();
  await expect(page.locator('#fb-a3')).toContainText('正确');
});

test('测验通关写入完成标记且可刷新恢复', async ({page}) => {
  await page.goto(url);
  await page.locator('.tab[data-mode="quiz"]').click();
  await page.locator('#quizStart').click();
  const isDone = () => page.evaluate(() => PageProgress.isDone('reaction-energy'));
  expect(await isDone()).toBe(false);
  const correct = [1, 1, 2, 1, 1];
  for (const index of correct) {
    await page.locator('#quizOpts .quiz-opt').nth(index).click();
    await page.locator('#quizNext').click();
  }
  await expect(page.locator('#quizResult')).toContainText('5 / 5');
  expect(await isDone()).toBe(true);
  await expect(page.locator('#done-mark')).toContainText('已完成');
  await page.reload();
  expect(await isDone()).toBe(true);
});

test('320px 窄屏无横向溢出且滑块可用', async ({page}) => {
  await page.setViewportSize({width: 320, height: 800});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(url);
  await page.fill('#sliderEa', '80');
  await expect(page.locator('#valEa')).toContainText('80 kJ/mol');
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
});
