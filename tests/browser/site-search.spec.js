const {test, expect} = require('@playwright/test');
const path = require('node:path');
const {pathToFileURL} = require('node:url');

test('首页查找导航别名和同名跨学段主题', async ({page}) => {
  await page.goto('/');
  const query = page.getByRole('searchbox', {name: '关键词'});
  await query.fill('加法');
  await expect(page.locator('#site-results a[href="math/topics/addition/index.html"]')).toBeVisible();
  await query.fill('导数');
  await expect(page.locator('#site-results a[href="math/high/derivative.html"]')).toBeVisible();
  await expect(page.locator('#site-results a[href="math/uni/derivative.html"]')).toBeVisible();
  const rect = await page.locator('#site-search').boundingBox();
  expect(rect.x).toBeGreaterThanOrEqual(0);
  expect(rect.x + rect.width).toBeLessThanOrEqual(page.viewportSize().width);
});

test('筛选、无结果和键盘清空', async ({page}) => {
  await page.goto('/');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('physics');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('middle');
  await page.getByRole('searchbox', {name: '关键词'}).fill('运动');
  const results = page.locator('#site-results a');
  expect(await results.count()).toBeGreaterThan(0);
  expect((await results.allTextContents()).every(text => text.includes('物理 · 初中'))).toBe(true);
  await expect(page.locator('#site-results a[href="physics/middle/motion.html"]')).toBeVisible();
  await page.getByRole('searchbox', {name: '关键词'}).fill('没有此主题的关键词');
  await expect(page.locator('#site-search-status')).toContainText('没有找到');
  await page.getByRole('button', {name: '清空'}).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('searchbox', {name: '关键词'})).toHaveValue('');
  await expect(page.getByRole('searchbox', {name: '关键词'})).toBeFocused();
  await expect(page.getByRole('combobox', {name: '学科', exact: true})).toHaveValue('');
  await expect(page.getByRole('combobox', {name: '学段', exact: true})).toHaveValue('');
  await expect(page.locator('#site-results')).toBeHidden();
  await expect(page.getByRole('link', {name: /物理 初中/})).toBeVisible();
});

test('计算机与人工智能主题可按学科、学段和导航别名查找', async ({page}) => {
  await page.goto('/');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer-ai');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('primary');
  await page.getByRole('searchbox', {name: '关键词'}).fill('算法');
  const result = page.locator('#site-results a[href="computer-ai/primary/robot-algorithms.html"]');
  await expect(result).toBeVisible();
  await expect(result).toContainText('计算机与人工智能 · 小学');
  await result.click();
  await expect(page).toHaveURL(/computer-ai\/primary\/robot-algorithms\.html$/);
});

test('本地文件可搜索并进入主题', async ({page}) => {
  await page.goto(pathToFileURL(path.resolve(__dirname, '../../index.html')).href);
  await page.getByRole('searchbox', {name: '关键词'}).fill('加法');
  await page.locator('#site-results a[href="math/topics/addition/index.html"]').click();
  await expect(page).toHaveURL(/math\/topics\/addition\/index\.html$/);
});

test('脚本关闭时保留学科入口', async ({browser}) => {
  const context = await browser.newContext({javaScriptEnabled: false});
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4183/');
  await expect(page.locator('#site-search')).toBeHidden();
  await expect(page.getByRole('link', {name: /数学 小学/})).toBeVisible();
  await context.close();
});

test('目录加载失败时保留学科入口', async ({page}) => {
  await page.route('**/assets/topic-catalog.js', route => route.abort());
  await page.goto('/');
  await expect(page.locator('#site-search')).toBeHidden();
  await expect(page.getByRole('link', {name: /数学 小学/})).toBeVisible();
});
