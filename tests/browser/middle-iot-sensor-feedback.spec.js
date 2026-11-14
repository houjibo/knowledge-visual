const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('computer/middle/iot-sensor-feedback.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/computer/middle/iot-sensor-feedback.html';
const progressKey = 'kv-computer-middle-progress';

async function predict(page, pump, next) {
  await page.locator('#pump-prediction').selectOption(pump);
  await page.locator('#next-prediction').fill(String(next));
  await page.locator('#start-button').click();
}

async function observe(page) {
  for (let i = 0; i < 4; i++) await page.locator('#step-button').click();
}

async function completeAll(page) {
  await predict(page, 'on', 45);
  await observe(page);
  await page.locator('#next-button').click();
  await predict(page, 'off', 40);
  await observe(page);
  await page.locator('#scenario').selectOption('wet');
  await predict(page, 'off', 50);
  await observe(page);
  await page.locator('#scenario').selectOption('lost');
  await predict(page, 'on', 65);
  await observe(page);
}

test('dry scene links two rounds through the observed feedback', async ({page}) => {
  await page.goto(topic);
  await expect(page.locator('#reading-value')).toHaveText('25');
  await expect(page.locator('#prior-command')).toContainText('水泵关');
  await predict(page, 'on', 45);
  await expect(page.locator('#phase-sensor p')).toHaveText('尚未揭示');
  await page.locator('#step-button').click();
  await expect(page.locator('#phase-sensor p')).toContainText('25');
  await expect(page.locator('#phase-gateway p')).toHaveText('尚未揭示');
  await page.locator('#step-button').click();
  await expect(page.locator('#phase-gateway p')).toContainText('送达');
  await page.locator('#step-button').click();
  await expect(page.locator('#phase-controller p')).toContainText('低于阈值 40');
  await expect(page.locator('#challenge-dry')).toContainText('待完成');
  await page.locator('#step-button').click();
  await expect(page.locator('#phase-environment p')).toContainText('下一轮为 45');
  await expect(page.locator('#prediction-status')).toContainText('预测正确');
  await page.locator('#next-button').click();
  await expect(page.locator('#reading-value')).toHaveText('45');
  await expect(page.locator('#prior-command')).toContainText('水泵开');
  await predict(page, 'off', 40);
  await observe(page);
  await expect(page.locator('#phase-controller p')).toContainText('达到或超过阈值 40');
  await expect(page.locator('#phase-environment p')).toContainText('下一轮为 40');
  await expect(page.locator('#challenge-dry')).toContainText('本轮已完成');
});

test('lost message visibly keeps the old command and explains the delivered alternative', async ({page}) => {
  await page.goto(topic);
  await page.locator('#scenario').selectOption('lost');
  await expect(page.locator('#reading-value')).toHaveText('45');
  await expect(page.locator('#delivery-hint')).toContainText('丢失');
  await predict(page, 'on', 65);
  await observe(page);
  await expect(page.locator('#phase-gateway p')).toContainText('没有收到');
  await expect(page.locator('#phase-controller p')).toContainText('沿用上一命令：水泵开');
  await expect(page.locator('#phase-controller p')).toContainText('若消息送达');
  await expect(page.locator('#phase-controller p')).toContainText('水泵关');
  await expect(page.locator('#phase-environment p')).toContainText('下一轮为 65');
  await expect(page.locator('#challenge-lost')).toContainText('本轮已完成');
});

test('missing, wrong and incomplete predictions do not earn the scene', async ({page}) => {
  await page.goto(topic);
  await page.locator('#start-button').click();
  await expect(page.locator('#prediction-status')).toContainText('请选择');
  await predict(page, 'off', 45);
  await observe(page);
  await expect(page.locator('#prediction-status')).toContainText('预测未对');
  await page.locator('#next-button').click();
  await predict(page, 'off', 40);
  await observe(page);
  await expect(page.locator('#challenge-dry')).toContainText('待完成');
  await page.locator('#reset-button').click();
  await predict(page, 'on', 45);
  for (let i = 0; i < 3; i++) await page.locator('#step-button').click();
  await expect(page.locator('#challenge-dry')).toContainText('待完成');
});

test('all scenes save after correct work and retry when storage is denied', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网测试不改写存储实现');
  await page.addInitScript(k => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === k) throw new Error('denied');
      return original.call(this, key, value);
    };
    window.restoreProgressWrites = () => { Storage.prototype.setItem = original; };
  }, progressKey);
  await page.goto(topic);
  await completeAll(page);
  await expect(page.locator('#progress-status')).toContainText('未能保存');
  expect(await page.evaluate(k => localStorage.getItem(k), progressKey)).toBeNull();
  await page.evaluate(() => window.restoreProgressWrites());
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('本机已记录完成');
  expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)), progressKey)).toEqual({'iot-sensor-feedback': true});
  await page.reload();
  await expect(page.locator('#challenge-dry')).toContainText('待完成');
  await expect(page.locator('#progress-status')).toContainText('本机已记录完成');
});

test('home search, counts and middle directory discover the scene', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网发现由发布后验收');
  await page.goto('/');
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total', '12');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('middle');
  await page.getByRole('searchbox', {name: '关键词'}).fill('传感与控制');
  await page.locator('#site-results a[href="computer/middle/iot-sensor-feedback.html"]').click();
  await completeAll(page);
  await page.locator('.footer-nav a[href="index.html"]').click();
  await expect(page.locator('#stage-progress')).toContainText('1/5');
  await expect(page.locator('[data-topic-slug="iot-sensor-feedback"] [data-completion]')).toContainText('已完成');
  await page.goto('/');
  await expect(page.locator('[data-subject="computer"] .sp-label')).toContainText('已学 1/12');
});

test('controls stay disabled until the lesson controller loads', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项不延迟脚本');
  await page.route('**/computer/middle/assets/iot-sensor-feedback.js', async route => {
    await new Promise(resolve => setTimeout(resolve, 700));
    await route.continue();
  });
  await page.goto(topic, {waitUntil: 'commit'});
  for (const id of ['scenario', 'pump-prediction', 'next-prediction', 'start-button', 'reset-button', 'step-button']) {
    await expect(page.locator(`#${id}`)).toBeDisabled();
  }
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('#scenario')).toBeEnabled();
  await expect(page.locator('#step-button')).toBeDisabled();
});

test('320px keyboard, direct file and release subpath run the same chain', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(topic);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.locator('#pump-prediction').selectOption('on');
  await page.locator('#next-prediction').fill('45');
  await page.locator('#start-button').focus();
  await page.keyboard.press('Enter');
  await page.locator('#step-button').focus();
  for (let i = 0; i < 4; i++) await page.keyboard.press('Enter');
  await expect(page.locator('#phase-environment p')).toContainText('下一轮为 45');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

  if (process.env.KV_PUBLISHED_BASE_URL) return;
  await page.goto(pathToFileURL(resolve(__dirname, '../../computer/middle/iot-sensor-feedback.html')).href);
  await page.locator('#scenario').selectOption('lost');
  await predict(page, 'on', 65);
  await observe(page);
  await expect(page.locator('#phase-environment p')).toContainText('下一轮为 65');
  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('computer/middle/iot-sensor-feedback.html', release.base).href);
    expect(response.status()).toBe(200);
    await completeAll(page);
    await expect(page.locator('#progress-status')).toContainText('本机已记录完成');
  } finally { await release.close(); }
});
