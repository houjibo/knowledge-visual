const { test, expect } = require('@playwright/test');

const url = '/physics/high/em-induction.html';
test.setTimeout(15000);

test('topic tabs expose keyboard selection and panel relationships', async ({ page }) => {
  await page.goto(url);
  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(4);
  const panel = page.getByRole('tabpanel');
  await expect(panel).toBeVisible();

  await tabs.first().focus();
  await page.keyboard.press('End');
  await expect(tabs.nth(3)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.nth(3)).toBeFocused();
  await expect(page.locator('#sec3')).toBeVisible();
  await page.keyboard.press('Home');
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#sec0')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.nth(1)).toBeFocused();
});

test('each topic canvas is resized on entry and after viewport changes', async ({ page }) => {
  await page.goto(url);
  const cases = [
    { tab: '磁通量变化', canvas: '#fluxCanvas' },
    { tab: '感应电流方向', canvas: '#lenzCanvas' },
    { tab: '交变电流', canvas: '#acCanvas' },
  ];

  for (const [index, item] of cases.entries()) {
    await page.locator('.tab').nth(index).click();
    const dimensions = await page.locator(item.canvas).evaluate((canvas) => ({
      cssWidth: canvas.clientWidth,
      cssHeight: canvas.clientHeight,
      width: canvas.width,
      height: canvas.height,
    }));
    expect(dimensions.cssWidth, item.canvas).toBeGreaterThan(0);
    expect(dimensions.cssHeight, item.canvas).toBeGreaterThan(0);
    expect(dimensions.width, item.canvas).toBeGreaterThanOrEqual(dimensions.cssWidth);
    expect(dimensions.height, item.canvas).toBeGreaterThanOrEqual(dimensions.cssHeight);
  }

  await page.locator('.tab').nth(0).click();
  const magnetPosition = page.getByLabel('磁铁位置');
  await magnetPosition.fill('240');
  await page.locator('.tab').nth(1).click();
  await page.locator('.tab').nth(0).click();
  await expect(magnetPosition).toHaveValue('240');

  await page.locator('.tab').nth(2).click();
  await page.getByLabel('转速档位').fill('7');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.locator('#acCanvas').evaluate((canvas) => canvas.width)).toBeGreaterThan(0);
  await expect(page.getByLabel('转速档位')).toHaveValue('7');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('magnet position supports keyboard adjustment and deliberate pointer dragging', async ({ page }) => {
  await page.goto(url);
  const slider = page.getByLabel('磁铁位置');
  const canvas = page.locator('#fluxCanvas');
  await expect.poll(() => canvas.evaluate((element) => element.width >= element.clientWidth * 2)).toBe(true);
  const bounds = await canvas.boundingBox();
  await page.mouse.move(bounds.x + bounds.width * 0.9, bounds.y + bounds.height / 2);
  await expect(slider).toHaveValue('180');

  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.8, bounds.y + bounds.height / 2);
  await page.mouse.up();
  await expect(slider).toHaveValue('320');

  await slider.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(slider).toHaveValue('319');
});

test('magnet animation pause and immediate resume leaves one pending frame', async ({ page }) => {
  await page.addInitScript(() => {
    const pending = new Map();
    let nextId = 1;
    window.requestAnimationFrame = (callback) => {
      const id = nextId++;
      pending.set(id, callback);
      return id;
    };
    window.cancelAnimationFrame = (id) => pending.delete(id);
    window.__pendingFrameCount = () => pending.size;
    window.__runFrame = (timestamp) => {
      const callbacks = [...pending.values()];
      pending.clear();
      callbacks.forEach((callback) => callback(timestamp));
    };
  });
  await page.goto(url);
  await page.waitForTimeout(120);
  await page.locator('.tab').nth(2).click();
  await page.locator('#acToggle').click();
  await page.locator('.tab').nth(0).click();
  await expect.poll(() => page.evaluate(() => window.__pendingFrameCount())).toBe(0);

  await page.locator('#magnetToggle').click();
  await expect.poll(() => page.evaluate(() => window.__pendingFrameCount())).toBe(1);
  await page.locator('#magnetToggle').click();
  await page.locator('#magnetToggle').click();
  await expect.poll(() => page.evaluate(() => window.__pendingFrameCount())).toBe(1);
});

test('AC animation pause and immediate resume leaves one pending frame', async ({ page }) => {
  await page.addInitScript(() => {
    const pending = new Map();
    let nextId = 1;
    window.requestAnimationFrame = (callback) => {
      const id = nextId++;
      pending.set(id, callback);
      return id;
    };
    window.cancelAnimationFrame = (id) => pending.delete(id);
    window.__pendingFrameCount = () => pending.size;
    window.__runFrame = (timestamp) => {
      const callbacks = [...pending.values()];
      pending.clear();
      callbacks.forEach((callback) => callback(timestamp));
    };
  });
  await page.goto(url);
  await page.waitForTimeout(120);
  await page.locator('.tab').nth(2).click();
  await page.locator('#acToggle').click();
  await expect.poll(() => page.evaluate(() => window.__pendingFrameCount())).toBe(0);
  await page.locator('#acToggle').click();
  await expect.poll(() => page.evaluate(() => window.__pendingFrameCount())).toBe(1);
  const startAngle = await page.evaluate(() => acAngle);
  const baseTime = await page.evaluate(() => lastAcTimestamp);
  await page.evaluate((timestamp) => window.__runFrame(timestamp), baseTime + 16);
  const firstAngle = await page.evaluate(() => acAngle);
  const firstStep = firstAngle - startAngle;
  await page.evaluate((timestamp) => window.__runFrame(timestamp), baseTime + 32);
  const secondStep = (await page.evaluate(() => acAngle)) - firstAngle;
  expect(firstStep).toBeGreaterThan(0);
  expect(secondStep).toBeCloseTo(firstStep, 3);
  await expect.poll(() => page.evaluate(() => window.__pendingFrameCount())).toBe(1);
  await page.locator('#acToggle').click();
  await page.locator('#acToggle').click();
  await expect.poll(() => page.evaluate(() => window.__pendingFrameCount())).toBe(1);
});

test('Lenz scenarios present the pole and current direction from the magnet side', async ({ page }) => {
  await page.addInitScript(() => {
    const originalFillText = CanvasRenderingContext2D.prototype.fillText;
    window.__lenzPoleLabels = [];
    CanvasRenderingContext2D.prototype.fillText = function (text, ...args) {
      if (this.canvas.id === 'lenzCanvas' && ['N', 'S'].includes(String(text))) {
        window.__lenzPoleLabels.push(String(text));
      }
      return originalFillText.call(this, text, ...args);
    };
  });
  await page.goto(url);
  await page.locator('.tab').nth(1).click();
  const feedback = page.locator('#lenzFeedback');
  for (const scenario of [
    { button: 'N极插入', pole: 'N', text: /N极.*插入.*逆时针.*磁铁一侧/ },
    { button: 'N极拔出', pole: 'N', text: /N极.*拔出.*顺时针.*磁铁一侧/ },
    { button: 'S极插入', pole: 'S', text: /S极.*插入.*顺时针.*磁铁一侧/ },
    { button: 'S极拔出', pole: 'S', text: /S极.*拔出.*逆时针.*磁铁一侧/ },
  ]) {
    await page.getByRole('button', { name: scenario.button }).click();
    await expect(feedback).toContainText(scenario.text);
    const poles = await page.evaluate(() => window.__lenzPoleLabels.slice(-2));
    expect(poles).toEqual([scenario.pole, scenario.pole === 'N' ? 'S' : 'N']);
  }
});

test('relative flux readings use coil turns once and do not imply physical units', async ({ page }) => {
  await page.goto(url);
  await page.locator('.tab').nth(0).click();
  await expect(page.locator('#sec0 .data-display')).toContainText('相对值');
  await expect(page.locator('#sec0 .data-display')).not.toContainText('Wb');
  await expect(page.locator('#sec0 .data-display')).not.toContainText('V');

  await page.getByLabel('磁铁位置').fill('180');
  await page.getByLabel('线圈匝数').fill('5');
  await page.getByLabel('磁铁速度').fill('3');
  await page.getByRole('button', { name: '开始运动' }).click();
  await expect.poll(async () => Number(await page.locator('#emfVal').innerText())).not.toBe(0);
  const fiveTurns = Number(await page.locator('#emfVal').innerText());
  await expect(page.getByLabel('磁铁位置')).toBeDisabled();
  await page.getByRole('button', { name: '暂停' }).click();
  await expect(page.getByLabel('磁铁位置')).toBeEnabled();

  await page.getByLabel('磁铁位置').fill('180');
  await page.getByLabel('线圈匝数').fill('10');
  await page.getByRole('button', { name: '开始运动' }).click();
  await expect.poll(async () => Number(await page.locator('#emfVal').innerText())).not.toBe(0);
  const tenTurns = Number(await page.locator('#emfVal').innerText());
  await page.getByRole('button', { name: '暂停' }).click();
  expect(Math.abs(tenTurns)).toBeCloseTo(Math.abs(fiveTurns) * 2, 1);

  await page.locator('.tab').nth(2).click();
  await expect(page.locator('#sec2 .data-display')).toContainText('相对值');
  await expect(page.locator('#sec2 .data-display')).not.toContainText('V');
  await expect(page.getByLabel('转速档位')).toBeVisible();
  await expect(page.getByLabel('磁场强度档位')).toBeVisible();
});

test('quiz accepts one answer per question and completion needs three distinct first-try answers', async ({ page }) => {
  await page.goto(url);
  await page.locator('.tab').nth(3).click();
  let options = page.locator('#quizOptions button');
  await options.nth(2).click();
  await expect(options).toHaveCount(4);
  for (let i = 0; i < 4; i++) await expect(options.nth(i)).toBeDisabled();
  await expect.poll(() => page.evaluate(() => PageProgress.isDone('em-induction'))).toBe(false);

  await page.getByRole('button', { name: '下一题' }).click();
  options = page.locator('#quizOptions button');
  await options.nth(0).click();
  for (let i = 0; i < 4; i++) await expect(options.nth(i)).toBeDisabled();
  await page.getByRole('button', { name: '下一题' }).click();
  options = page.locator('#quizOptions button');
  await options.nth(1).click();
  await expect.poll(() => page.evaluate(() => PageProgress.isDone('em-induction'))).toBe(false);
  await page.getByRole('button', { name: '下一题' }).click();
  options = page.locator('#quizOptions button');
  await options.nth(1).click();
  await expect.poll(() => page.evaluate(() => PageProgress.isDone('em-induction'))).toBe(true);
  await page.reload();
  await expect.poll(() => page.evaluate(() => PageProgress.isDone('em-induction'))).toBe(true);
});
