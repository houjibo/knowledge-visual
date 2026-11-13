const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = '/simulation-world/steam-engine.html';

test('首页搜索、十个场景和无学段入口', async ({page}) => {
  await page.goto('/');
  const card = page.locator('[data-subject-category="simulation-world"]');
  await expect(card).toHaveAttribute('data-total', '10');
  await expect(card.locator('.subject-badge')).toHaveText('10 个模拟');
  await expect(card.locator('.subject-progress')).toHaveCount(0);
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('simulation-world');
  await page.getByRole('searchbox', {name: '关键词'}).fill('蒸汽机');
  await page.locator('#site-results a[href="simulation-world/steam-engine.html"]').click();
  await expect(page).toHaveTitle('单缸蒸汽机动力路径模拟 · 模拟世界');
  await page.getByRole('navigation', {name: '导航'}).getByRole('link', {name: '模拟世界', exact: true}).click();
  await expect(page.locator('.topic-card')).toHaveCount(10);
});

test('预测前隐藏进汽侧，揭晓后图形与读数同步', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(topic);
  await expect(page.locator('#intake-readout')).toHaveText('待预测');
  await expect(page.locator('#reveal-button')).toBeDisabled();
  await expect(page.locator('#step-button')).toBeDisabled();
  await expect(page.locator('#left-pipe')).toHaveAttribute('stroke', '#729096');
  await page.locator('#intake-prediction').selectOption('left');
  await page.locator('#reveal-button').click();
  await expect(page.locator('#prediction-feedback')).toContainText('预测正确');
  await expect(page.locator('#intake-readout')).toHaveText('左侧');
  await expect(page.locator('#displacement-readout')).toHaveText('0 / 130');
  await expect(page.locator('#left-pipe')).toHaveAttribute('stroke', '#ffd894');
  await expect(page.locator('#piston')).toHaveAttribute('x', '156');
  await expect(page.locator('#crosshead')).toHaveAttribute('cx', '405');
  for (let i = 0; i < 4; i++) await page.locator('#step-button').click();
  await expect(page.locator('#angle-readout')).toHaveText('180°');
  await expect(page.locator('#intake-readout')).toHaveText('右侧');
  await expect(page.locator('#displacement-readout')).toHaveText('130 / 130');
  await expect(page.locator('#piston')).toHaveAttribute('x', '286');
  await expect(page.locator('#crosshead')).toHaveAttribute('cx', '535');
  await expect(page.locator('#right-pipe')).toHaveAttribute('stroke', '#ffd894');
  await expect(page.locator('#engine-scene')).toHaveAttribute('aria-label', /右侧进汽.*130 \/ 130/);
  expect(errors).toEqual([]);
});

test('角度与速度重置预测；同角度几何不变而周期缩短', async ({page}) => {
  await page.goto(topic);
  await page.locator('#angle-input').fill('180');
  await expect(page.locator('#reveal-button')).toBeDisabled();
  await page.locator('#intake-prediction').selectOption('left');
  await page.locator('#reveal-button').click();
  await expect(page.locator('#prediction-feedback')).toContainText('不符');
  await expect(page.locator('#intake-readout')).toHaveText('右侧');
  const x = await page.locator('#piston').getAttribute('x');
  await page.locator('#rpm-select').selectOption('30');
  await expect(page.locator('#intake-readout')).toHaveText('待预测');
  await expect(page.locator('#period-note')).toContainText('一圈 2 s');
  await page.locator('#intake-prediction').selectOption('right');
  await page.locator('#reveal-button').click();
  await expect(page.locator('#piston')).toHaveAttribute('x', x);
  await page.locator('#step-button').click();
  await expect(page.locator('#elapsed-readout')).toHaveText('0.25 s');
});

test('键盘、320px、减少动态、隐藏页面和两圈边界', async ({page}) => {
  await page.setViewportSize({width: 320, height: 720});
  await page.goto(topic);
  await page.locator('#angle-input').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#angle-output')).toHaveText('15°');
  await page.locator('#intake-prediction').selectOption('left');
  await page.locator('#reveal-button').focus();
  await page.keyboard.press('Enter');
  await page.locator('#step-button').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#angle-readout')).toHaveText('60°');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.emulateMedia({reducedMotion: 'reduce'});
  await expect(page.locator('#play-button')).toBeDisabled();
  await expect(page.locator('#step-button')).toBeEnabled();
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.locator('#play-button').click();
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', {configurable:true, value:true}); document.dispatchEvent(new Event('visibilitychange')); });
  await expect(page.locator('#runtime-status')).toContainText('自动暂停');
  await expect(page.locator('#pause-button')).toBeDisabled();
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', {configurable:true, value:false}); document.dispatchEvent(new Event('visibilitychange')); });
  for (let i = 0; i < 15; i++) await page.locator('#step-button').click();
  await expect(page.locator('#elapsed-readout')).toHaveText('8.00 s');
  await expect(page.locator('#step-button')).toBeDisabled();
  await page.locator('#reset-button').click();
  await expect(page.locator('#elapsed-readout')).toHaveText('0.00 s');
});

test('文件直开、发布子路径和脚本缺失时的降级', async ({page}) => {
  await page.goto(pathToFileURL(resolve(__dirname, '../../simulation-world/steam-engine.html')).href);
  await page.locator('#intake-prediction').selectOption('left');
  await page.locator('#reveal-button').click();
  await expect(page.locator('#intake-readout')).toHaveText('左侧');
  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('simulation-world/steam-engine.html', release.base).href);
    expect(response.status()).toBe(200);
    await page.locator('#angle-input').fill('180');
    await page.locator('#intake-prediction').selectOption('right');
    await page.locator('#reveal-button').click();
    await expect(page.locator('#intake-readout')).toHaveText('右侧');
  } finally { await release.close(); }
  await page.route('**/simulation-world/assets/steam-engine.js', route => route.abort());
  await page.goto(topic);
  await expect(page.locator('#rpm-select')).toBeDisabled();
  await expect(page.locator('#prediction-feedback')).toContainText('交互脚本未加载');
});
