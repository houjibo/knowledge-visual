const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/high/counting.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/high/counting.html';
const answers = [1, 1, 2, 1, 1, 1, 2, 0];
const progressKey = 'kv-math-progress-v2';

async function setRange(page, selector, value) {
  await page.locator(selector).evaluate((input, next) => {
    input.value = next;
    input.dispatchEvent(new Event('input', {bubbles: true}));
  }, String(value));
}

async function answerRound(page, correctCount = 8) {
  await page.getByRole('tab', {name: /练习/}).click();
  for (let index = 0; index < answers.length; index++) {
    if (index > 0) await page.locator('#nextQuizButton').click();
    const answer = index < correctCount ? answers[index] : (answers[index] + 1) % 4;
    await page.locator('#quizArea .quiz-option').nth(answer).click();
  }
}

test('五个主题可从单一页签停靠点用方向键和原生按键进入', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(topic);
  const tabs = page.getByRole('tablist', {name: '计数原理主题'}).getByRole('tab');
  await expect(tabs).toHaveCount(5);
  await page.keyboard.press('Tab');
  await expect(tabs.first()).toBeFocused();
  await tabs.first().press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(page.locator('#p2')).toBeVisible();
  await expect(page.locator('#p1')).toBeHidden();
  await tabs.nth(1).press('End');
  await expect(tabs.last()).toBeFocused();
  await expect(page.locator('#quizArea .quiz-option')).toHaveCount(4);
  await tabs.last().press('ArrowRight');
  await expect(tabs.first()).toBeFocused();
  await tabs.first().press('ArrowLeft');
  await expect(tabs.last()).toBeFocused();
  await tabs.last().press('Home');
  await expect(tabs.first()).toBeFocused();
  await tabs.nth(2).focus();
  await tabs.nth(2).press('Space');
  await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#p3')).toBeVisible();
  expect(errors).toEqual([]);
});

test('同一组数量的分类相加与分步相乘给出可枚举的不同路线', async ({page}) => {
  await page.goto(topic);
  const mode = page.locator('#countMode');
  await expect(page.locator('#pathResult')).toHaveText('分类相加：2 + 3 = 5 条路线');
  await page.getByRole('button', {name: /列出全部路线/}).click();
  await expect(page.locator('#pathList button')).toHaveCount(5);
  const sumRoutes = await page.locator('#pathList button').allTextContents();
  expect(new Set(sumRoutes).size).toBe(5);
  expect(sumRoutes.every(route => (route.match(/→/g) || []).length === 2)).toBe(true);
  await page.locator('#pathList button').last().click();
  await expect(page.locator('#pathList button').last()).toHaveAttribute('aria-pressed', 'true');
  await mode.selectOption('product');
  await expect(page.locator('#pathResult')).toHaveText('分步相乘：2 × 3 = 6 条路线');
  await expect(page.locator('#pathList button')).toHaveCount(0);
  await page.getByRole('button', {name: /列出全部路线/}).click();
  await expect(page.locator('#pathList button')).toHaveCount(6);
  const productRoutes = await page.locator('#pathList button').allTextContents();
  expect(new Set(productRoutes).size).toBe(6);
  expect(productRoutes.every(route => (route.match(/→/g) || []).length === 3)).toBe(true);
  for (const [count, sum, product] of [[3, 9, 24], [4, 11, 48]]) {
    await setRange(page, '#treeCategories', count);
    await expect(page.locator('#pathResult')).toContainText(`= ${product} 条路线`);
    await page.getByRole('button', {name: /列出全部路线/}).click();
    await expect(page.locator('#pathList button')).toHaveCount(product);
    await mode.selectOption('sum');
    await expect(page.locator('#pathResult')).toContainText(`= ${sum} 条路线`);
    await page.getByRole('button', {name: /列出全部路线/}).click();
    await expect(page.locator('#pathList button')).toHaveCount(sum);
    await mode.selectOption('product');
  }
  await page.getByRole('button', {name: /重置/}).first().click();
  await expect(page.locator('#pathResult')).toHaveText('分类相加：2 + 3 = 5 条路线');
});

test('排列、组合和杨辉三角的选择可键盘执行且焦点和系数一致', async ({page}) => {
  await page.goto(topic);
  await page.getByRole('tab', {name: /排列/}).click();
  const ball1 = page.locator('#permPool button[data-value="1"]');
  await ball1.focus();
  await ball1.press('Enter');
  await expect(page.locator('#permSlots')).toContainText('1');
  await expect(page.locator('#permPool button[data-value="2"]')).toBeFocused();
  await page.locator('#permPool button[data-value="2"]').press('Space');
  await expect(page.locator('#permPool button[data-value="3"]')).toBeFocused();
  await page.getByRole('button', {name: /列举全部/}).click();
  await expect(page.locator('#permEnumList')).toContainText('共 24 种排列');

  await page.getByRole('tab', {name: /组合/}).click();
  const item2 = page.locator('#comboGrid button[data-value="2"]');
  await item2.focus();
  await item2.press('Enter');
  await expect(item2).toBeFocused();
  await expect(item2).toHaveAttribute('aria-pressed', 'true');
  await item2.press('Space');
  await expect(item2).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#comboResult')).toContainText('已选 0/2  C(5,2) = 10');
  await page.getByRole('button', {name: /列举全部组合/}).click();
  await expect(page.locator('#comboEnumList')).toContainText('共 10 种组合');

  await page.getByRole('tab', {name: /二项式/}).click();
  await setRange(page, '#pascalRows', 10);
  const cell = page.locator('#pascalTriangle button[data-row="9"][data-column="2"]');
  await cell.focus();
  await cell.press('Enter');
  await expect(cell).toBeFocused();
  await expect(cell).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#binomialNVal')).toHaveText('9');
  await expect(page.locator('#binomialCoeffs')).toContainText('36');
});

test('八题首次答案才计分，未答不能前进，五题正确达标后实际保存', async ({page}) => {
  await page.goto(topic);
  await page.getByRole('tab', {name: /练习/}).click();
  await expect(page.locator('#nextQuizButton')).toBeDisabled();
  await page.locator('#quizArea .quiz-option').nth(answers[0]).click();
  await expect(page.locator('#quizFeedback')).toBeVisible();
  await expect(page.locator('#quizScore')).toHaveText('得分：1 / 1');
  await expect(page.locator('#quizArea .quiz-option').first()).toBeDisabled();
  await page.evaluate(() => checkQuiz(0));
  await expect(page.locator('#quizScore')).toHaveText('得分：1 / 1');
  for (let index = 1; index < answers.length; index++) {
    await page.locator('#nextQuizButton').click();
    await expect(page.locator('#nextQuizButton')).toBeDisabled();
    await page.locator('#quizArea .quiz-option').nth(index < 5 ? answers[index] : (answers[index] + 1) % 4).click();
  }
  await expect(page.locator('#quizFeedback')).toContainText('本轮得分 5/8');
  await expect(page.locator('#quizSaveStatus')).toContainText('已保存在本机');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key))['high:counting'], progressKey)).toBeGreaterThan(0);
  await page.reload();
  await expect(page.locator('#quizSaveStatus')).toContainText('已有完成记录');
});

test('保存被拒绝时不假称完成，恢复后可重试且保留损坏原文', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网测试不替换存储实现');
  await page.addInitScript(key => {
    window.rejectCountingSave = true;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key && window.rejectCountingSave) throw new Error('denied');
      return original.call(this, name, value);
    };
  }, progressKey);
  await page.goto(topic);
  await answerRound(page, 5);
  await expect(page.locator('#quizSaveStatus')).toContainText('未保存');
  await expect(page.getByRole('button', {name: '重试保存'})).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
  await page.evaluate(() => { window.rejectCountingSave = false; });
  await page.getByRole('button', {name: '重试保存'}).click();
  await expect(page.locator('#quizSaveStatus')).toContainText('已保存在本机');
  await page.evaluate(key => localStorage.setItem(key, '{broken'), progressKey);
  await page.reload();
  await answerRound(page, 5);
  await expect(page.locator('#quizSaveStatus')).toContainText('未保存');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBe('{broken');
});

test('320px 无画布与减少动态下仍可读、可操作且改参取消旧演示', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.addInitScript(() => { HTMLCanvasElement.prototype.getContext = () => null; });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(topic);
  for (const tab of await page.getByRole('tab').all()) {
    await tab.click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  }
  await page.getByRole('tab', {name: /计数原理/}).click();
  expect(await page.locator('#treeScroll').evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
  await page.locator('#countMode').selectOption('product');
  await page.getByRole('button', {name: /列出全部路线/}).click();
  await expect(page.locator('#pathList button')).toHaveCount(6);
  await page.getByRole('button', {name: /重置/}).first().click();
  await page.getByRole('button', {name: /列出全部路线/}).click();
  await page.locator('#pathList button').last().click();
  expect(await page.locator('#treeScroll').evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
  await page.getByRole('tab', {name: /排列/}).click();
  await page.getByRole('button', {name: /自动演示/}).click();
  await expect(page.locator('#permSlots .filled')).toHaveCount(3);
  await setRange(page, '#permN', 2);
  await expect(page.locator('#permSlots .filled')).toHaveCount(0);
  await page.getByRole('tab', {name: /二项式/}).click();
  await setRange(page, '#pascalRows', 10);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  expect(errors).toEqual([]);
});

test('普通播放中改动排列参数会取消旧计时器', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项不依赖播放时钟');
  await page.goto(topic);
  await page.getByRole('tab', {name: /排列/}).click();
  await page.getByRole('button', {name: /自动演示/}).click();
  await setRange(page, '#permN', 2);
  await page.waitForTimeout(650);
  await expect(page.locator('#permSlots .filled')).toHaveCount(0);
  await expect(page.locator('#permResult')).toHaveText('A(2,2) = 2');
});

test('直接文件和发布子路径保留两种计数与练习入口', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项直接使用已部署路径');
  await page.goto(pathToFileURL(resolve(__dirname, '../../math/high/counting.html')).href);
  await page.locator('#countMode').selectOption('product');
  await expect(page.locator('#pathResult')).toHaveText('分步相乘：2 × 3 = 6 条路线');
  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('math/high/counting.html', release.base).href);
    expect(response.status()).toBe(200);
    await page.locator('#countMode').selectOption('product');
    await page.getByRole('button', {name: /列出全部路线/}).click();
    await expect(page.locator('#pathList button')).toHaveCount(6);
    await page.getByRole('tab', {name: /练习/}).click();
    await expect(page.locator('#quizArea .quiz-option')).toHaveCount(4);
  } finally { await release.close(); }
});
