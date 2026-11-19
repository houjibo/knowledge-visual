const {test, expect} = require('@playwright/test');

const url = '/chemistry/high/redox.html';

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
  await expect(page).toHaveTitle(/氧化还原/);
  await expect(page.locator('#mainCanvas')).toBeVisible();
  await expectPainted(page, '#mainCanvas');

  for (const mode of ['electron', 'balance', 'examples', 'quiz']) {
    await page.locator(`.tab[data-mode="${mode}"]`).click();
    await expect(page.locator(`.tab[data-mode="${mode}"]`)).toHaveClass(/active/);
  }
  expect(errors).toEqual([]);
});

test('电子转移模式滑块更新速率显示', async ({page}) => {
  await page.goto(url);
  await page.locator('.tab[data-mode="electron"]').click();
  await page.fill('#speedSlider', '2');
  await expect(page.locator('#speedVal')).toContainText('2.0x');
});

test('配平模式输入校验给出反馈', async ({page}) => {
  await page.goto(url);
  await page.locator('.tab[data-mode="balance"]').click();
  // First problem Fe + O2 -> Fe3O4, answers [3,2,1].
  await page.fill('#bal0', '3');
  await page.fill('#bal1', '2');
  await page.fill('#bal2', '1');
  await page.locator('#checkBtn').click();
  await expect(page.locator('#balResult')).toContainText('正确');
});

test('互动练习答对三题点亮完成标记且可刷新恢复', async ({page}) => {
  await page.goto(url);
  await page.locator('.tab[data-mode="quiz"]').click();
  const isDone = () => page.evaluate(() => PageProgress.isDone('redox'));
  expect(await isDone()).toBe(false);
  // Threshold is 60% of 5 = 3 correct. Answers: [2,2,0,1,2].
  const correct = [2, 2, 0];
  for (const index of correct) {
    await page.locator('#panel .quiz-opt').nth(index).click();
    await expect(page.locator('#panel .quiz-opt').nth(index)).toHaveClass(/correct/);
    await page.locator('#nextQ').click();
  }
  expect(await isDone()).toBe(true);
  await expect(page.locator('#done-mark')).toContainText('已完成');
  await page.reload();
  expect(await isDone()).toBe(true);
});

test('320px 窄屏无横向溢出且 tab 可点', async ({page}) => {
  await page.setViewportSize({width: 320, height: 800});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(url);
  await page.locator('.tab[data-mode="examples"]').click();
  await expect(page.locator('.tab[data-mode="examples"]')).toHaveClass(/active/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
});
