const {test, expect} = require('@playwright/test');

test('首页分类与无学段搜索可发现太阳系模拟', async ({page}) => {
  await page.goto('/');
  const card = page.locator('a.subject-card[data-subject-category="simulation-world"]');
  await expect(card).toHaveAttribute('href', 'simulation-world/index.html');
  await expect(card.locator('.subject-badge')).toHaveText('2 个模拟');
  await expect(card.locator('.subject-progress')).toHaveCount(0);

  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('simulation-world');
  const result = page.locator('#site-results a[href="simulation-world/solar-system.html"]');
  await expect(result).toBeVisible();
  await expect(result).toContainText('太阳系模拟');
  await expect(result).toContainText('模拟世界');
  await expect(result).not.toContainText('undefined');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('high');
  await expect(page.locator('#site-search-status')).toContainText('没有找到');
});

test('太阳系模拟在无外部请求下加载，速度、参考中心和重置可操作', async ({page}) => {
  const pageErrors = [];
  const externalRequests = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('request', request => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:4183') externalRequests.push(request.url());
  });
  await page.goto('/simulation-world/solar-system.html');
  await expect(page.getByRole('heading', {name: /太阳系模拟/})).toBeVisible();
  await expect(page.getByText(/行星大小、圆形轨道距离和公转速度都不按真实比例/)).toBeAttached();
  await expect(page.locator('.sr-only[aria-label="模拟天体清单"] li')).toHaveCount(9);
  await expect(page.locator('#runtime-status')).toContainText(/模拟已就绪|三维场景不可用/);

  const canvasCount = await page.locator('#scene-root canvas').count();
  if (canvasCount) {
    await expect(page.locator('#scene-root canvas')).toBeVisible();
    const initialBox = await page.locator('#scene-root canvas').boundingBox();
    expect(initialBox.width).toBeGreaterThan(300);
    expect(initialBox.height).toBeGreaterThan(300);
  } else {
    await expect(page.locator('#webgl-fallback')).toBeVisible();
    await expect(page.locator('#speedSlider')).toBeDisabled();
  }

  if (canvasCount) {
    const speed = page.locator('#speedSlider');
    await speed.focus();
    await page.keyboard.press('ArrowRight');
    await expect(speed).toHaveValue('1.1');
    await speed.fill('0');
    await expect(page.locator('#speedDisplay')).toHaveText('0.0 倍');
    await expect(page.locator('#runtime-status')).toContainText('公转已暂停');
    await speed.fill('2.5');
    await expect(page.locator('#speedDisplay')).toHaveText('2.5 倍');

    await page.locator('#referenceSelect').selectOption('earth');
    await expect(page.locator('#referenceDescription')).toContainText('当前以地球为参考中心');
    await page.locator('#resetViewBtn').click();
    await expect(page.locator('#referenceSelect')).toHaveValue('sun');
    await expect(page.locator('#referenceDescription')).toHaveText('当前以太阳为参考中心。');
  }

  expect(externalRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test('尊重减少动态效果偏好，同时允许学习者主动启动模拟', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('/simulation-world/solar-system.html');
  if (await page.locator('#scene-root canvas').count()) {
    await expect(page.locator('#speedSlider')).toHaveValue('0');
    await expect(page.locator('#runtime-status')).toContainText('公转已暂停');
    await page.locator('#speedSlider').fill('1');
    await expect(page.locator('#speedDisplay')).toHaveText('1.0 倍');
    await expect(page.locator('#runtime-status')).toContainText('模拟已就绪');
  } else {
    await expect(page.locator('#webgl-fallback')).toBeVisible();
  }
});

test('窄屏保留模拟说明和可用的主要控制', async ({page}) => {
  await page.setViewportSize({width: 320, height: 844});
  await page.goto('/simulation-world/solar-system.html');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await expect(page.locator('#controls-panel')).toBeVisible();
  await expect(page.locator('#speedSlider')).toBeVisible();
  await expect(page.locator('#referenceSelect')).toBeVisible();
  await expect(page.locator('#resetViewBtn')).toBeVisible();
  await page.locator('#model-notes summary').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#model-notes')).toHaveAttribute('open', '');
  await expect(page.getByText(/不求解引力，也不是实时星历/)).toBeVisible();
});

test('WebGL 不可用时显示可访问提示并保留模型边界与天体清单', async ({page}) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      if (['webgl', 'webgl2', 'experimental-webgl'].includes(type)) return null;
      return getContext.call(this, type, ...args);
    };
  });
  await page.goto('/simulation-world/solar-system.html');
  await expect(page.locator('#webgl-fallback')).toBeVisible();
  await expect(page.locator('#runtime-status')).toContainText('三维场景不可用');
  await expect(page.locator('#model-notes')).toContainText('不求解引力');
  await expect(page.locator('.sr-only[aria-label="模拟天体清单"] li')).toHaveCount(9);
  await expect(page.locator('#speedSlider')).toBeDisabled();
});
