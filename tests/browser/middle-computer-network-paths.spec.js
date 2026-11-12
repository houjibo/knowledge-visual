const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('computer/middle/network-paths.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/computer/middle/network-paths.html';
const progressKey = 'kv-computer-middle-progress';

async function reveal(page, scenario, rule, prediction) {
  await page.locator('#scenario').selectOption(scenario);
  await page.locator('#route-rule').selectOption(rule);
  await page.locator('#first-hop-prediction').selectOption(prediction);
  await page.locator('#reveal-button').click();
}

async function step(page, count) {
  for (let i = 0; i < count; i++) await page.locator('#step-button').click();
}

async function finish(page) {
  await reveal(page, 'normal', 'cost', 'B');
  await expect(page.locator('#first-hop-prediction')).toBeDisabled();
  await step(page, 3);
  await reveal(page, 'normal', 'hops', 'A');
  await step(page, 2);
  await reveal(page, 'bc', 'cost', 'A');
  await step(page, 3);
  await reveal(page, 'exits', 'cost', 'none');
}

test('prediction gate, path, SVG and hop-by-hop text share one state', async ({page}) => {
  await page.goto(topic);
  await expect(page.locator('#path-result')).toHaveText('尚未揭晓');
  await expect(page.locator('.link.route')).toHaveCount(0);
  await page.locator('#reveal-button').click();
  await expect(page.locator('#prediction-status')).toContainText('先选');
  await reveal(page, 'normal', 'cost', 'B');
  await expect(page.locator('#path-result')).toHaveText('S → B → C → D');
  await expect(page.locator('#cost-result')).toHaveText('4');
  await expect(page.locator('#hops-result')).toHaveText('3');
  await expect(page.locator('.link.route')).toHaveCount(3);
  await expect(page.locator('#challenge-normal-cost')).toContainText('待完成');
  await step(page, 1);
  await expect(page.locator('#step-status')).toContainText('当前在 B；已走 1/3 跳');
  await expect(page.locator('[data-edge="SB"]')).toHaveClass(/traversed/);
  await expect(page.locator('#packet-ring')).toHaveAttribute('cx', '200');
  await step(page, 2);
  await expect(page.locator('#step-status')).toContainText('到达 D');
  await expect(page.locator('#challenge-normal-cost')).toContainText('本轮已完成');
  expect(await page.evaluate(k => localStorage.getItem(k), progressKey)).toBeNull();
});

test('changing rule and broken links resets the old route; unreachable is never delivered', async ({page}) => {
  await page.goto(topic);
  await reveal(page, 'normal', 'hops', 'A');
  await expect(page.locator('#path-result')).toHaveText('S → A → D');
  await expect(page.locator('#cost-result')).toHaveText('8');
  await expect(page.locator('#hops-result')).toHaveText('2');
  await page.locator('#scenario').selectOption('bc');
  await expect(page.locator('#path-result')).toHaveText('尚未揭晓');
  await expect(page.locator('.link.route')).toHaveCount(0);
  await expect(page.locator('[data-edge="BC"]')).toHaveClass(/disabled/);
  await reveal(page, 'bc', 'cost', 'A');
  await expect(page.locator('#path-result')).toHaveText('S → A → C → D');
  await expect(page.locator('#cost-result')).toHaveText('7');
  await page.locator('#scenario').selectOption('bc-ac');
  await reveal(page, 'bc-ac', 'cost', 'A');
  await expect(page.locator('#path-result')).toHaveText('S → A → D');
  await page.locator('#scenario').selectOption('exits');
  await reveal(page, 'exits', 'cost', 'none');
  await expect(page.locator('#path-result')).toHaveText('D 不可达');
  await expect(page.locator('#step-button')).toBeDisabled();
  await expect(page.locator('#step-status')).toContainText('无法从 S 到达 D');
  await expect(page.locator('#challenge-exits-cost')).toContainText('本轮已完成');
});

test('wrong prediction and untraversed path do not count; four correct contrasts save once', async ({page}) => {
  await page.goto(topic);
  await reveal(page, 'normal', 'cost', 'A');
  await step(page, 3);
  await expect(page.locator('#challenge-normal-cost')).toContainText('待完成');
  await page.locator('#reset-button').click();
  await expect(page.locator('#first-hop-prediction')).toBeEnabled();
  await expect(page.locator('#path-result')).toHaveText('尚未揭晓');
  await finish(page);
  for (const id of ['normal-cost', 'normal-hops', 'bc-cost', 'exits-cost']) {
    await expect(page.locator(`#challenge-${id}`)).toContainText('本轮已完成');
  }
  await expect(page.locator('#progress-status')).toContainText('本机已记录完成');
  expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)), progressKey)).toEqual({'network-paths': true});
  await page.reload();
  await expect(page.locator('#progress-status')).toContainText('本机已记录完成');
  await expect(page.locator('#challenge-normal-cost')).toContainText('待完成');
});

test('storage denial and corrupt record keep a truthful retry state', async ({page}) => {
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
  await finish(page);
  await expect(page.locator('#progress-status')).toContainText('未能保存');
  expect(await page.evaluate(k => localStorage.getItem(k), progressKey)).toBeNull();
  await page.evaluate(() => window.restoreProgressWrites());
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('本机已记录完成');

  await page.evaluate(k => localStorage.setItem(k, '{broken'), progressKey);
  await page.reload();
  await finish(page);
  await expect(page.locator('#progress-status')).toContainText('未能保存');
  expect(await page.evaluate(k => localStorage.getItem(k), progressKey)).toBe('{broken');
});

test('search, middle directory and home progress include the network topic', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网发现由发布后验收');
  await page.goto('/');
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total', '9');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('middle');
  await page.getByRole('searchbox', {name: '关键词'}).fill('网络路径');
  await page.locator('#site-results a[href="computer/middle/network-paths.html"]').click();
  await finish(page);
  await page.locator('.footer-nav a[href="index.html"]').click();
  await expect(page.locator('#stage-progress')).toContainText('1/2');
  await expect(page.locator('[data-topic-slug="network-paths"] [data-completion]')).toContainText('已完成');
  await page.goto('/');
  await expect(page.locator('[data-subject="computer"] .sp-label')).toContainText('已学 1/9');
});

test('320px keyboard keeps the primary operation available', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(topic);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.locator('#first-hop-prediction').selectOption('B');
  await page.locator('#reveal-button').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#path-result')).toHaveText('S → B → C → D');
  await page.locator('#step-button').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#step-status')).toContainText('当前在 B');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('visible controls stay disabled until the controller is ready', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项不延迟脚本');
  await page.route('**/computer/middle/assets/network-paths.js', async route => {
    await new Promise(resolve => setTimeout(resolve, 900));
    await route.continue();
  });
  await page.goto(topic, {waitUntil: 'commit'});
  for (const id of ['scenario', 'route-rule', 'first-hop-prediction', 'reveal-button', 'reset-button', 'step-button']) {
    await expect(page.locator(`#${id}`)).toBeDisabled();
  }
  await page.waitForLoadState('domcontentloaded');
  for (const id of ['scenario', 'route-rule', 'first-hop-prediction', 'reveal-button', 'reset-button']) {
    await expect(page.locator(`#${id}`)).toBeEnabled();
  }
  await expect(page.locator('#step-button')).toBeDisabled();
});

test('direct file open keeps the primary operation available', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网测试不打开本机文件');
  await page.goto(pathToFileURL(resolve(__dirname, '../../computer/middle/network-paths.html')).href);
  await page.locator('#first-hop-prediction').selectOption('B');
  await page.locator('#reveal-button').click();
  await expect(page.locator('#path-result')).toHaveText('S → B → C → D');
  await step(page, 3);
  await expect(page.locator('#step-status')).toContainText('到达 D');
});

test('release subpath carries local scripts and the full learning interaction', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项直接使用已部署路径');
  const release = await startReleaseServer();
  try {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(new URL('computer/middle/network-paths.html', release.base).href);
    expect(response.status()).toBe(200);
    await finish(page);
    await expect(page.locator('#progress-status')).toContainText('本机已记录完成');
    expect(errors).toEqual([]);
  } finally { await release.close(); }
});
