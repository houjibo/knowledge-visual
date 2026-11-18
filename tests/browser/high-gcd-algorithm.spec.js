const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = '/computer/high/gcd-algorithm.html';
const progressKey = 'kv-computer-high-progress';
const choices = {
  '#block-condition': 'while-b-nonzero',
  '#block-remainder': 'save-remainder',
  '#block-update-a': 'assign-old-b',
  '#block-update-b': 'assign-remainder',
  '#block-output': 'return-a'
};

async function construct(page) {
  for (const [selector, value] of Object.entries(choices)) await page.locator(selector).selectOption(value);
  await page.locator('#check-construction').click();
  await expect(page.locator('#construction-status')).toContainText('步骤正确');
}

async function predictAndRun(page, a, b, prediction, output) {
  await page.locator('#number-a').fill(String(a));
  await page.locator('#number-b').fill(String(b));
  await page.locator('#prediction').fill(String(prediction));
  await page.locator('#check-prediction').click();
  await expect(page.locator('#prediction-status')).toContainText('预测正确');
  await page.locator('#run-all').click();
  await expect(page.locator('#run-summary')).toContainText(output);
}

async function completeLesson(page) {
  await construct(page);
  await predictAndRun(page, 252, 105, 21, '最大公约数为 21');
  await predictAndRun(page, 0, 28, 28, '最大公约数为 28');
  await page.locator('#number-a').fill('987');
  await page.locator('#number-b').fill('1');
  await page.locator('#compare').click();
  await expect(page.locator('#euclid-count')).toContainText('1 轮');
  await expect(page.locator('#subtract-count')).toContainText('986 次');
  await page.locator('#draft-judgement').selectOption('non-terminating');
  await page.locator('#run-draft').click();
  await expect(page.locator('#draft-status')).toContainText('固定错误样例');
}

test('constructs Euclidean steps, verifies positive and zero inputs, compares counts, and checks a fixed flawed draft', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(topic);
  await expect(page).toHaveTitle(/最大公约数算法工作台/);
  await page.locator('#block-condition').selectOption('while-a-diff-b');
  await page.locator('#check-construction').click();
  await expect(page.locator('#construction-status')).toContainText('b 不等于 0');
  await expect(page.locator('#check-prediction')).toBeDisabled();

  await construct(page);
  await expect(page.locator('#pseudocode')).toContainText('r ← a mod b');
  await expect(page.locator('#pseudocode')).toContainText('a ← b（旧 b）');
  await page.locator('#number-a').fill('252');
  await page.locator('#number-b').fill('105');
  await page.locator('#prediction').fill('20');
  await page.locator('#check-prediction').click();
  await expect(page.locator('#prediction-status')).toContainText('再检查预测');
  await page.locator('#prediction').fill('21');
  await page.locator('#check-prediction').click();
  await page.locator('#step-run').click();
  await expect(page.locator('#trace li')).toHaveCount(1);
  await expect(page.locator('#trace')).toContainText('252 mod 105 = 42');
  await page.locator('#run-all').click();
  await expect(page.locator('#run-summary')).toContainText('最大公约数为 21');
  await expect(page.locator('#trace')).toContainText('停止：b = 0');

  await page.locator('button[data-preset="0,0"]').click();
  await page.locator('#prediction').fill('0');
  await page.locator('#check-prediction').click();
  await expect(page.locator('#prediction-status')).toContainText('不在本练习定义域内');
  await predictAndRun(page, 0, 28, 28, '最大公约数为 28');
  await page.locator('#number-a').fill('987');
  await page.locator('#number-b').fill('1');
  await page.locator('#compare').click();
  await expect(page.locator('#euclid-count')).toContainText('1 轮');
  await expect(page.locator('#subtract-count')).toContainText('986 次');
  await expect(page.locator('#comparison-summary')).toContainText('最大公约数都为 1');

  await page.locator('#draft-judgement').selectOption('terminating');
  await page.locator('#run-draft').click();
  await expect(page.locator('#draft-status')).toContainText('判断不符');
  await expect(page.locator('#draft-trace')).toContainText('(12, 0) → (12, 0)');
  await page.locator('#draft-judgement').selectOption('non-terminating');
  await page.locator('#run-draft').click();
  await expect(page.locator('#draft-status')).toContainText('固定错误样例');
  await expect(page.locator('#progress-status')).toContainText('已保存');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'gcd-algorithm': true});

  await page.locator('.footer-nav a[href="index.html"]').click();
  await expect(page.locator('#stage-progress')).toContainText('1/11');
  await page.goto('/index.html');
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total', '30');
  await expect(page.locator('[data-subject="computer"] .sp-label')).toContainText('已学 1/30');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('high');
  await page.getByRole('searchbox', {name: '关键词'}).fill('最大公约数');
  await page.locator('#site-results a[href="computer/high/gcd-algorithm.html"]').click();
  await expect(page).toHaveURL(/computer\/high\/gcd-algorithm\.html/);
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
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'gcd-algorithm': true});
});

test('320px keyboard access keeps controls and state views within the viewport', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.goto(topic);
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.locator('#block-condition').focus();
  await page.locator('#block-condition').selectOption('while-b-nonzero');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await expect(page.locator('#flowchart')).toBeVisible();
  await expect(page.locator('#number-a')).toBeVisible();
});

test('direct file open and release subpath keep the workbench interactive', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项不打开本机文件或临时发布服务器');
  await page.goto(pathToFileURL(resolve(__dirname, '../../computer/high/gcd-algorithm.html')).href);
  await expect(page.getByRole('heading', {name: '最大公约数算法工作台'})).toBeVisible();
  await construct(page);
  await predictAndRun(page, 36, 24, 12, '最大公约数为 12');

  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('computer/high/gcd-algorithm.html', release.base).href);
    expect(response.status()).toBe(200);
    await construct(page);
    await predictAndRun(page, 28, 0, 28, '最大公约数为 28');
  } finally { await release.close(); }
});
