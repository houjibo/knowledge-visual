const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('simulation-world/robot-arm.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/simulation-world/robot-arm.html';

async function range(page, id, value) {
  await page.locator('#' + id).evaluate((input, next) => {
    input.value = String(next);
    input.dispatchEvent(new Event('input', {bubbles: true}));
  }, value);
  await expect(page.locator('#' + id)).toHaveValue(String(value));
}

async function geometry(page, l1, l2) {
  const actual = await page.locator('#arm-svg').evaluate(svg => {
    const line = id => {
      const node = svg.querySelector('#' + id);
      return ['x1', 'y1', 'x2', 'y2'].map(attribute => Number(node.getAttribute(attribute)));
    };
    return {first: line('first-link'), second: line('second-link'),
      elbow: ['cx','cy'].map(key => Number(svg.querySelector('#elbow-joint').getAttribute(key))),
      tip: ['cx','cy'].map(key => Number(svg.querySelector('#tip-joint').getAttribute(key))),
      inner: Number(svg.querySelector('#inner-hole').getAttribute('r')),
      outer: Number(svg.querySelector('#outer-disc').getAttribute('r')),
      dataX: Number(svg.dataset.tipX), dataY: Number(svg.dataset.tipY)};
  });
  const distance = ([x1,y1,x2,y2]) => Math.hypot(x2-x1,y2-y1);
  expect(actual.first.slice(0,2)).toEqual([220,220]);
  expect(distance(actual.first)).toBeCloseTo(l1, 4);
  expect(actual.second.slice(0,2)).toEqual(actual.first.slice(2));
  expect(distance(actual.second)).toBeCloseTo(l2, 4);
  expect(actual.elbow).toEqual(actual.first.slice(2));
  expect(actual.tip).toEqual(actual.second.slice(2));
  expect(actual.dataX).toBeCloseTo(actual.tip[0] - 220, 1);
  expect(actual.dataY).toBeCloseTo(220 - actual.tip[1], 1);
  expect(actual.inner).toBe(Math.abs(l1-l2));
  expect(actual.outer).toBe(l1+l2);
  return actual;
}

test('第五个模拟在目录与分类搜索可发现且没有学科进度', async ({page}) => {
  await page.goto(process.env.KV_PUBLISHED_BASE_URL || '/');
  const category = page.locator('[data-subject-category="simulation-world"]');
  await expect(category).toHaveAttribute('data-total', '5');
  await expect(category.locator('.subject-badge')).toHaveText('5 个模拟');
  await expect(category.locator('.subject-progress')).toHaveCount(0);
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('simulation-world');
  await page.getByRole('searchbox', {name: '关键词'}).fill('机械臂');
  await page.locator('#site-results a[href="simulation-world/robot-arm.html"]').click();
  await expect(page.getByRole('heading', {name: '二维机械臂模拟'})).toBeVisible();
  await page.getByRole('navigation', {name: '导航'}).getByRole('link', {name: '返回模拟世界'}).click();
  await expect(page.locator('.topic-card')).toHaveCount(5);
  await page.locator('.topic-card[href="robot-arm.html"]').click();
  await expect(page.locator('#arm-svg')).toBeVisible();
});

test('默认图形、杆长和文字同尺度且关节控件具名', async ({page}) => {
  await page.goto(topic);
  await expect(page.locator('#arm-svg')).toHaveAttribute('role', 'img');
  await expect(page.locator('#arm-svg')).toHaveAccessibleName(/机械臂/);
  for (const [id, value] of [['first-length','90'], ['second-length','60'], ['shoulder-angle','35'], ['elbow-angle','-70']]) {
    await expect(page.locator('#' + id)).toHaveValue(value);
    await expect(page.locator('#' + id)).toHaveAccessibleName(/\S/);
  }
  await geometry(page, 90, 60);
  await expect(page.locator('#inner-radius')).toHaveText('30.0 mm');
  await expect(page.locator('#outer-radius')).toHaveText('150.0 mm');
  await expect(page.locator('#target-radius')).toHaveText('126.5 mm');
  await expect(page.locator('#show-pose')).toBeDisabled();
});

test('固定肩角转肘，肘点不变而末端沿另一杆圆周移动', async ({page}) => {
  await page.goto(topic);
  await range(page, 'shoulder-angle', 0);
  await range(page, 'elbow-angle', 0);
  const straight = await geometry(page, 90, 60);
  expect(straight.tip).toEqual([370,220]);
  await range(page, 'elbow-angle', 90);
  const bent = await geometry(page, 90, 60);
  expect(bent.elbow).toEqual(straight.elbow);
  expect(bent.tip[0]).toBeCloseTo(310, 4);
  expect(bent.tip[1]).toBeCloseTo(160, 4);
  await range(page, 'elbow-angle', 180);
  const folded = await geometry(page, 90, 60);
  expect(folded.tip[0]).toBeCloseTo(250, 4);
  expect(folded.tip[1]).toBeCloseTo(220, 4);
});

test('先预测再检验，错误判断可纠正且两种肘向均贴近同一目标', async ({page}) => {
  await page.goto(topic);
  await page.locator('#check-prediction').click();
  await expect(page.locator('#action-status')).toContainText('请先选择');
  await page.locator('#prediction-select').selectOption('unreachable');
  await page.locator('#check-prediction').click();
  await expect(page.locator('#prediction-status')).toContainText('这次未猜对');
  await page.locator('#prediction-select').selectOption('reachable');
  await expect(page.locator('#prediction-status')).toContainText('选择目标和判断');
  await page.locator('#check-prediction').click();
  await expect(page.locator('#prediction-status')).toContainText('预测正确');
  await page.locator('#show-pose').click();
  const first = {shoulder: await page.locator('#shoulder-angle').inputValue(),
    elbow: await page.locator('#elbow-angle').inputValue()};
  expect(Number(await page.locator('#tip-distance').textContent())).toBeLessThan(1);
  await geometry(page, 90, 60);
  await page.locator('#flip-pose').click();
  const second = {shoulder: await page.locator('#shoulder-angle').inputValue(),
    elbow: await page.locator('#elbow-angle').inputValue()};
  expect(second.elbow).not.toBe(first.elbow);
  expect(second.shoulder).not.toBe(first.shoulder);
  expect(Number(await page.locator('#tip-distance').textContent())).toBeLessThan(1);
  await expect(page.locator('#action-status')).toContainText('肘向二');
});

test('远点从不可达到可达时清除旧预测，不可达时不生成姿态', async ({page}) => {
  await page.goto(topic);
  await page.locator('#target-far').click();
  await page.locator('#prediction-select').selectOption('unreachable');
  await page.locator('#check-prediction').click();
  await expect(page.locator('#prediction-status')).toContainText('预测正确');
  await expect(page.locator('#show-pose')).toBeDisabled();
  await expect(page.locator('#target-radius')).toHaveText('180.0 mm');
  await range(page, 'first-length', 110);
  await range(page, 'second-length', 80);
  await expect(page.locator('#prediction-select')).toHaveValue('');
  await expect(page.locator('#outer-radius')).toHaveText('190.0 mm');
  await page.locator('#prediction-select').selectOption('reachable');
  await page.locator('#check-prediction').click();
  await page.locator('#show-pose').click();
  expect(Number(await page.locator('#tip-distance').textContent())).toBeLessThan(1);
});

test('内圈近点经等长杆可达，边界重合时不提供虚假第二肘向', async ({page}) => {
  await page.goto(topic);
  await page.locator('#target-inner').click();
  await page.locator('#prediction-select').selectOption('unreachable');
  await page.locator('#check-prediction').click();
  await expect(page.locator('#prediction-status')).toContainText('预测正确');
  await range(page, 'first-length', 60);
  await expect(page.locator('#inner-radius')).toHaveText('0.0 mm');
  await page.locator('#prediction-select').selectOption('reachable');
  await page.locator('#check-prediction').click();
  await page.locator('#show-pose').click();
  expect(Number(await page.locator('#tip-distance').textContent())).toBeLessThan(1);
  await page.locator('#target-x').fill('120');
  await page.locator('#target-x').press('Tab');
  await page.locator('#target-y').fill('0');
  await page.locator('#target-y').press('Tab');
  await page.locator('#prediction-select').selectOption('reachable');
  await page.locator('#check-prediction').click();
  await page.locator('#show-pose').click();
  await expect(page.locator('#flip-pose')).toBeDisabled();
});

test('指针可放置与拖动目标，数字框给出同等键盘入口', async ({page}) => {
  await page.goto(topic);
  await page.locator('#arm-svg').scrollIntoViewIfNeeded();
  const box = await page.locator('#arm-svg').boundingBox();
  expect(box).toBeTruthy();
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + box.width * 40 / 440, y - box.height * 30 / 440, {steps: 4});
  await page.mouse.up();
  await expect(page.locator('#target-x')).toHaveValue('40');
  await expect(page.locator('#target-y')).toHaveValue('30');
  await page.locator('#target-x').fill('-40');
  await page.locator('#target-x').press('Tab');
  await expect(page.locator('#arm-svg')).toHaveAttribute('data-target-x', '-40');
  await page.locator('#target-x').fill('');
  await page.locator('#target-x').press('Tab');
  await expect(page.locator('#target-x')).toHaveValue('-40');
  await expect(page.locator('#action-status')).toContainText('请输入');
  await page.locator('#reset-arm').click();
  await expect(page.locator('#target-x')).toHaveValue('120');
  await expect(page.locator('#target-y')).toHaveValue('40');
});

test('320px 键盘与减少动态偏好保持手动操作且页面无横向溢出', async ({page}) => {
  await page.setViewportSize({width: 320, height: 720});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(topic);
  await page.locator('#shoulder-angle').focus();
  await page.locator('#shoulder-angle').press('ArrowRight');
  await expect(page.locator('#shoulder-angle')).not.toHaveValue('35');
  await expect(page.locator('#action-status')).toContainText('机械臂已更新');
  const widths = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
    focus: getComputedStyle(document.querySelector('#shoulder-angle')).outlineStyle
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  expect(widths.focus).not.toBe('none');
});

test('file 直开无需运行时联网且不写学科进度', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网不检查本地文件');
  const remote = [], errors = [];
  page.on('request', request => { if (/^https?:/.test(request.url())) remote.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(resolve(__dirname, '../../simulation-world/robot-arm.html')).href);
  await page.locator('#prediction-select').selectOption('reachable');
  await page.locator('#check-prediction').click();
  await page.locator('#show-pose').click();
  expect(Number(await page.locator('#tip-distance').textContent())).toBeLessThan(1);
  expect(remote).toEqual([]);
  expect(errors).toEqual([]);
  expect(await page.locator('script[src*="progress"]').count()).toBe(0);
});

test('构建后的项目子路径中模型、控制器与返回链接可用', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项已覆盖发布路径');
  const server = await startReleaseServer();
  try {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(server.base + 'simulation-world/robot-arm.html');
    await page.locator('#target-far').click();
    await page.locator('#prediction-select').selectOption('unreachable');
    await page.locator('#check-prediction').click();
    await expect(page.locator('#prediction-status')).toContainText('预测正确');
    await page.getByRole('navigation', {name: '导航'}).getByRole('link', {name: '返回模拟世界'}).click();
    await expect(page).toHaveURL(server.base + 'simulation-world/index.html');
    expect(errors).toEqual([]);
  } finally { await server.close(); }
});
