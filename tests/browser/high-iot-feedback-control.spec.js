const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const publishedBase = process.env.KV_PUBLISHED_BASE_URL?.replace(/\/?$/, '/') || '';
const siteRoot = publishedBase || '/';
const topic = publishedBase
  ? new URL('computer/high/iot-feedback-control.html', publishedBase).href
  : '/computer/high/iot-feedback-control.html';
const progressKey = 'kv-computer-high-progress';

async function completeComparison(page) {
  await page.locator('input[name="comparison-prediction"][value="feedback"]').check();
  await page.locator('#check-prediction').click();
  await page.locator('#run-rest').click();
  await expect(page.locator('#scheduled-trace li')).toHaveCount(5);
}

async function completeDeployment(page) {
  await page.locator('#architecture').selectOption('local');
  await page.locator('#network-state').selectOption('offline');
  await page.locator('input[name="deployment-prediction"][value="yes"]').check();
  await page.locator('#run-deployment').click();
  await expect(page.locator('#path-controller')).toContainText('本地反馈规则');

  await page.locator('#architecture').selectOption('cloud');
  await page.locator('input[name="deployment-prediction"][value="no"]').check();
  await page.locator('#run-deployment').click();
  await expect(page.locator('#deployment-status')).toContainText('断网路径均已对照');
}

async function completeAll(page) {
  await completeComparison(page);
  await completeDeployment(page);
  await page.locator('input[name="autonomy-judgement"][value="evidence"]').check();
  await page.locator('#check-autonomy').click();
}

test('prediction gate, disturbance trace, target-deviation comparison and tie case', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(topic);
  await expect(page).toHaveTitle(/物联网反馈控制实验室/);
  await expect(page.locator('#next-round')).toBeDisabled();
  await page.locator('#check-prediction').click();
  await expect(page.locator('#prediction-status')).toContainText('先选择');

  await page.locator('input[name="comparison-prediction"][value="scheduled"]').check();
  await page.locator('#check-prediction').click();
  await expect(page.locator('#prediction-status')).toContainText('预测不符');
  await expect(page.locator('#scheduled-trace li')).toHaveCount(0);
  await expect(page.locator('#deviation-summary')).toBeHidden();

  await page.locator('input[name="comparison-prediction"][value="feedback"]').check();
  await page.locator('#check-prediction').click();
  await page.locator('#next-round').click();
  await expect(page.locator('#scheduled-trace li')).toHaveCount(1);
  await expect(page.locator('#feedback-trace li')).toHaveCount(1);
  await page.locator('#run-rest').click();
  await expect(page.locator('#scheduled-trace li')).toHaveCount(5);
  await expect(page.locator('#scheduled-trace')).toContainText('环境增加 5');
  await expect(page.locator('#scheduled-trace li').nth(2)).toContainText('暂停动作');
  await expect(page.locator('#feedback-trace li').nth(2)).toContainText('开风扇');
  await expect(page.locator('#scheduled-score')).toHaveText('28 温度单位');
  await expect(page.locator('#feedback-score')).toHaveText('13 温度单位');
  await expect(page.locator('#comparison-status')).toContainText('固定模型');

  await page.locator('#target-temperature').selectOption('26');
  await page.locator('#scenario').selectOption('calm');
  await page.locator('input[name="comparison-prediction"][value="tie"]').check();
  await page.locator('#check-prediction').click();
  await page.locator('#run-rest').click();
  await expect(page.locator('#scheduled-score')).toHaveText('3 温度单位');
  await expect(page.locator('#feedback-score')).toHaveText('3 温度单位');
  expect(errors).toEqual([]);
});

test('local and cloud outage paths, autonomy boundary, progress and discovery', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(topic);
  await page.locator('#run-deployment').click();
  await expect(page.locator('#deployment-status')).toContainText('先预测');

  await page.locator('#architecture').selectOption('local');
  await page.locator('#network-state').selectOption('offline');
  await page.locator('input[name="deployment-prediction"][value="yes"]').check();
  await page.locator('#run-deployment').click();
  await expect(page.locator('#deployment-path')).toHaveAttribute('aria-label', /本地控制路径/);
  await expect(page.locator('#path-network')).toContainText('断网（控制旁路）');
  await expect(page.locator('#path-network')).toHaveAttribute('data-state', 'bypassed');
  await expect(page.locator('#path-controller')).toContainText('本地反馈规则');
  await expect(page.locator('#path-actuator')).toContainText('开风扇');

  await page.locator('#architecture').selectOption('cloud');
  await page.locator('input[name="deployment-prediction"][value="yes"]').check();
  await page.locator('#run-deployment').click();
  await expect(page.locator('#deployment-status')).toContainText('预测不符');
  await expect(page.locator('#deployment-outcome')).toHaveText('等待预测并模拟。');
  await page.locator('input[name="deployment-prediction"][value="no"]').check();
  await page.locator('#run-deployment').click();
  await expect(page.locator('#path-network')).toContainText('断网，命令不可达');
  await expect(page.locator('#path-network')).toHaveAttribute('data-state', 'unavailable');
  await expect(page.locator('#path-controller')).toContainText('静止回退');

  await page.locator('#network-state').selectOption('online');
  await page.locator('input[name="deployment-prediction"][value="yes"]').check();
  await page.locator('#run-deployment').click();
  await expect(page.locator('#path-controller')).toContainText('收到云端决定');
  await expect(page.locator('#path-network')).toHaveAttribute('data-state', 'active');

  await page.locator('input[name="autonomy-judgement"][value="offline"]').check();
  await page.locator('#check-autonomy').click();
  await expect(page.locator('#autonomy-status')).toContainText('推广成普遍结论');
  await completeComparison(page);
  await completeDeployment(page);
  await page.locator('input[name="autonomy-judgement"][value="evidence"]').check();
  await page.locator('#check-autonomy').click();
  await expect(page.locator('#learning-steps li[data-done="true"]')).toHaveCount(3);
  await expect(page.locator('#progress-status')).toContainText('已保存');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey))
    .toEqual({'iot-feedback-control': true});

  await page.locator('.footer-nav a[href="index.html"]').click();
  await expect(page.locator('#stage-progress')).toContainText('1/11');
  await page.goto(siteRoot);
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total', '28');
  await expect(page.locator('[data-subject="computer"] .sp-label')).toContainText('已学 1/28');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('high');
  await page.getByRole('searchbox', {name: '关键词'}).fill('物联网反馈控制');
  await page.locator('#site-results a[href="computer/high/iot-feedback-control.html"]').click();
  await expect(page).toHaveURL(/computer\/high\/iot-feedback-control\.html/);
  expect(errors).toEqual([]);
});

test('damaged progress is preserved and a repaired store can save completion', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网验收不修改站点存储故障');
  await page.addInitScript(key => localStorage.setItem(key, '{broken'), progressKey);
  await page.goto(topic);
  await completeAll(page);
  await expect(page.locator('#retry-save')).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBe('{broken');
  await page.evaluate(key => localStorage.removeItem(key), progressKey);
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('已保存');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey))
    .toEqual({'iot-feedback-control': true});
});

test('rejected progress writes are reported and can be retried', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网验收不改写本地存储实现');
  await page.addInitScript(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new Error('write rejected');
      return original.call(this, name, value);
    };
    window.restoreProgressWrites = () => { Storage.prototype.setItem = original; };
  }, progressKey);
  await page.goto(topic);
  await completeAll(page);
  await expect(page.locator('#progress-status')).toContainText('未能保存');
  await page.evaluate(() => window.restoreProgressWrites());
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('已保存');
});

test('320px keyboard flow remains visible without horizontal overflow', async ({page}) => {
  await page.setViewportSize({width: 320, height: 760});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(topic);
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.locator('input[name="comparison-prediction"][value="feedback"]').focus();
  await page.keyboard.press('Space');
  await page.locator('#check-prediction').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#prediction-status')).toContainText('符合');
  await page.locator('#run-rest').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#scheduled-trace li')).toHaveCount(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
  await expect(page.locator('#deployment-path')).toBeVisible();
});

test('direct file and release subpath load the local feedback model', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项不打开本机文件或临时发布服务器');
  const remoteRequests = [], errors = [];
  page.on('request', request => { if (/^https?:/.test(request.url())) remoteRequests.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(resolve(__dirname, '../../computer/high/iot-feedback-control.html')).href);
  await expect(page.getByRole('heading', {name: '物联网反馈控制实验室'})).toBeVisible();
  await completeComparison(page);
  expect(remoteRequests).toEqual([]);

  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('computer/high/iot-feedback-control.html', release.base).href);
    expect(response.status()).toBe(200);
    await completeComparison(page);
    await expect(page.locator('#feedback-score')).toHaveText('13 温度单位');
  } finally { await release.close(); }
  expect(errors).toEqual([]);
});
