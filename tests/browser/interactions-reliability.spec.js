const {test, expect} = require('@playwright/test');

const url = '/physics/high/interactions.html';

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
  await expect(page).toHaveTitle(/相互作用/);
  await expect(page.locator('#cv')).toBeVisible();
  await expectPainted(page, '#cv');

  const modes = ['compose', 'decompose', 'equilibrium', 'quiz'];
  for (const mode of modes) {
    await page.locator(`.tab[data-mode="${mode}"]`).click();
    await expect(page.locator(`.tab[data-mode="${mode}"]`)).toHaveClass(/active/);
  }
  expect(errors).toEqual([]);
});

test('力的分类子模式切换更新信息', async ({page}) => {
  await page.goto(url);
  // types tab is active by default; force-type buttons live in panelContent.
  await page.locator('.mode-btn[data-ft="friction"]').click();
  await expect(page.locator('.mode-btn[data-ft="friction"]')).toHaveClass(/active/);
  await page.locator('.mode-btn[data-ft="gravity"]').click();
  await expect(page.locator('.mode-btn[data-ft="gravity"]')).toHaveClass(/active/);
});

test('互动练习答对三题点亮完成标记且可刷新恢复', async ({page}) => {
  await page.goto(url);
  await page.locator('.tab[data-mode="quiz"]').click();
  const isDone = () => page.evaluate(() => PageProgress.isDone('interactions'));
  expect(await isDone()).toBe(false);
  // First three quiz answers are option index 0, 1, 1.
  const answers = [0, 1, 1];
  for (const index of answers) {
    await page.locator('#panelContent .quiz-opt').nth(index).click();
    await expect(page.locator('#panelContent .quiz-opt').nth(index)).toHaveClass(/correct/);
    await page.locator('#nextQ').click();
  }
  expect(await isDone()).toBe(true);
  await page.reload();
  expect(await isDone()).toBe(true);
});

test('320px 窄屏无横向溢出且 tab 可点', async ({page}) => {
  await page.setViewportSize({width: 320, height: 800});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(url);
  await page.locator('.tab[data-mode="compose"]').click();
  await expect(page.locator('.tab[data-mode="compose"]')).toHaveClass(/active/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
});
