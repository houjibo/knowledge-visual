const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('simulation-world/cam-factory.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/simulation-world/cam-factory.html';

test('模拟世界分类可搜索凸轮送料，目录保留无学段场景', async ({page}) => {
  await page.goto(process.env.KV_PUBLISHED_BASE_URL || '/');
  const card = page.locator('[data-subject-category="simulation-world"]');
  await expect(card).toHaveAttribute('data-total', '8');
  await expect(card.locator('.subject-badge')).toHaveText('8 个模拟');
  await expect(card.locator('.subject-progress')).toHaveCount(0);
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('simulation-world');
  await page.getByRole('searchbox', {name: '关键词'}).fill('凸轮');
  await page.locator('#site-results a[href="simulation-world/cam-factory.html"]').click();
  await expect(page.getByRole('heading', {name: '凸轮送料与工厂节拍'})).toBeVisible();
  await page.getByRole('navigation', {name: '导航'}).getByRole('link', {name: '返回模拟世界'}).click();
  await expect(page.locator('.topic-card')).toHaveCount(8);
});

test('先预测再揭晓，角度、从动件高度和六件工件保持一致', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(topic);
  const narrow = page.viewportSize().width <= 640;
  await expect(page.locator('#cam-scene')).toHaveAttribute('viewBox', narrow ? '0 0 460 500' : '0 0 960 500');
  if (narrow) await expect(page.locator('#view-chart')).toBeVisible();
  else await expect(page.locator('#view-chart')).toBeHidden();
  await expect(page.locator('#cycle-seconds')).toHaveText('—');
  await expect(page.locator('#dwell-seconds')).toHaveText('—');
  await expect(page.locator('#reveal-button')).toBeDisabled();
  await expect(page.locator('#step-button')).toBeDisabled();
  await page.locator('#window-prediction').selectOption('enough');
  await page.locator('#reveal-button').click();
  await expect(page.locator('#prediction-feedback')).toContainText('预测正确');
  await expect(page.locator('#cycle-seconds')).toHaveText('2.00 s');
  await expect(page.locator('#dwell-seconds')).toHaveText('0.50 s');
  await expect(page.locator('#window-result')).toHaveText('够送料');
  await page.locator('#step-button').click();
  await expect(page.locator('#phase-copy')).toContainText('45° · 上升');
  await expect(page.locator('#height-copy')).toContainText('50%');
  await expect(page.locator('#cam-rotor')).toHaveAttribute('transform', 'rotate(45.0 255 314)');
  await expect(page.locator('#follower')).toHaveAttribute('transform', 'translate(0 -32.5)');
  await page.locator('#step-button').click();
  await expect(page.locator('#phase-copy')).toContainText('90° · 高位停歇');
  await expect(page.locator('#height-copy')).toContainText('100%');
  for (let index = 1; index <= 6; index++) {
    await page.locator('#cycle-button').click();
    const completed = Math.min(index + 0, 6);
    await expect(page.locator('#batch-copy')).toContainText(`${completed} / 6 完成`);
  }
  await expect(page.locator('#part-tokens rect[fill="#88d9bb"]')).toHaveCount(6);
  await expect(page.locator('#cycle-button')).toBeDisabled();
  expect(errors).toEqual([]);
});

test('提高转速缩短窗口，延长高位停歇可重新形成窗口', async ({page}) => {
  await page.goto(topic);
  await page.locator('#preset-fast').click();
  await page.locator('#window-prediction').selectOption('enough');
  await page.locator('#reveal-button').click();
  await expect(page.locator('#prediction-feedback')).toContainText('预测与本模型不符');
  await expect(page.locator('#dwell-seconds')).toHaveText('0.25 s');
  await expect(page.locator('#window-result')).toHaveText('窗口不足');
  await page.locator('#cycle-button').click();
  await expect(page.locator('#batch-copy')).toContainText('0 / 6 完成（已转1圈）');
  await page.locator('#preset-long').click();
  await expect(page.locator('#dwell-seconds')).toHaveText('—');
  await expect(page.locator('#batch-copy')).toContainText('0 / 6 完成（已转0圈）');
  await page.locator('#window-prediction').selectOption('enough');
  await page.locator('#reveal-button').click();
  await expect(page.locator('#dwell-seconds')).toHaveText('0.42 s');
  await expect(page.locator('#window-result')).toHaveText('够送料');
  await expect(page.locator('#result-explanation')).toContainText('低位停歇为 30°');
  await page.locator('#cycle-button').click();
  await expect(page.locator('#batch-copy')).toContainText('1 / 6 完成');
});

test('播放、参数变化、减少动态与复位都能控制演示', async ({page}) => {
  await page.goto(topic);
  await page.locator('#window-prediction').selectOption('enough');
  await page.locator('#reveal-button').click();
  await page.locator('#play-button').click();
  await expect(page.locator('#pause-button')).toBeEnabled();
  await page.locator('#cam-rpm').selectOption('60');
  await expect(page.locator('#pause-button')).toBeDisabled();
  await expect(page.locator('#phase-copy')).toContainText('0°');
  await expect(page.locator('#window-result')).toHaveText('待预测');
  await page.locator('#window-prediction').selectOption('short');
  await page.locator('#reveal-button').click();
  await page.locator('#step-button').click();
  await page.locator('#reset-button').click();
  await expect(page.locator('#phase-copy')).toContainText('0°');
  await expect(page.locator('#dwell-seconds')).toHaveText('0.25 s');
  await page.emulateMedia({reducedMotion: 'reduce'});
  await expect(page.locator('#play-button')).toBeDisabled();
  await expect(page.locator('#step-button')).toBeEnabled();
});

test('320px和file直开仍可用键盘完成预测与单步', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项已覆盖发布子路径');
  await page.setViewportSize({width: 320, height: 720});
  await page.goto(pathToFileURL(resolve(__dirname, '../../simulation-world/cam-factory.html')).href);
  await expect(page.locator('#view-mechanism')).toBeVisible();
  await expect(page.locator('#cam-scene')).toHaveAttribute('viewBox', '0 0 460 500');
  await page.locator('#view-chart').click();
  await expect(page.locator('#cam-scene')).toHaveAttribute('viewBox', '480 0 450 500');
  await expect(page.locator('#view-chart')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#view-mechanism').click();
  await expect(page.locator('#cam-scene')).toHaveAttribute('viewBox', '0 0 460 500');
  await page.locator('#window-prediction').selectOption('enough');
  await page.locator('#window-prediction').focus();
  await expect(page.locator('#window-prediction')).toHaveValue('enough');
  await page.keyboard.press('Tab');
  await expect(page.locator('#reveal-button')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#dwell-seconds')).toHaveText('0.50 s');
  await page.locator('#step-button').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#phase-copy')).toContainText('45°');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
