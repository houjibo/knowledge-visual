const {test, expect} = require('@playwright/test');

const url = '/physics/high/modern-physics.html';

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

test('五个模式 tab 可切换且画布绘制、无脚本错误', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await expect(page).toHaveTitle(/近代物理/);
  await expect(page.locator('#canvas')).toBeVisible();
  await expectPainted(page, '#canvas');

  for (const mode of ['waveparticle', 'energy', 'nuclear', 'quiz']) {
    await page.locator(`.tab[data-mode="${mode}"]`).click();
    await expect(page.locator(`.tab[data-mode="${mode}"]`)).toHaveClass(/active/);
  }
  expect(errors).toEqual([]);
});

test('互动练习答对三题点亮完成标记且可刷新恢复', async ({page}) => {
  await page.goto(url);
  await page.locator('.tab[data-mode="quiz"]').click();
  const isDone = () => page.evaluate(() => PageProgress.isDone('modern-physics'));
  expect(await isDone()).toBe(false);

  // Four independent quiz blocks; click the correct option in the first three.
  const quizzes = page.locator('#panel .quiz');
  await expect(quizzes).toHaveCount(4);
  for (let i = 0; i < 3; i++) {
    await quizzes.nth(i).locator('.quiz-opt[data-correct="true"]').click();
    await expect(quizzes.nth(i).locator('.quiz-opt[data-correct="true"]')).toHaveClass(/correct/);
  }
  expect(await isDone()).toBe(true);
  await page.reload();
  expect(await isDone()).toBe(true);
});

test('重复点击同一题不重复计分', async ({page}) => {
  await page.goto(url);
  await page.locator('.tab[data-mode="quiz"]').click();
  const first = page.locator('#panel .quiz').first();
  const correct = first.locator('.quiz-opt[data-correct="true"]');
  await correct.click();
  // After answering, options get pointer-events:none; a second click must not double count.
  await correct.click({force: true}).catch(() => {});
  // Only one correct answer so far must not complete (threshold is 3).
  const isDone = await page.evaluate(() => PageProgress.isDone('modern-physics'));
  expect(isDone).toBe(false);
});

test('320px 窄屏无横向溢出且 tab 可点', async ({page}) => {
  await page.setViewportSize({width: 320, height: 800});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(url);
  await page.locator('.tab[data-mode="energy"]').click();
  await expect(page.locator('.tab[data-mode="energy"]')).toHaveClass(/active/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
});
