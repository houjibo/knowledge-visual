const {test, expect} = require('@playwright/test');

const url = '/physics/high/vibration-waves.html';

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
  await expect(page).toHaveTitle(/机械振动与机械波/);
  await expect(page.locator('#waveCanvas')).toBeVisible();
  await expectPainted(page, '#waveCanvas');

  await page.locator('.tab[data-mode="practice"]').click();
  await expect(page.locator('#sec-practice')).toBeVisible();
  await page.locator('.tab[data-mode="quiz"]').click();
  await expect(page.locator('#sec-quiz')).toBeVisible();
  expect(errors).toEqual([]);
});

test('演示切换与双滑块往返更新信息并重绘', async ({page}) => {
  await page.goto(url);
  // Demo buttons live in the learn section.
  await page.locator('.demo-btn[data-demo="wave"]').click();
  await expect(page.locator('.demo-btn[data-demo="wave"]')).toHaveClass(/active/);
  await page.locator('.demo-btn[data-demo="sho"]').click();
  await expect(page.locator('.demo-btn[data-demo="sho"]')).toHaveClass(/active/);

  await page.fill('#sliderAmp', '55');
  await expect(page.locator('#valAmp')).toContainText('55');
  await page.fill('#sliderF', '1.5');
  await expect(page.locator('#valF')).toContainText('1.5');
  await page.fill('#sliderAmp', '40');
  await page.fill('#sliderF', '0.8');
  await expect(page.locator('#valF')).toContainText('0.8');
  await expectPainted(page, '#waveCanvas');
});

test('练习模式三道题可作答并给反馈', async ({page}) => {
  await page.goto(url);
  await page.locator('.tab[data-mode="practice"]').click();
  const items = page.locator('#sec-practice .practice-item');
  await expect(items).toHaveCount(3);
  await page.locator('#p1 [data-ok="1"]').click();
  await expect(page.locator('#p1 .practice-fb')).toContainText('正确');
});

test('测验通关写入完成标记且可刷新恢复', async ({page}) => {
  await page.goto(url);
  await page.locator('.tab[data-mode="quiz"]').click();
  await page.locator('#quizStart').click();
  const isDone = () => page.evaluate(() => PageProgress.isDone('vibration-waves'));
  expect(await isDone()).toBe(false);
  const correct = [0, 2, 1, 1, 3];
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
  await page.fill('#sliderAmp', '30');
  await expect(page.locator('#valAmp')).toContainText('30');
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
});
