const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('ai/high/threshold-errors.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/ai/high/threshold-errors.html';
const progressKey = 'kv-ai-high-progress';

async function reveal(page, fp = 'up', fn = 'down') {
  await page.locator('#fp-prediction').selectOption(fp);
  await page.locator('#fn-prediction').selectOption(fn);
  await page.locator('#reveal-button').click();
}

async function finish(page) {
  await reveal(page);
  await page.locator('#preset-low').click();
  await page.locator('#low-miss-choice').selectOption('4');
  await page.locator('#low-alarm-choice').selectOption('9');
  await page.locator('#check-choices').click();
}

test('labels stay hidden until prediction; chart, matrix and metrics match both presets', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(topic);
  await expect(page.locator('#score-list li')).toHaveCount(12);
  await expect(page.locator('#score-list')).not.toContainText('有缺陷');
  await expect(page.locator('#results-panel')).toBeHidden();
  await expect(page.locator('#application-panel')).toBeHidden();
  await expect(page.locator('#reveal-button')).toBeDisabled();
  await reveal(page);
  await expect(page.locator('#prediction-feedback')).toContainText('误报 1 → 4 件（增加），漏报 3 → 1 件（减少）');
  await expect(page.locator('#score-list .outcome-tp')).toHaveCount(3);
  await expect(page.locator('#score-list .outcome-fp')).toHaveCount(1);
  await expect(page.locator('#score-list .outcome-fn')).toHaveCount(3);
  await expect(page.locator('#score-list .outcome-tn')).toHaveCount(5);
  await expect(page.locator('#precision-value')).toHaveText('75%');
  await expect(page.locator('#recall-value')).toHaveText('50%');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();

  await page.locator('#preset-low').click();
  await expect(page.locator('#score-list .outcome-tp')).toHaveCount(5);
  await expect(page.locator('#score-list .outcome-fp')).toHaveCount(4);
  await expect(page.locator('#score-list .outcome-fn')).toHaveCount(1);
  await expect(page.locator('#score-list .outcome-tn')).toHaveCount(2);
  await expect(page.locator('#precision-value')).toHaveText('55.6%');
  await expect(page.locator('#recall-value')).toHaveText('83.3%');
  await expect(page.locator('#result-summary')).toContainText('需复检 9 件');
  await expect(page.locator('#comparison-feedback')).toContainText('误报 1 → 4 件，漏报 3 → 1 件');

  await page.locator('#threshold').fill('13');
  await expect(page.locator('#precision-value')).toHaveText('未定义');
  await expect(page.locator('#precision-formula')).toContainText('分母为 0');
  await expect(page.locator('#recall-value')).toHaveText('0%');
  await expect(page.locator('#result-summary')).toContainText('需复检 0 件');
  expect(errors).toEqual([]);
});

test('wrong prediction, one preset and wrong application never save; complete comparison does', async ({page}) => {
  await page.goto(topic);
  await reveal(page, 'down', 'up');
  await expect(page.locator('#prediction-feedback')).toContainText('预测未全对');
  await page.locator('#preset-low').click();
  await page.locator('#low-miss-choice').selectOption('4');
  await page.locator('#low-alarm-choice').selectOption('9');
  await page.locator('#check-choices').click();
  await expect(page.locator('#application-feedback')).toContainText('请用“重新预测”');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();

  await page.locator('#reset-prediction').click();
  await expect(page.locator('#results-panel')).toBeHidden();
  await expect(page.locator('#score-list')).not.toContainText('有缺陷');
  await reveal(page);
  await page.locator('#low-miss-choice').selectOption('9');
  await page.locator('#low-alarm-choice').selectOption('4');
  await page.locator('#check-choices').click();
  await expect(page.locator('#application-feedback')).toContainText('请据此重选');
  await page.locator('#low-miss-choice').selectOption('4');
  await page.locator('#low-alarm-choice').selectOption('9');
  await page.locator('#check-choices').click();
  await expect(page.locator('#application-feedback')).toContainText('请实际查看阈值 9 与 4');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
  await page.locator('#preset-low').click();
  await page.locator('#check-choices').click();
  await expect(page.locator('#progress-status')).toContainText('本机已记录完成分类阈值主题');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'threshold-errors': true});
  await page.reload();
  await expect(page.locator('#results-panel')).toBeHidden();
  await expect(page.locator('#progress-status')).toContainText('本机已有完成记录');
});

test('storage rejection retains eligibility and corrupt source is not overwritten', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网测试不改写存储实现');
  await page.addInitScript(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new Error('denied');
      return original.call(this, name, value);
    };
    window.restoreProgressWrites = () => { Storage.prototype.setItem = original; };
  }, progressKey);
  await page.goto(topic);
  await finish(page);
  await expect(page.locator('#progress-status')).toContainText('进度未能保存');
  await expect(page.locator('#retry-save')).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
  await page.evaluate(() => window.restoreProgressWrites());
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('本机已记录完成');

  await page.evaluate(key => localStorage.setItem(key, '{broken'), progressKey);
  await page.reload();
  await finish(page);
  await expect(page.locator('#progress-status')).toContainText('进度未能保存');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBe('{broken');
});

test('home search, stage count and progress all include the new AI topic', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网发现由发布后验收');
  await page.goto('/');
  await expect(page.locator('[data-subject="ai"]')).toHaveAttribute('data-total', '9');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('ai');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('high');
  await page.getByRole('searchbox', {name: '关键词'}).fill('误报');
  await page.locator('#site-results a[href="ai/high/threshold-errors.html"]').click();
  await finish(page);
  await page.locator('.footer-nav a[href="index.html"]').click();
  await expect(page.locator('#stage-progress')).toContainText('1/3');
  await expect(page.locator('[data-topic-slug="threshold-errors"] [data-completion]')).toContainText('已完成');
  await page.goto('/');
  await expect(page.locator('[data-subject="ai"] .sp-label')).toContainText('已学 1/9');
});

test('320px layout and keyboard slider keep all key outcomes readable', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.goto(topic);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.locator('#fp-prediction').selectOption('up');
  await page.locator('#fn-prediction').selectOption('down');
  await page.locator('#reveal-button').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#tp-count')).toHaveText('3');
  await page.locator('#threshold').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#threshold')).toHaveValue('8');
  await expect(page.locator('#fp-count')).toHaveText('2');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('controls stay disabled until model and controller load', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网测试不延迟脚本');
  await page.route('**/ai/high/assets/threshold-errors.js', async route => {
    await new Promise(resolve => setTimeout(resolve, 900));
    await route.continue();
  });
  await page.goto(topic, {waitUntil: 'commit'});
  for (const id of ['fp-prediction', 'fn-prediction', 'reveal-button', 'reset-prediction', 'threshold']) {
    await expect(page.locator(`#${id}`)).toBeDisabled();
  }
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('#fp-prediction')).toBeEnabled();
  await expect(page.locator('#fn-prediction')).toBeEnabled();
  await expect(page.locator('#reset-prediction')).toBeEnabled();
  await expect(page.locator('#reveal-button')).toBeDisabled();
});

test('file URL retains prediction and comparison without a server', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网测试不打开本机文件');
  await page.goto(pathToFileURL(resolve(__dirname, '../../ai/high/threshold-errors.html')).href);
  await reveal(page);
  await expect(page.locator('#precision-value')).toHaveText('75%');
  await page.locator('#preset-low').click();
  await expect(page.locator('#recall-value')).toHaveText('83.3%');
});

test('release subpath carries scripts and full interaction', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项直接使用已部署路径');
  const release = await startReleaseServer();
  try {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(new URL('ai/high/threshold-errors.html', release.base).href);
    expect(response.status()).toBe(200);
    await finish(page);
    await expect(page.locator('#progress-status')).toContainText('本机已记录完成');
    expect(errors).toEqual([]);
  } finally { await release.close(); }
});
