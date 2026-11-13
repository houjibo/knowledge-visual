const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('simulation-world/line-shaft-workshop.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/simulation-world/line-shaft-workshop.html';

test('首页、搜索和模拟世界目录可进入共享传动轴场景', async ({page}) => {
  await page.goto(process.env.KV_PUBLISHED_BASE_URL || '/');
  const category = page.locator('[data-subject-category="simulation-world"]');
  await expect(category).toHaveAttribute('data-total', '10');
  await expect(category.locator('.subject-badge')).toHaveText('10 个模拟');
  await expect(category.locator('.subject-progress')).toHaveCount(0);
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('simulation-world');
  await page.getByRole('searchbox', {name: '关键词'}).fill('传动轴');
  await page.locator('#site-results a[href="simulation-world/line-shaft-workshop.html"]').click();
  await expect(page).toHaveTitle('共享传动轴工坊模拟 · 模拟世界');
  await page.getByRole('navigation', {name: '导航'}).getByRole('link', {name: '返回模拟世界'}).click();
  await expect(page.locator('.topic-card')).toHaveCount(10);
});

test('先预测后揭晓，主轴、双机读数和真实 SVG 角度一致', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(topic);
  await expect(page.locator('#shaft-speed')).toHaveText('—');
  await expect(page.locator('#reveal-button')).toBeDisabled();
  await expect(page.locator('#step-button')).toBeDisabled();
  await page.locator('#b-prediction').selectOption('stopped');
  await page.locator('#reveal-button').click();
  await expect(page.locator('#prediction-feedback')).toContainText('预测正确');
  await expect(page.locator('#shaft-speed')).toHaveText('60 rpm');
  await expect(page.locator('#machine-a-speed')).toHaveText('60 rpm');
  await expect(page.locator('#machine-b-speed')).toHaveText('0 rpm');
  await page.locator('#step-button').click();
  await expect(page.locator('#elapsed-time')).toHaveText('0.25 s');
  await expect(page.locator('#source-rotor')).toHaveAttribute('transform', 'translate(95 142) rotate(90)');
  await expect(page.locator('#driver-b-rotor')).toHaveAttribute('transform', 'translate(650 142) rotate(90)');
  await expect(page.locator('#machine-a-rotor')).toHaveAttribute('transform', 'translate(360 328) rotate(90)');
  await expect(page.locator('#machine-b-rotor')).toHaveAttribute('transform', 'translate(650 328) rotate(0)');
  await expect(page.locator('#line-shaft-scene')).toHaveAttribute('aria-label', /机器 B 未接合、角度 0°/);
  expect(errors).toEqual([]);
});

test('接合 B 不改变 A；换小轮使 B 变快，配置变化会重置预测', async ({page}) => {
  await page.goto(topic);
  await page.locator('#preset-two').click();
  await expect(page.locator('#machine-b-engaged')).toBeChecked();
  await page.locator('#b-prediction').selectOption('faster');
  await page.locator('#reveal-button').click();
  await expect(page.locator('#prediction-feedback')).toContainText('预测与理想模型不符');
  await expect(page.locator('#machine-a-speed')).toHaveText('60 rpm');
  await expect(page.locator('#machine-b-speed')).toHaveText('30 rpm');
  await page.locator('#step-button').click();
  await expect(page.locator('#machine-b-rotor')).toHaveAttribute('transform', 'translate(650 328) rotate(45)');
  await expect(page.locator('#belt-b-left')).not.toHaveAttribute('stroke-dasharray', /./);

  await page.locator('#preset-small').click();
  await expect(page.locator('#b-prediction')).toHaveValue('');
  await expect(page.locator('#elapsed-time')).toHaveText('0.00 s');
  await expect(page.locator('#machine-b-wheel')).toHaveAttribute('r', '22');
  await page.locator('#b-prediction').selectOption('faster');
  await page.locator('#reveal-button').click();
  await expect(page.locator('#machine-a-speed')).toHaveText('60 rpm');
  await expect(page.locator('#machine-b-speed')).toHaveText('120 rpm');
  await page.locator('#step-button').click();
  await expect(page.locator('#machine-b-rotor')).toHaveAttribute('transform', 'translate(650 328) rotate(180)');
  await page.locator('#machine-a-engaged').uncheck();
  await page.locator('#b-prediction').selectOption('faster');
  await page.locator('#reveal-button').click();
  await expect(page.locator('#machine-a-speed')).toHaveText('0 rpm');
  await expect(page.locator('#shaft-speed')).toHaveText('60 rpm');
  await expect(page.locator('#machine-b-speed')).toHaveText('120 rpm');
});

test('键盘和 320px 视角可完成预测、单步与返回目录', async ({page}) => {
  await page.setViewportSize({width: 320, height: 720});
  await page.goto(topic);
  await expect(page.locator('#line-shaft-scene')).toHaveAttribute('viewBox', '0 0 470 430');
  await page.locator('#view-b').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#view-b')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#line-shaft-scene')).toHaveAttribute('viewBox', '420 0 440 430');
  await page.locator('#machine-b-engaged').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#machine-b-engaged')).toBeChecked();
  await page.locator('#machine-b-diameter').selectOption('10');
  await page.locator('#b-prediction').selectOption('faster');
  await page.locator('#reveal-button').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#machine-b-speed')).toHaveText('120 rpm');
  await page.locator('#step-button').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#angle-readout')).toContainText('机器 B 180°');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.getByRole('navigation', {name: '导航'}).getByRole('link', {name: '返回模拟世界'}).click();
  await expect(page.locator('.topic-card')).toHaveCount(10);
});

test('播放、暂停、减少动态与页面隐藏不会自动恢复', async ({page}) => {
  await page.goto(topic);
  await page.locator('#b-prediction').selectOption('stopped');
  await page.locator('#reveal-button').click();
  await page.locator('#play-button').click();
  await expect(page.locator('#pause-button')).toBeEnabled();
  await page.locator('#pause-button').click();
  await expect(page.locator('#pause-button')).toBeDisabled();
  await page.emulateMedia({reducedMotion: 'reduce'});
  await expect(page.locator('#play-button')).toBeDisabled();
  await expect(page.locator('#step-button')).toBeEnabled();
  await page.locator('#step-button').click();
  await expect(page.locator('#elapsed-time')).not.toHaveText('0.00 s');
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await expect(page.locator('#play-button')).toBeEnabled();
  await page.locator('#play-button').click();
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', {configurable:true, value:true}); document.dispatchEvent(new Event('visibilitychange')); });
  await expect(page.locator('#runtime-status')).toContainText('自动暂停');
  await expect(page.locator('#pause-button')).toBeDisabled();
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', {configurable:true, value:false}); document.dispatchEvent(new Event('visibilitychange')); });
  await expect(page.locator('#pause-button')).toBeDisabled();
});

test('十二秒边界、无脚本降级、文件直开和发布子路径可用', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项直接使用已部署路径');
  await page.goto(pathToFileURL(resolve(__dirname, '../../simulation-world/line-shaft-workshop.html')).href);
  await page.locator('#b-prediction').selectOption('stopped');
  await page.locator('#reveal-button').click();
  for (let index = 0; index < 48; index++) await page.locator('#step-button').click();
  await expect(page.locator('#elapsed-time')).toHaveText('12.00 s');
  await expect(page.locator('#step-button')).toBeDisabled();
  await expect(page.locator('#play-button')).toBeDisabled();
  await page.locator('#reset-button').click();
  await expect(page.locator('#elapsed-time')).toHaveText('0.00 s');

  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('simulation-world/line-shaft-workshop.html', release.base).href);
    expect(response.status()).toBe(200);
    await page.locator('#preset-small').click();
    await page.locator('#b-prediction').selectOption('faster');
    await page.locator('#reveal-button').click();
    await expect(page.locator('#machine-b-speed')).toHaveText('120 rpm');
  } finally { await release.close(); }

  await page.route('**/simulation-world/assets/line-shaft-workshop.js', route => route.abort());
  await page.goto(topic);
  await expect(page.locator('#shaft-rpm')).toBeDisabled();
  await expect(page.locator('#prediction-feedback')).toContainText('交互脚本未加载');
});
