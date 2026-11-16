const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const siteRoot = process.env.KV_PUBLISHED_BASE_URL
  ? process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/') : '/';
const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('computer/high/network-assembly.html', siteRoot).href : '/computer/high/network-assembly.html';
const progressKey = 'kv-computer-high-progress';

async function connectNetwork(page) {
  await page.locator('#check-network').click();
  await expect(page.locator('#network-status')).toContainText('台式机（服务器接入（WAN）断开）');
  await page.locator('#link-wan').check();
  await page.locator('#check-network').click();
  await expect(page.locator('#network-status')).toContainText('两台终端都存在');
}

async function predictWifiBottleneck(page) {
  await page.locator('#bottleneck-prediction').selectOption('wan');
  await page.locator('#check-prediction').click();
  await expect(page.locator('#prediction-status')).toContainText('当前瓶颈是：笔记本 Wi-Fi 接入');
  await expect(page.locator('#run-wifi')).toBeDisabled();
  await page.locator('#bottleneck-prediction').selectOption('wifi');
  await page.locator('#check-prediction').click();
  await expect(page.locator('#prediction-status')).toContainText('预测正确');
  await expect(page.locator('#run-wifi')).toBeEnabled();
}

async function finishComparison(page) {
  await connectNetwork(page);
  await predictWifiBottleneck(page);
  await page.locator('#run-wifi').click();
  await expect(page.locator('#desktop-wifi-result')).toHaveText('6 Mbps · 16 秒');
  await expect(page.locator('#laptop-wifi-result')).toHaveText('4 Mbps · 24 秒');
  await expect(page.locator('#wifi-bottleneck')).toHaveText('笔记本 Wi-Fi 接入');
  await page.locator('#laptop-access').selectOption('wired');
  await expect(page.locator('#run-wired')).toBeEnabled();
  await page.locator('#run-wired').click();
  await expect(page.locator('#desktop-wired-result')).toHaveText('6 Mbps · 16 秒');
  await expect(page.locator('#laptop-wired-result')).toHaveText('6 Mbps · 16 秒');
  await page.locator('#faster-access').selectOption('wifi');
  await page.locator('#check-comparison').click();
  await expect(page.locator('#comparison-status')).toContainText('请用两次模拟');
  await page.locator('#faster-access').selectOption('wired');
  await page.locator('#check-comparison').click();
  await expect(page.locator('#comparison-status')).toContainText('判断正确');
}

test('assembles routes, gates simulation behind prediction and compares shared throughput', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(topic);
  await expect(page.getByRole('heading', {name: '小型网络组装与带宽实验室'})).toBeVisible();
  await expect(page.locator('#run-wifi')).toBeDisabled();
  await connectNetwork(page);
  await page.locator('#link-ap').uncheck();
  await page.locator('#check-network').click();
  await expect(page.locator('#network-status')).toContainText('笔记本（交换机—无线接入点上联断开）');
  await page.locator('#link-ap').check();
  await page.locator('#check-network').click();
  await predictWifiBottleneck(page);
  await page.locator('#run-wifi').click();
  await expect(page.locator('#laptop-wifi-result')).toHaveText('4 Mbps · 24 秒');
  await page.locator('#laptop-access').selectOption('wired');
  await expect(page.locator('#run-wired')).toBeEnabled();
  await page.locator('#run-wired').click();
  await expect(page.locator('#laptop-wired-result')).toHaveText('6 Mbps · 16 秒');
  await expect(page.locator('#laptop-wifi-result')).toHaveText('4 Mbps · 24 秒');
  await page.locator('#faster-access').selectOption('wired');
  await page.locator('#check-comparison').click();
  await expect(page.locator('#progress-status')).toContainText('已保存');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'network-assembly': true});
  await page.locator('.footer-nav a[href="index.html"]').click();
  await expect(page.locator('#stage-progress')).toContainText('1/9');
  await expect(page.locator('[data-topic-slug="network-assembly"] [data-completion]')).toContainText('已完成');
  await page.goto(siteRoot);
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total', '23');
  await expect(page.locator('[data-subject="computer"] .sp-label')).toContainText('已学 1/23');
  expect(errors).toEqual([]);
});

test('changing a link rate invalidates stale predictions and both simulation snapshots', async ({page}) => {
  await page.goto(topic);
  await connectNetwork(page);
  await predictWifiBottleneck(page);
  await page.locator('#run-wifi').click();
  await page.locator('#rate-wifi').selectOption('2');
  await expect(page.locator('#run-wifi')).toBeDisabled();
  await expect(page.locator('#laptop-wifi-result')).toHaveText('尚未运行');
  await expect(page.locator('#wifi-bottleneck')).toHaveText('—');
  await expect(page.locator('#prediction-status')).toContainText('链路配置已变化');
  await page.locator('#bottleneck-prediction').selectOption('wifi');
  await page.locator('#check-prediction').click();
  await page.locator('#run-wifi').click();
  await expect(page.locator('#laptop-wifi-result')).toHaveText('2 Mbps · 48 秒');
});

test('corrupt progress remains intact and completion can be retried after storage repair', async ({page}) => {
  await page.addInitScript(key => localStorage.setItem(key, '{broken'), progressKey);
  await page.goto(topic);
  await finishComparison(page);
  await expect(page.locator('#retry-save')).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBe('{broken');
  await page.evaluate(key => localStorage.removeItem(key), progressKey);
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('已保存');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'network-assembly': true});
});

test('write rejection is visible and retry succeeds when browser writes recover', async ({page}) => {
  await page.addInitScript(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException('storage disabled', 'QuotaExceededError');
      return original.call(this, name, value);
    };
    window.restoreProgressWrite = () => { Storage.prototype.setItem = original; };
  }, progressKey);
  await page.goto(topic);
  await finishComparison(page);
  await expect(page.locator('#retry-save')).toBeVisible();
  await expect(page.locator('#progress-status')).toContainText('进度未能保存');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
  await page.evaluate(() => window.restoreProgressWrite());
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('已保存');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'network-assembly': true});
});

test('320px keyboard use stays inside viewport', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.goto(topic);
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.locator('#link-wan').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#link-wan')).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await expect(page.locator('main')).toBeVisible();
});

test('direct file open and release subpath load the model and primary interaction', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项不打开本机文件或临时发布服务器');
  await page.goto(pathToFileURL(resolve(__dirname, '../../computer/high/network-assembly.html')).href);
  await expect(page.getByRole('heading', {name: '小型网络组装与带宽实验室'})).toBeVisible();
  await page.locator('#link-wan').check();
  await page.locator('#check-network').click();
  await expect(page.locator('#network-status')).toContainText('两台终端都存在');

  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('computer/high/network-assembly.html', release.base).href);
    expect(response.status()).toBe(200);
    await connectNetwork(page);
    await predictWifiBottleneck(page);
    await page.locator('#run-wifi').click();
    await expect(page.locator('#laptop-wifi-result')).toHaveText('4 Mbps · 24 秒');
  } finally { await release.close(); }
});
