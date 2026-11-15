const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = '/computer/high/algorithm-flowchart.html';
const progressKey = 'kv-computer-high-progress';
const choices = {
  '#block-initialize': 'start-at-zero',
  '#block-condition': 'test-index-before-length',
  '#block-compare': 'compare-equals-target',
  '#block-match': 'return-first-index',
  '#block-miss': 'advance-one-and-repeat',
  '#block-exhausted': 'report-not-found'
};

async function construct(page) {
  for (const [selector, value] of Object.entries(choices)) await page.locator(selector).selectOption(value);
  await page.locator('#check-construction').click();
  await expect(page.locator('#construction-status')).toContainText('结构正确');
}

async function predictAndRun(page, id, answer, output) {
  const card = page.locator(`[data-case="${id}"]`);
  const prediction = {
    'first-duplicate': '#predict-first-duplicate',
    'last-match': '#predict-last-match',
    'not-found': '#predict-not-found'
  }[id];
  await page.locator(prediction).selectOption(answer);
  await card.locator('[data-action="check-prediction"]').click();
  await expect(card.locator('[data-case-status]')).toContainText('预测正确');
  await card.locator('[data-action="run"]').click();
  await expect(card.locator('[data-case-status]')).toContainText(`运行完成：${output}`);
  await expect(card.locator('[data-trace] li')).not.toHaveCount(0);
}

async function completeLesson(page) {
  await construct(page);
  await predictAndRun(page, 'first-duplicate', 'index-1', '索引 1');
  await predictAndRun(page, 'last-match', 'index-4', '索引 4');
  await predictAndRun(page, 'not-found', 'not-found', '未找到');
  await page.locator('#termination-explanation').selectOption('increment-reaches-bound');
  await page.locator('#check-termination').click();
}

test('constructs matching flowchart and pseudocode, checks predictions, and traces finite search', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(topic);
  await expect(page).toHaveTitle(/算法描述与流程图实验室/);
  await expect(page.locator('[data-action="run"]')).toHaveCount(3);
  await expect(page.locator('[data-action="run"]').first()).toBeDisabled();

  for (const [selector, value] of Object.entries(choices)) await page.locator(selector).selectOption(value);
  await page.locator('#block-condition').selectOption('allow-index-equals-length');
  await page.locator('#check-construction').click();
  await expect(page.locator('#construction-status')).toContainText('会越界');
  await expect(page.locator('[data-action="check-prediction"]').first()).toBeDisabled();

  await page.locator('#block-condition').selectOption('test-index-before-length');
  await page.locator('#block-initialize').selectOption('start-at-zero');
  await page.locator('#check-construction').click();
  await expect(page.locator('#construction-status')).toContainText('结构正确');
  await expect(page.locator('#pseudocode')).toContainText('i ← 0');
  await expect(page.locator('#pseudocode')).toContainText('i < n ?');
  await expect(page.locator('[data-node="condition"]')).toHaveAttribute('data-state', 'correct');

  await page.locator('#predict-first-duplicate').selectOption('index-3');
  await page.locator('[data-case="first-duplicate"] [data-action="check-prediction"]').click();
  await expect(page.locator('[data-case="first-duplicate"] [data-case-status]')).toContainText('结果应为索引 1');
  await expect(page.locator('[data-case="first-duplicate"] [data-action="step"]')).toBeDisabled();
  await page.locator('#predict-first-duplicate').selectOption('index-1');
  await page.locator('[data-case="first-duplicate"] [data-action="check-prediction"]').click();
  await page.locator('[data-case="first-duplicate"] [data-action="step"]').click();
  await expect(page.locator('[data-case="first-duplicate"] [data-trace] li')).toHaveCount(1);
  await expect(page.locator('[data-case="first-duplicate"] [data-trace] li').first()).toContainText('条件成立');
  await page.locator('[data-case="first-duplicate"] [data-action="run"]').click();
  await expect(page.locator('[data-case="first-duplicate"] [data-case-status]')).toContainText('运行完成：索引 1');
  await expect(page.locator('[data-case="first-duplicate"] [data-trace] li')).toHaveCount(6);
  await expect(page.locator('[data-case="first-duplicate"] [data-trace]')).not.toContainText('A[3]');

  await predictAndRun(page, 'last-match', 'index-4', '索引 4');
  await predictAndRun(page, 'not-found', 'not-found', '未找到');
  await page.locator('#termination-explanation').selectOption('same-index-finish');
  await page.locator('#check-termination').click();
  await expect(page.locator('#termination-status')).toContainText('请说明未命中时索引如何推进');
  await page.locator('#termination-explanation').selectOption('increment-reaches-bound');
  await page.locator('#check-termination').click();
  await expect(page.locator('#progress-status')).toContainText('已保存');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'algorithm-flowchart': true});

  await page.locator('.footer-nav a[href="index.html"]').click();
  await expect(page.locator('#stage-progress')).toContainText('1/6');
  await page.goto('/index.html');
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total', '19');
  await expect(page.locator('[data-subject="computer"] .sp-label')).toContainText('已学 1/19');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('high');
  await page.getByRole('searchbox', {name: '关键词'}).fill('流程图');
  await page.locator('#site-results a[href="computer/high/algorithm-flowchart.html"]').click();
  await expect(page).toHaveURL(/computer\/high\/algorithm-flowchart\.html/);
  expect(errors).toEqual([]);
});

test('corrupt progress remains intact and completion can be retried after storage repair', async ({page}) => {
  await page.addInitScript(key => localStorage.setItem(key, '{broken'), progressKey);
  await page.goto(topic);
  await completeLesson(page);
  await expect(page.locator('#retry-save')).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBe('{broken');
  await page.evaluate(key => localStorage.removeItem(key), progressKey);
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('已保存');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'algorithm-flowchart': true});
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
  await completeLesson(page);
  await expect(page.locator('#retry-save')).toBeVisible();
  await expect(page.locator('#progress-status')).toContainText('未能保存');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
  await page.evaluate(() => window.restoreProgressWrite());
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('已保存');
});

test('320px keyboard access keeps the flowchart within the viewport', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.goto(topic);
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.locator('#block-initialize').focus();
  await page.locator('#block-initialize').selectOption('start-at-zero');
  await page.keyboard.press('Tab');
  await page.locator('#block-condition').press('End');
  await expect(page.locator('#block-condition')).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await expect(page.locator('#flowchart')).toBeVisible();
});

test('direct file open and release subpath retain the algorithm interaction', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项不打开本机文件或临时发布服务器');
  await page.goto(pathToFileURL(resolve(__dirname, '../../computer/high/algorithm-flowchart.html')).href);
  await expect(page.getByRole('heading', {name: '算法描述与流程图实验室'})).toBeVisible();
  await construct(page);
  await page.locator('#predict-not-found').selectOption('not-found');
  await page.locator('[data-case="not-found"] [data-action="check-prediction"]').click();
  await page.locator('[data-case="not-found"] [data-action="run"]').click();
  await expect(page.locator('[data-case="not-found"] [data-case-status]')).toContainText('运行完成：未找到');

  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('computer/high/algorithm-flowchart.html', release.base).href);
    expect(response.status()).toBe(200);
    await construct(page);
    await page.locator('#predict-first-duplicate').selectOption('index-1');
    await page.locator('[data-case="first-duplicate"] [data-action="check-prediction"]').click();
    await page.locator('[data-case="first-duplicate"] [data-action="run"]').click();
    await expect(page.locator('[data-case="first-duplicate"] [data-case-status]')).toContainText('运行完成：索引 1');
  } finally { await release.close(); }
});
