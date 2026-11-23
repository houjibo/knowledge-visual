const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/high/sets.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/high/sets.html';

async function openLab(page, url = topic) {
  await page.goto(url);
  await page.getByRole('button', {name: 'Venn图', exact: true}).click();
  await expect(page.locator('#set-subsets-lab')).toBeVisible();
}
async function choose(page, masks) {
  for (const mask of masks) await page.locator(`#set-subsets-candidates button[data-mask="${mask}"]`).click();
}

test('双元素集合先漏空集再误选桃，反馈给出归属原因', async ({page}) => {
  await openLab(page);
  await expect(page.locator('#set-subsets-current')).toContainText('A = {苹果，梨}');
  await page.locator('#set-subsets-count').selectOption('4');
  await choose(page, [1, 2, 3]);
  await page.locator('#set-subsets-check').click();
  await expect(page.locator('#set-subsets-feedback')).toContainText('漏选 ∅');
  await choose(page, [0, 4]);
  await page.locator('#set-subsets-check').click();
  await expect(page.locator('#set-subsets-feedback')).toContainText('桃 不属于 A');
  await choose(page, [4]);
  await page.locator('#set-subsets-check').click();
  await expect(page.locator('#set-subsets-feedback')).toContainText('有 4 个子集');
});

test('空集和全集边界，改变 A 后清除旧答与结果', async ({page}) => {
  await openLab(page);
  await page.getByRole('button', {name: 'A 中包含 苹果'}).click();
  await page.getByRole('button', {name: 'A 中包含 梨'}).click();
  await page.locator('#set-subsets-count').selectOption('1');
  await choose(page, [0]);
  await page.locator('#set-subsets-check').click();
  await expect(page.locator('#set-subsets-feedback')).toContainText('A=∅ 有 1 个子集');
  for (const name of ['苹果', '梨', '桃']) await page.getByRole('button', {name: `A 中包含 ${name}`}).click();
  await expect(page.locator('#set-subsets-count')).toHaveValue('');
  await expect(page.locator('#set-subsets-feedback')).toBeHidden();
  await expect(page.locator('#set-subsets-candidates button[aria-pressed="true"]')).toHaveCount(0);
  await page.locator('#set-subsets-count').selectOption('8');
  await choose(page, [0, 1, 2, 3, 4, 5, 6, 7]);
  await page.locator('#set-subsets-check').click();
  await expect(page.locator('#set-subsets-feedback')).toContainText('有 8 个子集');
});

test('320px 下键盘可选对象、候选与个数，页面不横向溢出', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await openLab(page);
  const apple = page.getByRole('button', {name: 'A 中包含 苹果'});
  await apple.focus();
  await page.keyboard.press('Enter');
  await expect(apple).toHaveAttribute('aria-pressed', 'false');
  const empty = page.getByRole('button', {name: '候选子集 ∅'});
  await empty.focus();
  await page.keyboard.press('Space');
  await expect(empty).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#set-subsets-count').selectOption('2');
  await page.getByRole('button', {name: '候选子集 {梨}'}).click();
  await page.locator('#set-subsets-check').click();
  await expect(page.locator('#set-subsets-feedback')).toContainText('有 2 个子集');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('直接文件与发布子路径加载练习', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网路径由上方共用用例验证');
  await openLab(page, pathToFileURL(resolve(__dirname, '../../math/high/sets.html')).href);
  await expect(page.locator('#set-subsets-candidates button')).toHaveCount(8);
  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('math/high/sets.html', release.base).href);
    expect(response.status()).toBe(200);
    await page.getByRole('button', {name: 'Venn图', exact: true}).click();
    await expect(page.locator('#set-subsets-candidates button')).toHaveCount(8);
  } finally { await release.close(); }
});
