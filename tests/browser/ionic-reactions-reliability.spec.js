const {test, expect} = require('@playwright/test');

const url = '/chemistry/high/ionic-reactions.html';

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

test('探究模式画布绘制、切换 tab 无脚本错误', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await expect(page).toHaveTitle(/离子反应/);
  await expect(page.locator('#ionCanvas')).toBeVisible();
  await expectPainted(page, '#ionCanvas');

  await page.locator('.tab[data-mode="practice"]').click();
  await expect(page.locator('#sec-practice')).toBeVisible();
  await page.locator('.tab[data-mode="quiz"]').click();
  await expect(page.locator('#sec-quiz')).toBeVisible();
  expect(errors).toEqual([]);
});

test('反应按钮与混合操作可交互并重绘', async ({page}) => {
  await page.goto(url);
  await page.locator('.rxn-btn[data-rxn="neutral"]').click();
  await expect(page.locator('.rxn-btn[data-rxn="neutral"]')).toHaveClass(/active/);
  await page.locator('.rxn-btn[data-rxn="agcl"]').click();
  await expect(page.locator('.rxn-btn[data-rxn="agcl"]')).toHaveClass(/active/);

  const before = await page.locator('#mixBtn').textContent();
  await page.locator('#mixBtn').click();
  await expect(page.locator('#mixBtn')).not.toHaveText(before);
  await expectPainted(page, '#ionCanvas');
});

test('练习模式三道题可作答并给反馈', async ({page}) => {
  await page.goto(url);
  await page.locator('.tab[data-mode="practice"]').click();
  const items = page.locator('#sec-practice .practice-item');
  await expect(items).toHaveCount(3);
  await page.locator('#p1 [data-ok="1"]').first().click();
  await expect(page.locator('#p1 .practice-fb')).toContainText(/正确|对|✓/);
});

test('测验通关写入完成标记且可刷新恢复', async ({page}) => {
  await page.goto(url);
  await page.locator('.tab[data-mode="quiz"]').click();
  await page.locator('#quizStart').click();
  const isDone = () => page.evaluate(() => PageProgress.isDone('ionic-reactions'));
  expect(await isDone()).toBe(false);
  const correct = [2, 1, 0, 2, 2];
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

test('320px 窄屏无横向溢出且可点', async ({page}) => {
  await page.setViewportSize({width: 320, height: 800});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(url);
  await page.locator('.rxn-btn[data-rxn="agcl"]').click();
  await expect(page.locator('.rxn-btn[data-rxn="agcl"]')).toHaveClass(/active/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
});
