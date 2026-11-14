const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/high/sets.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/high/sets.html';

async function chooseMembers(page, numbers) {
  for (const number of numbers) await page.getByRole('button', {name: `选择结果元素 ${number}`}).click();
}

test('自然条件要同时选对成员与符号；反馈分别指出漏选、多选和表达错误', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(topic);
  await expect(page.locator('#language-source')).toContainText('不大于 4 的偶数');
  await chooseMembers(page, [2, 5]);
  await expect(page.locator('#language-preview svg')).toHaveAttribute('aria-label', /A 内 2、5/);
  await page.locator('#language-options input[value="odd-at-most-four"]').check();
  await page.locator('#language-submit').click();
  await expect(page.locator('#language-feedback')).toContainText('漏选 4');
  await expect(page.locator('#language-feedback')).toContainText('多选 5');
  await expect(page.locator('#language-feedback')).toContainText('奇数');
  await expect(page.locator('#language-next')).toBeHidden();
  await chooseMembers(page, [5, 4]);
  await expect(page.locator('#language-feedback')).toBeHidden();
  await page.locator('#language-options input[value="even-at-most-four"]').check();
  await page.locator('#language-submit').click();
  await expect(page.locator('#language-feedback')).toContainText('2 和 4');
  await expect(page.locator('#language-next')).toBeVisible();
  await expect(page.getByRole('button', {name: '选择结果元素 2'})).toBeDisabled();
  expect(errors).toEqual([]);
});

test('符号到自然语言、Venn 图到交集完成三轮后可重做', async ({page}) => {
  await page.goto(topic);
  await chooseMembers(page, [2, 4]);
  await page.locator('#language-options input[value="even-at-most-four"]').check();
  await page.locator('#language-submit').click();
  await page.locator('#language-next').click();
  await expect(page.locator('#language-step')).toHaveText('第 2 / 3 轮');
  await expect(page.locator('#language-source')).toContainText('3 的倍数');
  await chooseMembers(page, [3, 6]);
  await page.locator('#language-options input[value="odd"]').check();
  await page.locator('#language-submit').click();
  await expect(page.locator('#language-feedback')).toContainText('6 也是 3 的倍数');
  await expect(page.locator('#language-next')).toBeHidden();
  await page.locator('#language-options input[value="multiples-three"]').check();
  await expect(page.locator('#language-feedback')).toBeHidden();
  await page.locator('#language-submit').click();
  await page.locator('#language-next').click();
  await expect(page.locator('#language-step')).toHaveText('第 3 / 3 轮');
  const diagram = page.locator('#language-source-diagram svg');
  await expect(diagram).toHaveAttribute('aria-label', /A 与 B 共同有 2、4/);
  const geometry = await diagram.evaluate(svg => {
    const circles = [...svg.querySelectorAll('circle')].map(c => ({x: +c.getAttribute('cx'), y: +c.getAttribute('cy'), r: +c.getAttribute('r')}));
    const numbers = [...svg.querySelectorAll('text')].filter(t => /^[1-6]$/.test(t.textContent))
      .map(t => ({n: +t.textContent, x: +t.getAttribute('x'), y: +t.getAttribute('y')}));
    return {circles, numbers};
  });
  const [a, b] = geometry.circles;
  const actualRegions = {aOnly: [], both: [], bOnly: [], outside: []};
  for (const point of geometry.numbers) {
    const inA = Math.hypot(point.x - a.x, point.y - a.y) < a.r;
    const inB = Math.hypot(point.x - b.x, point.y - b.y) < b.r;
    actualRegions[inA ? (inB ? 'both' : 'aOnly') : (inB ? 'bOnly' : 'outside')].push(point.n);
  }
  expect(actualRegions).toEqual({aOnly: [1], both: [2, 4], bOnly: [6], outside: [3, 5]});
  await chooseMembers(page, [2, 4]);
  await page.locator('#language-options input[value="intersection"]').check();
  await page.locator('#language-submit').click();
  await expect(page.locator('#language-feedback')).toContainText('三轮转换已完成');
  await expect(page.locator('#language-next')).toBeHidden();
  await page.locator('#language-restart').click();
  await expect(page.locator('#language-step')).toHaveText('第 1 / 3 轮');
  await expect(page.getByRole('button', {name: '选择结果元素 2'})).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#language-feedback')).toBeHidden();
});

test('320px 键盘操作与直接文件打开可完成一轮', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.goto(topic);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const member = page.getByRole('button', {name: '选择结果元素 2'});
  await member.focus();
  await page.keyboard.press('Enter');
  await expect(member).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', {name: '选择结果元素 4'}).focus();
  await page.keyboard.press('Space');
  const option = page.locator('#language-options input[value="even-at-most-four"]');
  await option.focus();
  await page.keyboard.press('Space');
  await page.locator('#language-submit').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#language-next')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  if (process.env.KV_PUBLISHED_BASE_URL) return;
  await page.goto(pathToFileURL(resolve(__dirname, '../../math/high/sets.html')).href);
  await chooseMembers(page, [2, 4]);
  await page.locator('#language-options input[value="even-at-most-four"]').check();
  await page.locator('#language-submit').click();
  await expect(page.locator('#language-next')).toBeVisible();
});

test('发布包子路径加载模型与练习脚本', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网页面在上面的共用用例中直接验证');
  const release = await startReleaseServer();
  try {
    await page.goto(new URL('math/high/sets.html', release.base).href);
    await chooseMembers(page, [2, 4]);
    await page.locator('#language-options input[value="even-at-most-four"]').check();
    await page.locator('#language-submit').click();
    await expect(page.locator('#language-next')).toBeVisible();
  } finally {
    await release.close();
  }
});
