const {test, expect} = require('@playwright/test');

const url = '/physics/high/thermal.html';

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
  await expect(page).toHaveTitle(/热/);
  // Canvas lives only in the learn section.
  await expect(page.locator('#gasCanvas')).toBeVisible();
  await expectPainted(page, '#gasCanvas');

  await page.locator('.tab[data-mode="practice"]').click();
  await expect(page.locator('#sec-practice')).toBeVisible();
  await page.locator('.tab[data-mode="quiz"]').click();
  await expect(page.locator('#sec-quiz')).toBeVisible();
  expect(errors).toEqual([]);
});

test('过程按钮与双滑块往返更新信息并重绘', async ({page}) => {
  await page.goto(url);
  // Process buttons and sliders live in the learn section.
  await page.locator('.proc-btn[data-proc="isobaric"]').click();
  await expect(page.locator('.proc-btn[data-proc="isobaric"]')).toHaveClass(/active/);
  await page.locator('.proc-btn[data-proc="isochoric"]').click();
  await expect(page.locator('.proc-btn[data-proc="isochoric"]')).toHaveClass(/active/);
  await page.locator('.proc-btn[data-proc="isothermal"]').click();
  await expect(page.locator('.proc-btn[data-proc="isothermal"]')).toHaveClass(/active/);

  await page.fill('#sliderMain', '3.5');
  await expect(page.locator('#valMain')).toContainText('3.5');
  await page.fill('#sliderT', '450');
  await expect(page.locator('#valT')).toContainText('450');
  await page.fill('#sliderMain', '2');
  await page.fill('#sliderT', '300');
  await expect(page.locator('#valT')).toContainText('300');
  await expectPainted(page, '#gasCanvas');
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
  const isDone = () => page.evaluate(() => PageProgress.isDone('thermal'));
  expect(await isDone()).toBe(false);
  const correct = [0, 1, 0, 1, 1];
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
  await page.fill('#sliderT', '400');
  await expect(page.locator('#valT')).toContainText('400');
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
});
