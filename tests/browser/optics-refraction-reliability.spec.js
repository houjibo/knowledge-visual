const {test, expect} = require('@playwright/test');

const url = '/physics/high/optics.html';

async function expectPainted(page, selector) {
  await expect.poll(() => page.locator(selector).evaluate(canvas => {
    const rect = canvas.getBoundingClientRect();
    let painted = false;
    if (canvas.width > 0 && canvas.height > 0) {
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] !== 0) { painted = true; break; }
      }
    }
    return {visible: rect.width > 0, sized: canvas.width > 0, painted};
  }), {timeout: 5000}).toEqual({visible: true, sized: true, painted: true});
}

test('学习模式画布绘制、切换 tab 无脚本错误', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await expect(page).toHaveTitle(/光的折射与全反射/);
  // Canvas lives only in the learn section.
  await expect(page.locator('#optCanvas')).toBeVisible();
  await expectPainted(page, '#optCanvas');

  await page.locator('.tab[data-mode="practice"]').click();
  await expect(page.locator('#sec-practice')).toBeVisible();
  await page.locator('.tab[data-mode="quiz"]').click();
  await expect(page.locator('#sec-quiz')).toBeVisible();
  expect(errors).toEqual([]);
});

test('介质切换与滑块往返更新信息并重绘', async ({page}) => {
  await page.goto(url);
  // Media buttons and slider are in the learn section.
  await expect(page.locator('#valA')).toContainText('40');

  await page.locator('.media-btn[data-media="glass-air"]').click();
  await expect(page.locator('.media-btn[data-media="glass-air"]')).toHaveClass(/active/);
  // Glass->air (dense->sparse) shows a critical angle, not "无".
  await expect(page.locator('#infoC')).not.toContainText('无');

  await page.locator('.media-btn[data-media="air-water"]').click();
  await expect(page.locator('.media-btn[data-media="air-water"]')).toHaveClass(/active/);
  // Sparse->dense has no critical angle.
  await expect(page.locator('#infoC')).toContainText('无');

  await page.fill('#sliderA', '70');
  await expect(page.locator('#valA')).toContainText('70');
  await page.fill('#sliderA', '40');
  await expect(page.locator('#valA')).toContainText('40');
  await expectPainted(page, '#optCanvas');
});

test('密到疏且大角度触发全反射提示', async ({page}) => {
  await page.goto(url);
  await page.locator('.media-btn[data-media="glass-air"]').click();
  await page.fill('#sliderA', '70');
  await expect(page.locator('#infoR')).toContainText('全反射');
});

test('练习模式三道题可作答并给反馈', async ({page}) => {
  await page.goto(url);
  await page.locator('.tab[data-mode="practice"]').click();
  const items = page.locator('#sec-practice .practice-item');
  await expect(items).toHaveCount(3);
  // Correct answer of item 1 is the option with data-ok="1".
  await page.locator('#p1 [data-ok="1"]').click();
  await expect(page.locator('#p1 .practice-fb')).toContainText(/对|正确|✓/);
});

test('测验通关写入完成标记且可刷新恢复', async ({page}) => {
  await page.goto(url);
  await page.locator('.tab[data-mode="quiz"]').click();
  await page.locator('#quizStart').click();
  const isDone = () => page.evaluate(() => PageProgress.isDone('optics'));
  expect(await isDone()).toBe(false);
  const correct = [0, 1, 1, 0, 0];
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
  await page.fill('#sliderA', '55');
  await expect(page.locator('#valA')).toContainText('55');
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
});
