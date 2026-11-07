const {test, expect} = require('@playwright/test');
const path = require('node:path');
const {pathToFileURL} = require('node:url');

async function exerciseSearch(page) {
  const query = page.getByRole('searchbox', {name: '查找小学数学主题'});
  await expect(query).toBeVisible();
  await query.fill('认识面积');
  await expect(page.locator('#topic-search-status')).toContainText('找到');
  const results = page.locator('#topic-search-results');
  await expect(results.locator('a[href="topics/understanding-area/index.html"]')).toHaveCount(1);
  await expect(page.locator('#topic-browse')).toBeHidden();
  await expect(results.locator('a[href="topics/understanding-area/index.html"]')).toBeVisible();
  const hrefs = await results.locator('a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
  expect(new Set(hrefs).size).toBe(hrefs.length);
  await query.fill('g1');
  await expect(results.locator('a[href="topics/numbers/index.html"]')).toBeVisible();
  await query.fill('面积 g3');
  await expect(results.locator('a[href="topics/understanding-area/index.html"]')).toBeVisible();
  await query.fill('无匹配的测试关键词');
  await expect(page.getByRole('status')).toContainText('没有找到相关主题');
  await page.getByRole('button', {name: '清空'}).focus();
  await page.keyboard.press('Enter');
  await expect(query).toHaveValue('');
  await expect(query).toBeFocused();
  await expect(page.locator('#topic-browse')).toBeVisible();
  await expect(results).toBeHidden();
}

test('小学数学主题查找、空结果与键盘恢复', async ({page}) => {
  await page.goto('/math/index.html');
  await exerciseSearch(page);
});

test('搜索结果保留已完成主题的进度标记', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('kv-math-progress', JSON.stringify({'understanding-area': 1})));
  await page.goto('/math/index.html');
  await page.getByRole('searchbox', {name: '查找小学数学主题'}).fill('认识面积');
  await expect(page.locator('#topic-search-results a[href="topics/understanding-area/index.html"] .progress-badge')).toBeVisible();
});

test('小学数学目录直接打开文件时可搜索并进入主题', async ({page}) => {
  const file = pathToFileURL(path.resolve(__dirname, '../../math/index.html')).href;
  await page.goto(file);
  await page.getByRole('searchbox', {name: '查找小学数学主题'}).fill('认识面积');
  const result = page.locator('#topic-search-results a[href="topics/understanding-area/index.html"]');
  await result.click();
  await expect(page).toHaveURL(/topics\/understanding-area\/index\.html$/);
});

test('脚本关闭时仍可浏览原目录', async ({browser}) => {
  const context = await browser.newContext({javaScriptEnabled: false});
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4183/math/index.html');
  await expect(page.locator('#topic-search')).toBeHidden();
  await expect(page.locator('#topic-browse a[href="topics/understanding-area/index.html"]').first()).toBeVisible();
  await context.close();
});
