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
  await expect(page.locator('#relations-lab')).toBeVisible();
}

async function choose(page, group, members) {
  for (const n of members) await page.locator(group).getByRole('button', {name: `挑战 ${group.endsWith('-a') ? 'A' : 'B'} 元素 ${n}`}).click();
}

async function predict(page, members) {
  for (const n of members) await page.locator('#relations-prediction').getByRole('button', {name: `预测运算结果 元素 ${n}`}).click();
}

test('真子集、相等、真超集通过两侧见证区别；A/B 变化清理旧反馈', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await openLab(page);
  await expect(page.locator('#relations-regions')).toContainText('A 独有 ∅；A、B 共有 {1, 2}；B 独有 {3, 4}');
  await page.locator('#relations-choice input[value="equal"]').check();
  await page.locator('#relations-witness-a').selectOption('none');
  await page.locator('#relations-witness-b').selectOption('3');
  await page.locator('#relations-check').click();
  await expect(page.locator('#relations-feedback')).toContainText('关系需重判');
  await page.locator('#relations-choice input[value="subset"]').check();
  await expect(page.locator('#relations-feedback')).toBeHidden();
  await page.locator('#relations-check').click();
  await expect(page.locator('#relations-feedback')).toContainText('A⊊B');
  await expect(page.locator('#relations-feedback')).toContainText('A−B 为空');

  await page.locator('#relations-presets button[data-preset="equal"]').click();
  await expect(page.locator('#relations-choice input:checked')).toHaveCount(0);
  await expect(page.locator('#relations-witness-b')).toHaveValue('');
  await page.locator('#relations-choice input[value="equal"]').check();
  await page.locator('#relations-witness-a').selectOption('none');
  await page.locator('#relations-witness-b').selectOption('none');
  await page.locator('#relations-check').click();
  await expect(page.locator('#relations-feedback')).toContainText('A=B');
  await choose(page, '#relations-b', [3]);
  await expect(page.locator('#relations-feedback')).toBeHidden();
  await expect(page.locator('#relations-current')).toContainText('A = {1, 2, 3}，B = {1, 2}');
  await page.locator('#relations-choice input[value="superset"]').check();
  await page.locator('#relations-witness-a').selectOption('3');
  await page.locator('#relations-check').click();
  await expect(page.locator('#relations-feedback')).toContainText('B⊊A');
  expect(errors).toEqual([]);
});

test('互不包含与不相交的动态 Venn 区域和双向见证一致', async ({page}) => {
  await openLab(page);
  await page.locator('#relations-presets button[data-preset="incomparable"]').click();
  const actual = await page.locator('#relations-diagram svg').evaluate(svg => {
    const [a, b] = [...svg.querySelectorAll('circle')].map(c => ({x: +c.getAttribute('cx'), y: +c.getAttribute('cy'), r: +c.getAttribute('r')}));
    const regions = {aOnly: [], both: [], bOnly: [], outside: []};
    for (const node of svg.querySelectorAll('.relations-svg-number')) {
      const x = +node.getAttribute('x');
      const y = +node.getAttribute('y');
      const inA = Math.hypot(x - a.x, y - a.y) < a.r;
      const inB = Math.hypot(x - b.x, y - b.y) < b.r;
      regions[inA ? (inB ? 'both' : 'aOnly') : (inB ? 'bOnly' : 'outside')].push(+node.textContent);
    }
    return regions;
  });
  expect(actual).toEqual({aOnly: [1], both: [2, 3], bOnly: [4], outside: [5, 6]});
  await expect(page.locator('#relations-diagram svg')).toHaveAttribute('aria-label', /A 独有 \{1\}.*共有 \{2, 3\}.*B 独有 \{4\}/);
  await expect(page.locator('#relations-regions')).toContainText('A 独有 {1}；A、B 共有 {2, 3}；B 独有 {4}；两者之外 {5, 6}');
  await page.locator('#relations-choice input[value="incomparable"]').check();
  await page.locator('#relations-witness-a').selectOption('1');
  await page.locator('#relations-check').click();
  await expect(page.locator('#relations-feedback')).toContainText('先选关系');
  await page.locator('#relations-witness-b').selectOption('4');
  await page.locator('#relations-check').click();
  await expect(page.locator('#relations-feedback')).toContainText('两边各有对方没有的元素');

  await page.locator('#relations-presets button[data-preset="disjoint"]').click();
  await expect(page.locator('#relations-diagram svg')).toHaveAttribute('aria-label', /共有 ∅/);
  await expect(page.locator('#relations-regions')).toContainText('A、B 共有 ∅');
  await page.locator('#relations-operation-choice input[value="intersection"]').check();
  await page.locator('#relations-operation-check').click();
  await expect(page.locator('#relations-operation-feedback')).toContainText('A∩B=∅');
  await predict(page, [1]);
  await expect(page.locator('#relations-operation-feedback')).toBeHidden();
  await page.locator('#relations-operation-check').click();
  await expect(page.locator('#relations-operation-feedback')).toContainText('多选 1：只在 A 中');
});

test('先预测交并，再得到漏选、多选与六个候选的去留解释', async ({page}) => {
  await openLab(page);
  await page.locator('#relations-presets button[data-preset="incomparable"]').click();
  await page.locator('#relations-operation-check').click();
  await expect(page.locator('#relations-operation-feedback')).toContainText('先选择交集或并集');
  await page.locator('#relations-operation-choice input[value="intersection"]').check();
  await predict(page, [1, 2]);
  await page.locator('#relations-operation-check').click();
  await expect(page.locator('#relations-operation-feedback')).toContainText('漏选 3：同时在 A、B 中');
  await expect(page.locator('#relations-operation-feedback')).toContainText('多选 1：只在 A 中');
  await predict(page, [1, 3]);
  await expect(page.locator('#relations-operation-feedback')).toBeHidden();
  await page.locator('#relations-operation-check').click();
  await expect(page.locator('#relations-operation-feedback')).toContainText('A∩B={2, 3}');
  await expect(page.locator('#relations-operation-feedback')).toContainText('6 既不在 A 也不在 B 中，不选');
  await page.locator('#relations-operation-choice input[value="union"]').check();
  await expect(page.locator('#relations-operation-feedback')).toBeHidden();
  await predict(page, [1, 4]);
  await page.locator('#relations-operation-check').click();
  await expect(page.locator('#relations-operation-feedback')).toContainText('A∪B={1, 2, 3, 4}');
  await choose(page, '#relations-a', [6]);
  await expect(page.locator('#relations-operation-feedback')).toBeHidden();
  await expect(page.locator('#relations-prediction').getByRole('button', {name: '预测运算结果 元素 6'})).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#relations-operation-check').click();
  await expect(page.locator('#relations-operation-feedback')).toContainText('漏选 6：只在 A 中');
});

test('320px 键盘可构造空集、选择关系和运算，页面不横向溢出', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await openLab(page);
  await page.locator('#relations-presets button[data-preset="equal"]').click();
  for (const n of [1, 2, 3]) {
    const button = page.locator('#relations-a').getByRole('button', {name: `挑战 A 元素 ${n}`});
    await button.focus();
    await page.keyboard.press(n % 2 ? 'Enter' : 'Space');
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    const bButton = page.locator('#relations-b').getByRole('button', {name: `挑战 B 元素 ${n}`});
    await bButton.focus();
    await page.keyboard.press('Space');
  }
  await expect(page.locator('#relations-current')).toContainText('A = ∅，B = ∅');
  await page.locator('#relations-choice input[value="equal"]').focus();
  await page.keyboard.press('Space');
  await page.locator('#relations-witness-a').selectOption('none');
  await page.locator('#relations-witness-b').selectOption('none');
  await page.locator('#relations-check').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#relations-feedback')).toContainText('A=B');
  await page.locator('#relations-operation-choice input[value="union"]').focus();
  await page.keyboard.press('Space');
  await page.locator('#relations-operation-check').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#relations-operation-feedback')).toContainText('A∪B=∅');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('直接文件与发布子路径可加载模型和交互脚本', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网场景由上述共用用例验证');
  await openLab(page, pathToFileURL(resolve(__dirname, '../../math/high/sets.html')).href);
  await page.locator('#relations-operation-choice input[value="intersection"]').check();
  await predict(page, [1, 2]);
  await page.locator('#relations-operation-check').click();
  await expect(page.locator('#relations-operation-feedback')).toContainText('A∩B={1, 2}');
  const release = await startReleaseServer();
  try {
    await openLab(page, new URL('math/high/sets.html', release.base).href);
    await page.locator('#relations-operation-choice input[value="intersection"]').check();
    await predict(page, [1, 2]);
    await page.locator('#relations-operation-check').click();
    await expect(page.locator('#relations-operation-feedback')).toContainText('A∩B={1, 2}');
  } finally {
    await release.close();
  }
});
