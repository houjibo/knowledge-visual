const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/high/inequality.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/high/inequality.html';

async function setValues(page, a, b, c) {
  await page.locator('#open-foundation-a').fill(a);
  await page.locator('#open-foundation-b').fill(b);
  await page.locator('#open-foundation-c').fill(c);
}
async function answer(page, relation, formula) {
  await page.locator(`input[name="open-foundation-prediction"][value="${relation}"]`).check();
  await page.locator(`input[name="open-foundation-formula"][value="${formula}"]`).check();
  await page.locator('#open-foundation-check').click();
  return page.locator('#open-foundation-feedback');
}

test('负数乘数反向，错误通式被纠正且换条件清空旧预测', async ({page}) => {
  await page.goto(topic);
  await setValues(page, '3.25', '1.5', '-2');
  const feedback = await answer(page, '<', 'unchanged');
  await expect(feedback).toContainText('差值通式应为 ac−bc=c(a−b)');
  await expect(feedback).toContainText('−3.5');
  await answer(page, '<', 'scaled');
  await expect(feedback).toContainText('正确');
  await page.locator('#open-foundation-operation').selectOption('add');
  await expect(feedback).toBeHidden();
  await expect(page.locator('input[name="open-foundation-prediction"]:checked')).toHaveCount(0);
  await expect(page.locator('input[name="open-foundation-formula"]:checked')).toHaveCount(0);
  await answer(page, '>', 'unchanged');
  await expect(feedback).toContainText('差值不变');
  await expect(feedback).toContainText('1.75');
});

test('小数精确相等、零乘数与等式边界', async ({page}) => {
  await page.goto(topic);
  await setValues(page, '0.1', '0.3', '0');
  let feedback = await answer(page, '=', 'scaled');
  await expect(feedback).toContainText('变换后 0 = 0，差为 0');
  await expect(feedback).toContainText('严格不等关系变成相等');
  await page.locator('#open-foundation-c').fill('0.2');
  await page.locator('#open-foundation-operation').selectOption('add');
  feedback = await answer(page, '<', 'unchanged');
  await expect(feedback).toContainText('原差 a−b=−0.2');
  await expect(feedback).toContainText('变换后 0.3 < 0.5，差为 −0.2');
  await setValues(page, '0.1', '0.1', '-2.5');
  await page.locator('#open-foundation-operation').selectOption('multiply');
  feedback = await answer(page, '=', 'scaled');
  await expect(feedback).toContainText('a=b 时原差为 0');
  await expect(feedback).toContainText('−0.25 = −0.25');
});

test('空值、超界及过多小数位不产生关系结论', async ({page}) => {
  await page.goto(topic);
  const feedback = page.locator('#open-foundation-feedback');
  await page.locator('#open-foundation-a').fill('');
  await page.locator('#open-foundation-check').click();
  await expect(feedback).toContainText('至多三位小数');
  await expect(feedback).not.toContainText('变换后');
  for (const value of ['1000.001', '0.1234', 'Infinity']) {
    await page.locator('#open-foundation-a').fill(value);
    await expect(feedback).toBeHidden();
    await page.locator('#open-foundation-check').click();
    await expect(feedback).toContainText('绝对值不超过 1000');
  }
  await page.locator('#open-foundation-a').fill('2');
  await page.locator('#open-foundation-check').click();
  await expect(feedback).toContainText('请先选择');
});

test('320px 键盘完成自选关系与通式且不横向溢出', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.goto(topic);
  await setValues(page, '-1', '2', '-3');
  const relation = page.locator('input[name="open-foundation-prediction"][value=">"]');
  await relation.focus();
  await page.keyboard.press('Space');
  const formula = page.locator('input[name="open-foundation-formula"][value="scaled"]');
  await formula.focus();
  await page.keyboard.press('Space');
  await page.locator('#open-foundation-check').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#open-foundation-feedback')).toContainText('正确');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('文件直开及发布子路径加载开放性质工作台', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网路径由上方共用用例验证');
  await page.goto(pathToFileURL(resolve(__dirname, '../../math/high/inequality.html')).href);
  await expect(page.locator('#open-foundation-check')).toBeVisible();
  await setValues(page, '3', '1', '-2');
  await answer(page, '<', 'scaled');
  await expect(page.locator('#open-foundation-feedback')).toContainText('正确');
  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('math/high/inequality.html', release.base).href);
    expect(response.status()).toBe(200);
    await answer(page, '<', 'scaled');
    await expect(page.locator('#open-foundation-feedback')).toContainText('正确');
  } finally { await release.close(); }
});
