const {test, expect} = require('@playwright/test');
const url = '/science/forces.html';

async function keyboardClick(page, locator) {
  await locator.focus();
  await page.keyboard.press('Enter');
}
async function visitModes(page) {
  await keyboardClick(page, page.locator('[data-section="pushpull"]'));
  await keyboardClick(page, page.locator('[data-section="effect"]'));
  await keyboardClick(page, page.locator('[data-section="quiz"]'));
}
async function answerQuiz(page) {
  for (const [i, answer] of [2, 2, 1, 1, 2].entries()) {
    await expect(page.locator('#quizQ')).toContainText(`${i + 1}.`);
    await keyboardClick(page, page.locator('#quizOpts button').nth(answer));
    await expect(page.locator('#quizFeedback')).toContainText('正确');
    if (i < 4) await keyboardClick(page, page.locator('#nextBtn'));
  }
}

test('键盘切换模式并操作推拉、形变及运动示范', async ({page}) => {
  await page.goto(url);
  await keyboardClick(page, page.locator('#canvasAction'));
  await expect(page.locator('#actionStatus')).toContainText('推动小球');
  await keyboardClick(page, page.locator('[data-section="pushpull"]'));
  await expect(page.locator('[data-section="pushpull"]')).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('推拉力度档位：').fill('8');
  await expect(page.locator('#forceVal')).toHaveText('8 档');
  await keyboardClick(page, page.locator('#canvasAction'));
  await expect(page.locator('#actionStatus')).toContainText('推动箱子');
  await keyboardClick(page, page.locator('[data-mode="pull"]'));
  await expect(page.locator('[data-mode="pull"]')).toHaveAttribute('aria-pressed', 'true');
  await keyboardClick(page, page.locator('#canvasAction'));
  await expect(page.locator('#actionStatus')).toContainText('已拉伸');
  expect(await page.evaluate(() => manualSpringStretch)).toBe(64);
  await keyboardClick(page, page.locator('#canvasAction'));
  await expect(page.locator('#actionStatus')).toContainText('已松开');
  await keyboardClick(page, page.locator('[data-section="effect"]'));
  await page.getByLabel('实验力度档位：').fill('7');
  await expect(page.locator('#effectVal')).toHaveText('7 档');
  await keyboardClick(page, page.locator('#canvasAction'));
  await expect(page.locator('#actionStatus')).toContainText('挤压');
  await keyboardClick(page, page.locator('[data-exp="motion"]'));
  await keyboardClick(page, page.locator('#canvasAction'));
  await expect(page.locator('#actionStatus')).toContainText('发射');
  await keyboardClick(page, page.locator('[data-exp="gravity"]'));
  await keyboardClick(page, page.locator('#canvasAction'));
  await expect(page.locator('#actionStatus')).toContainText('释放苹果');
});

test('弹簧仅在拖动右端时变化，施加力随伸长或压缩改变方向', async ({page}) => {
  await page.goto(url);
  await page.locator('[data-section="pushpull"]').click();
  await page.locator('[data-mode="pull"]').click();
  await expect(page.locator('#section-pushpull')).toContainText('不是实际测量');
  await page.evaluate(() => {
    window.forceArrows = [];
    const original = drawArrow;
    drawArrow = (...args) => { window.forceArrows.push(args); original(...args); };
  });
  const canvas = page.locator('canvas');
  await canvas.scrollIntoViewIfNeeded();
  const bounds = await canvas.boundingBox();
  const point = (x, y) => ({x: bounds.x + x * bounds.width / 700, y: bounds.y + y * bounds.height / 560});
  let p = point(100, 100);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  p = point(150, 100);
  await page.mouse.move(p.x, p.y);
  expect(await page.evaluate(() => manualSpringStretch)).toBe(0);
  await page.mouse.up();

  p = point(450, 280);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  p = point(490, 280);
  await page.mouse.move(p.x, p.y);
  await expect.poll(() => page.evaluate(() => manualSpringStretch)).toBeGreaterThan(35);
  await expect.poll(() => page.evaluate(() => window.forceArrows.some(a => a[5] === '拉力示意' && a[2] > a[0]))).toBe(true);
  await page.mouse.up();
  expect(await page.evaluate(() => manualSpringStretch)).toBe(0);

  p = point(450, 280);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  p = point(410, 280);
  await page.mouse.move(p.x, p.y);
  await expect.poll(() => page.evaluate(() => manualSpringStretch)).toBeLessThan(-35);
  await expect.poll(() => page.evaluate(() => window.forceArrows.some(a => a[5] === '推力示意' && a[2] < a[0]))).toBe(true);
  await page.mouse.up();
  expect(await page.evaluate(() => manualSpringStretch)).toBe(0);
});

test('手机手指可拖动弹簧，取消触摸后可再次操作', async ({page, isMobile}) => {
  test.skip(!isMobile, '需要支持触摸的移动视口');
  await page.goto(url);
  await page.locator('[data-section="pushpull"]').tap();
  await page.locator('[data-mode="pull"]').tap();
  await expect(page.locator('#dragHint')).toContainText('画布外滑动');
  const canvas = page.locator('canvas');
  await canvas.scrollIntoViewIfNeeded();
  const bounds = await canvas.boundingBox();
  const point = (x, y) => ({x: bounds.x + x * bounds.width / 700, y: bounds.y + y * bounds.height / 560});
  const cdp = await page.context().newCDPSession(page);
  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', {type, touchPoints: points});
  await page.evaluate(() => {
    window.pointerTypes = [];
    canvas.addEventListener('pointerdown', event => window.pointerTypes.push(event.pointerType));
  });

  const scrollY = await page.evaluate(() => window.scrollY);
  await touch('touchStart', [point(450, 280)]);
  await touch('touchMove', [point(500, 300)]);
  await expect.poll(() => page.evaluate(() => manualSpringStretch)).toBeGreaterThan(40);
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
  expect(await page.evaluate(() => window.pointerTypes)).toContain('touch');
  await touch('touchEnd', []);
  expect(await page.evaluate(() => manualSpringStretch)).toBe(0);

  await touch('touchStart', [point(450, 280)]);
  await touch('touchMove', [point(410, 280)]);
  await expect.poll(() => page.evaluate(() => manualSpringStretch)).toBeLessThan(-30);
  await touch('touchCancel', []);
  expect(await page.evaluate(() => ({stretch: manualSpringStretch, dragging: isDragging, pointer: activePointerId}))).toEqual({stretch: 0, dragging: false, pointer: null});
  await touch('touchStart', [point(450, 280)]);
  await touch('touchMove', [point(490, 280)]);
  await expect.poll(() => page.evaluate(() => manualSpringStretch)).toBeGreaterThan(30);
  await touch('touchEnd', []);
  await cdp.detach();
});

test('手机手指可推动小球并拖动物体观察形变', async ({page, isMobile}) => {
  test.skip(!isMobile, '需要支持触摸的移动视口');
  await page.goto(url);
  const canvas = page.locator('canvas');
  const cdp = await page.context().newCDPSession(page);
  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', {type, touchPoints: points});
  async function point(x, y) {
    await canvas.scrollIntoViewIfNeeded();
    const b = await canvas.boundingBox();
    return {x: b.x + x * b.width / 700, y: b.y + y * b.height / 560};
  }
  await touch('touchStart', [await point(350, 280)]);
  await touch('touchMove', [await point(400, 280)]);
  await expect.poll(() => page.evaluate(() => ball.vx)).toBeGreaterThan(0);
  await touch('touchEnd', []);
  expect(await page.evaluate(() => ball.dragging)).toBe(false);

  await page.locator('[data-section="effect"]').tap();
  await touch('touchStart', [await point(350, 280)]);
  await touch('touchMove', [await point(390, 310)]);
  await expect.poll(() => page.evaluate(() => deformObj.deformX)).toBeGreaterThan(15);
  await expect.poll(() => page.evaluate(() => deformObj.deformY)).toBeGreaterThan(10);
  await touch('touchEnd', []);
  expect(await page.evaluate(() => deformObj.dragging)).toBe(false);
  await cdp.detach();
});

test('首次答错可重测，五题正确后保存并刷新', async ({page}) => {
  await page.goto(url);
  await visitModes(page);
  await keyboardClick(page, page.locator('#quizOpts button').first());
  await expect(page.locator('#quizFeedback')).toContainText('不对');
  await keyboardClick(page, page.locator('#retryQuiz'));
  await answerQuiz(page);
  await expect(page.locator('#done-mark')).toContainText('已完成');
  await page.reload();
  await expect(page.locator('#done-mark')).toBeVisible();
});

test('浏览器拒绝保存时不误报完成，恢复后可重试', async ({page}) => {
  await page.addInitScript(() => {
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('denied'); };
  });
  await page.goto(url);
  await visitModes(page);
  await answerQuiz(page);
  await expect(page.locator('#done-mark')).toContainText('进度未保存');
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
  await keyboardClick(page, page.locator('[data-section="concept"]'));
  await expect(page.locator('#done-mark')).toHaveText('✓ 已完成');
  await page.reload();
  await expect(page.locator('#done-mark')).toBeVisible();
});
