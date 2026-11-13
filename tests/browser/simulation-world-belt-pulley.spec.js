const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('simulation-world/belt-pulley.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/simulation-world/belt-pulley.html';

async function predict(page, speed, direction) {
  await page.locator('#speed-prediction').selectOption(speed);
  await page.locator('#direction-prediction').selectOption(direction);
  await page.locator('#reveal-button').click();
}

test('第七个无学段模拟可从首页分类搜索和目录找到', async ({page}) => {
  await page.goto(process.env.KV_PUBLISHED_BASE_URL || '/');
  const category = page.locator('[data-subject-category="simulation-world"]');
  await expect(category).toHaveAttribute('data-total', '10');
  await expect(category.locator('.subject-badge')).toHaveText('10 个模拟');
  await expect(category.locator('.subject-progress')).toHaveCount(0);
  await page.getByRole('combobox', {name:'学科', exact:true}).selectOption('simulation-world');
  await page.getByRole('searchbox', {name:'关键词'}).fill('皮带');
  await page.locator('#site-results a[href="simulation-world/belt-pulley.html"]').click();
  await expect(page.getByRole('heading', {name:'皮带与带轮模拟'})).toBeVisible();
  await page.getByRole('navigation', {name:'导航'}).getByRole('link', {name:'返回模拟世界'}).click();
  await expect(page.locator('.topic-card')).toHaveCount(10);
  await expect(page.locator('.topic-card[href="belt-pulley.html"]')).toContainText('柔性连接');
});

test('默认先预测，减速开口的数字、文字和90度步进一致', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(topic);
  await expect(page.locator('#reveal-button')).toBeEnabled();
  await expect(page.locator('#step-button')).toBeDisabled();
  await expect(page.locator('#ideal-output')).toHaveText('—');
  await page.locator('#reveal-button').click();
  await expect(page.locator('#prediction-feedback')).toContainText('两项预测');
  await predict(page, 'slower', 'same');
  await expect(page.locator('#prediction-feedback')).toContainText('两项预测都正确');
  await expect(page.locator('#ideal-output')).toHaveText('30.0 rpm');
  await expect(page.locator('#actual-output')).toHaveText('30.0 rpm');
  await expect(page.locator('#direction-output')).toHaveText('同向 ↻');
  await expect(page.locator('#belt-speed')).toHaveText('0.251 m/s');
  await page.locator('#step-button').click();
  await expect(page.locator('#driver-rotor')).toHaveAttribute('transform', /rotate\(90\.0\)/);
  await expect(page.locator('#driven-rotor')).toHaveAttribute('transform', /rotate\(45\.0\)/);
  await expect(page.locator('#runtime-status')).toContainText('从动轮按无打滑关系累计 45.0°');
  expect(errors).toEqual([]);
});

test('加速与交叉预设给出不同旋向，并允许纠正错误预测', async ({page}) => {
  await page.goto(topic);
  await page.locator('#preset-crossed').click();
  await expect(page.locator('#layout-select')).toHaveValue('crossed');
  await predict(page, 'slower', 'same');
  await expect(page.locator('#prediction-feedback')).toContainText('速度判断需修正');
  await expect(page.locator('#prediction-feedback')).toContainText('方向判断需修正');
  await expect(page.locator('#ideal-output')).toHaveText('120.0 rpm');
  await expect(page.locator('#direction-output')).toHaveText('反向 ↺');
  await expect(page.locator('#driven-svg-label')).toContainText('反向');
  await page.locator('#step-button').click();
  await expect(page.locator('#driven-rotor')).toHaveAttribute('transform', /rotate\(-180\.0\)/);
  await page.locator('#preset-equal').click();
  await predict(page, 'same', 'same');
  await expect(page.locator('#ideal-output')).toHaveText('60.0 rpm');
  await expect(page.locator('#direction-output')).toHaveText('同向 ↻');
});

test('打滑后保留理想参考，却不捏造实际输出', async ({page}) => {
  await page.goto(topic);
  await predict(page, 'slower', 'same');
  await page.locator('#slip-observed').check();
  await expect(page.locator('#ideal-output')).toHaveText('30.0 rpm');
  await expect(page.locator('#actual-output')).toHaveText('需要测量');
  await expect(page.locator('#direction-output')).toHaveText('需要观察');
  await expect(page.locator('#step-button')).toBeDisabled();
  await expect(page.locator('#run-button')).toBeDisabled();
  await expect(page.locator('#runtime-status')).toContainText('观察到打滑，理想运动示意已停止');
  await expect(page.locator('#boundary-message')).toContainText('不假定打滑率');
  await page.locator('#slip-observed').uncheck();
  await expect(page.locator('#actual-output')).toHaveText('30.0 rpm');
  await expect(page.locator('#runtime-status')).toContainText('已返回无打滑理想条件');
  await expect(page.locator('#step-button')).toBeEnabled();
  await page.locator('#driven-diameter').selectOption('80');
  await expect(page.locator('#ideal-output')).toHaveText('—');
  await expect(page.locator('#speed-prediction')).toHaveValue('');
  await expect(page.locator('#step-button')).toBeDisabled();
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => /belt|pulley/.test(key)))).toEqual([]);
});

test('改变条件、隐藏页面和动态偏好变化会停止旧动画', async ({page}) => {
  await page.clock.install();
  await page.goto(topic);
  await predict(page, 'slower', 'same');
  await page.locator('#run-button').click();
  await page.clock.runFor(300);
  const moving = await page.locator('#driver-rotor').getAttribute('transform');
  expect(moving).not.toContain('rotate(0.0)');
  await page.locator('#driver-diameter').selectOption('100');
  const reset = await page.locator('#driver-rotor').getAttribute('transform');
  await page.clock.runFor(500);
  await expect(page.locator('#driver-rotor')).toHaveAttribute('transform', reset);
  await predict(page, 'slower', 'same');
  await page.locator('#run-button').click();
  await page.clock.runFor(150);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {configurable: true, get: () => true});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const hidden = await page.locator('#driver-rotor').getAttribute('transform');
  await page.clock.runFor(500);
  await expect(page.locator('#driver-rotor')).toHaveAttribute('transform', hidden);
  await page.evaluate(() => { delete document.hidden; });
  await page.locator('#run-button').click();
  await page.clock.runFor(150);
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('#pause-button')).toBeDisabled();
  const reduced = await page.locator('#driver-rotor').getAttribute('transform');
  await page.clock.runFor(500);
  await expect(page.locator('#driver-rotor')).toHaveAttribute('transform', reduced);
});

test('直接打开文件和320px宽度下可用键盘操作', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '发布路径由独立场景覆盖');
  const external = [];
  page.on('request', request => { if (!request.url().startsWith('file://')) external.push(request.url()); });
  await page.setViewportSize({width:320, height:700});
  await page.goto(pathToFileURL(resolve(__dirname, '../../simulation-world/belt-pulley.html')).href);
  await expect(page.locator('#reveal-button')).toBeEnabled();
  await page.locator('#speed-prediction').selectOption('slower');
  await page.locator('#direction-prediction').selectOption('same');
  await page.getByRole('button', {name:'揭晓理想结果'}).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', {name:'主动轮前进 90°'}).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#runtime-status')).toContainText('45.0°');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(external).toEqual([]);
});
