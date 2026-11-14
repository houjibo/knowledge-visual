const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/high/sets.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/high/sets.html';

async function openLab(page, url = topic) {
  await page.goto(url);
  await page.getByRole('button', {name: '集合运算', exact: true}).click();
  await expect(page.locator('#complement-lab')).toBeVisible();
}

async function choose(page, group, numbers) {
  for (const number of numbers) await page.locator(group).getByRole('button', {name: new RegExp(`元素 ${number}(?:$|（)`) }).click();
}

test('同一 A 下扩大 U，补集随讨论范围变化且缺项有反馈', async ({page}) => {
  await openLab(page);
  await expect(page.locator('#complement-current')).toContainText('U = {1, 2, 3, 4}，A = {2, 4}');
  await choose(page, '#complement-prediction', [2, 3]);
  await page.locator('#complement-check').click();
  await expect(page.locator('#complement-feedback')).toContainText('先判断预测的补集是否为空集');
  await page.locator('#complement-empty-choice input[value="nonempty"]').check();
  await page.locator('#complement-check').click();
  await expect(page.locator('#complement-feedback')).toContainText('漏选补集元素 1');
  await expect(page.locator('#complement-feedback')).toContainText('多选了 A 中的元素 2');
  await choose(page, '#complement-prediction', [2, 1]);
  await expect(page.locator('#complement-feedback')).toBeHidden();
  await page.locator('#complement-check').click();
  await expect(page.locator('#complement-feedback')).toContainText('∁ᵤA = {1, 3}');
  await expect(page.locator('#complement-feedback')).toContainText('再试“扩大 U”');
  await expect(page.locator('#complement-diagram .revealed')).toHaveCount(2);

  await page.locator('#complement-presets button[data-preset="large"]').click();
  await expect(page.locator('#complement-feedback')).toBeHidden();
  await expect(page.locator('#complement-current')).toContainText('U = {1, 2, 3, 4, 5, 6}，A = {2, 4}');
  await choose(page, '#complement-prediction', [1, 3]);
  await page.locator('#complement-empty-choice input[value="nonempty"]').check();
  await page.locator('#complement-check').click();
  await expect(page.locator('#complement-feedback')).toContainText('漏选补集元素 5、6');
  await expect(page.locator('#complement-diagram .revealed')).toHaveCount(0);
  await choose(page, '#complement-prediction', [5, 6]);
  await expect(page.locator('#complement-feedback')).toBeHidden();
  await page.locator('#complement-check').click();
  await expect(page.locator('#complement-feedback')).toContainText('∁ᵤA = {1, 3, 5, 6}');
  await expect(page.locator('#complement-feedback')).toContainText('新增的 5、6');
  const actual = await page.locator('#complement-diagram svg').evaluate(svg => {
    const ellipse = svg.querySelector('ellipse');
    const cx = +ellipse.getAttribute('cx');
    const cy = +ellipse.getAttribute('cy');
    const rx = +ellipse.getAttribute('rx');
    const ry = +ellipse.getAttribute('ry');
    return [...svg.querySelectorAll('.complement-svg-number')].map(node => ({
      n: +node.textContent,
      insideA: ((+node.getAttribute('x') - cx) / rx) ** 2 + ((+node.getAttribute('y') - cy) / ry) ** 2 < 1,
      revealed: node.classList.contains('revealed')
    }));
  });
  expect(actual.filter(item => item.insideA).map(item => item.n)).toEqual([2, 4]);
  expect(actual.filter(item => !item.insideA).map(item => item.n)).toEqual([1, 3, 5, 6]);
  expect(actual.filter(item => item.revealed).map(item => item.n)).toEqual([1, 3, 5, 6]);
});

test('A=U 的补集是空集；A=∅ 的补集是 U', async ({page}) => {
  await openLab(page);
  await page.locator('#complement-presets button[data-preset="all"]').click();
  await page.locator('#complement-empty-choice input[value="nonempty"]').check();
  await page.locator('#complement-check').click();
  await expect(page.locator('#complement-feedback')).toContainText('补集是空集');
  await page.locator('#complement-empty-choice input[value="empty"]').check();
  await expect(page.locator('#complement-feedback')).toBeHidden();
  await page.locator('#complement-check').click();
  await expect(page.locator('#complement-feedback')).toContainText('∁ᵤA = ∅');

  await page.locator('#complement-presets button[data-preset="empty"]').click();
  await choose(page, '#complement-prediction', [1, 2, 3, 4]);
  await page.locator('#complement-empty-choice input[value="empty"]').check();
  await page.locator('#complement-check').click();
  await expect(page.locator('#complement-feedback')).toContainText('补集不是空集');
  await page.locator('#complement-empty-choice input[value="nonempty"]').check();
  await page.locator('#complement-check').click();
  await expect(page.locator('#complement-feedback')).toContainText('∁ᵤA = {1, 2, 3, 4}');
  await expect(page.locator('#complement-feedback')).toContainText('空的是 A');
});

test('320px 键盘构造、收缩 U 后修剪成员并保持反馈可靠', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await openLab(page);
  await page.locator('#complement-presets button[data-preset="large"]').click();
  const a6 = page.locator('#complement-a').getByRole('button', {name: '工作台 A 元素 6'});
  await a6.focus();
  await page.keyboard.press('Enter');
  await expect(a6).toHaveAttribute('aria-pressed', 'true');
  const p6 = page.locator('#complement-prediction').getByRole('button', {name: '预测补集 元素 6'});
  await p6.focus();
  await page.keyboard.press('Space');
  await expect(p6).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#complement-universe').getByRole('button', {name: '全集 U 元素 6'}).click();
  await expect(a6).toBeDisabled();
  await expect(a6).toHaveAttribute('aria-pressed', 'false');
  await expect(p6).toBeDisabled();
  await expect(p6).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#complement-current')).toContainText('U = {1, 2, 3, 4, 5}，A = {2, 4}');
  await choose(page, '#complement-prediction', [1, 3, 5]);
  await page.locator('#complement-empty-choice input[value="nonempty"]').check();
  await page.locator('#complement-check').click();
  await expect(page.locator('#complement-feedback')).toContainText('∁ᵤA = {1, 3, 5}');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.locator('#complement-presets button[data-preset="all"]').click();
  await choose(page, '#complement-universe', [2, 3, 4]);
  await page.locator('#complement-universe').getByRole('button', {name: '全集 U 元素 1'}).click();
  await expect(page.locator('#complement-current')).toContainText('U = {1}，A = {1}');
  await expect(page.locator('#complement-limit')).toContainText('至少保留一个讨论对象');
});

test('直接文件与发布包子路径加载补集模型', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网用例使用同一练习的共用交互场景');
  await openLab(page, pathToFileURL(resolve(__dirname, '../../math/high/sets.html')).href);
  await choose(page, '#complement-prediction', [1, 3]);
  await page.locator('#complement-empty-choice input[value="nonempty"]').check();
  await page.locator('#complement-check').click();
  await expect(page.locator('#complement-feedback')).toContainText('∁ᵤA = {1, 3}');
  const release = await startReleaseServer();
  try {
    await openLab(page, new URL('math/high/sets.html', release.base).href);
    await choose(page, '#complement-prediction', [1, 3]);
    await page.locator('#complement-empty-choice input[value="nonempty"]').check();
    await page.locator('#complement-check').click();
    await expect(page.locator('#complement-feedback')).toContainText('∁ᵤA = {1, 3}');
  } finally {
    await release.close();
  }
});
