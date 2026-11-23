const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/high/inequality.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/high/inequality.html';

async function setRange(page, id, value) {
  await page.locator(id).evaluate((el, next) => {
    el.value = String(next);
    el.dispatchEvent(new Event('input', {bubbles: true}));
  }, value);
}

test('负数与零乘法、等式边界先预测再反馈', async ({page}) => {
  await page.goto(topic);
  await page.locator('input[name="foundation-prediction"][value=">"]').check();
  await page.locator('#foundation-check').click();
  await expect(page.locator('#foundation-feedback')).toContainText('应为 <');
  await expect(page.locator('#foundation-feedback')).toContainText('-6 < -2');
  await page.locator('input[name="foundation-prediction"][value="<"]').check();
  await page.locator('#foundation-check').click();
  await expect(page.locator('#foundation-feedback')).toContainText('正确');
  await page.locator('#foundation-c').selectOption('0');
  await expect(page.locator('input[name="foundation-prediction"]:checked')).toHaveCount(0);
  await page.locator('input[name="foundation-prediction"][value="="]').check();
  await page.locator('#foundation-check').click();
  await expect(page.locator('#foundation-feedback')).toContainText('0 = 0');
  await page.locator('#foundation-start').selectOption('equal');
  await page.locator('#foundation-c').selectOption('-2');
  await page.locator('input[name="foundation-prediction"][value="="]').check();
  await page.locator('#foundation-check').click();
  await expect(page.locator('#foundation-feedback')).toContainText('同加或同乘一个数后仍相等');
});

test('负开口重根无解、正开口重根排除根，零系数不能选择', async ({page}) => {
  await page.goto(topic);
  await page.getByRole('button', {name: /一元二次不等式/}).click();
  await expect(page.locator('#slA option[value="0"]')).toHaveCount(0);
  await page.locator('#slA').selectOption('-1');
  await setRange(page, '#slB', 2);
  await setRange(page, '#slC', -1);
  await expect(page.locator('#quadratic-disc')).toHaveText('0.0');
  await expect(page.locator('#quadratic-solution')).toHaveText('∅（空集）');
  await page.locator('#slA').selectOption('1');
  await setRange(page, '#slB', -2);
  await setRange(page, '#slC', 1);
  await expect(page.locator('#quadratic-solution')).toHaveText('x ≠ 1.00');
  await page.locator('#slB').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#slB')).toBeFocused();
  await expect(page.locator('#slB + span')).toHaveText('-1.5');
});

test('基本不等式的等号只在两数相等时成立，滑块键盘调节保持焦点', async ({page}) => {
  await page.goto(topic);
  await page.getByRole('button', {name: /均值不等式/}).click();
  await setRange(page, '#slA2', 3);
  await setRange(page, '#slB2', 3.1);
  await expect(page.locator('#amgm-equality')).toContainText('a≠b');
  await setRange(page, '#slB2', 3);
  await expect(page.locator('#amgm-equality')).toContainText('成立');
  await page.locator('#slA2').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#slA2')).toBeFocused();
  await expect(page.locator('#slA2 + span')).toHaveText('3.1');
  await expect(page.locator('#amgm-equality')).toContainText('a≠b');
});

test('单选题只有一个真选项，重复提交不加分且切换标签不被计时器覆盖', async ({page}) => {
  await page.goto(topic);
  await page.getByRole('button', {name: /不等式性质/}).click();
  const property = page.getByRole('button', {name: '乘法性质（负数）'});
  await property.focus();
  await page.keyboard.press('Enter');
  await expect(property).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', {name: /互动练习/}).click();
  await page.locator('.quiz-opt').first().focus();
  await page.keyboard.press('Enter');
  await page.evaluate(() => document.querySelector('.quiz-opt').click());
  expect(await page.evaluate(() => quizScore)).toBe(1);
  await page.getByRole('button', {name: /不等式性质/}).click();
  await page.waitForTimeout(2200);
  await expect(page.locator('#panelTitle')).toContainText('乘法性质（负数）');
  await page.getByRole('button', {name: /互动练习/}).click();
  await expect(page.locator('#panelContent .equation')).toContainText('x² - 5x + 6');
  await page.locator('.quiz-opt').nth(1).click();
  await page.waitForTimeout(2200);
  await expect(page.locator('.quiz-opts')).toContainText('a² > b²');
  await expect(page.locator('.quiz-opts')).toContainText('a - c < b - c');
  await expect(page.locator('.quiz-opts')).not.toContainText('a + c > b + c');
});

test('320px 键盘完成比较预测且页面不横向溢出', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.goto(topic);
  await page.locator('#foundation-operation').selectOption('add');
  await page.locator('#foundation-c').selectOption('2');
  const choice = page.locator('input[name="foundation-prediction"][value=">"]');
  await choice.focus();
  await page.keyboard.press('Space');
  await page.locator('#foundation-check').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#foundation-feedback')).toContainText('5 > 3');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('本轮有错误尝试时，逐题改对也不记录满分完成', async ({page}) => {
  test.setTimeout(40000);
  await page.goto(topic);
  await page.getByRole('button', {name: /互动练习/}).click();
  await page.locator('.quiz-opt').nth(1).click();
  await expect(page.locator('#quizFb')).toContainText('错误');
  await expect(page.locator('.quiz-opt').first()).toBeDisabled();
  await expect(page.locator('.quiz-opt').first()).toBeEnabled({timeout: 5000});
  const answers = [0, 1, 0, 1, 2, 1, 1, 1];
  for (let i = 0; i < answers.length; i++) {
    await page.locator('.quiz-opt').nth(answers[i]).click();
    await expect.poll(() => page.evaluate(() => quizIndex), {timeout: 5000}).toBe((i + 1) % answers.length);
  }
  expect(await page.evaluate(() => PageProgress.isDone('inequality'))).toBe(false);
});

test('八题首次全对后保存原有主题进度键', async ({page}) => {
  test.setTimeout(30000);
  await page.goto(topic);
  await page.getByRole('button', {name: /互动练习/}).click();
  const answers = [0, 1, 0, 1, 2, 1, 1, 1];
  for (let i = 0; i < answers.length; i++) {
    await page.locator('.quiz-opt').nth(answers[i]).click();
    await expect.poll(() => page.evaluate(() => quizIndex), {timeout: 5000}).toBe((i + 1) % answers.length);
  }
  expect(await page.evaluate(() => PageProgress.isDone('inequality'))).toBe(true);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('kv-math-progress-v2')));
  expect(stored['high:inequality']).toBeTruthy();
});

test('文件直开和发布子路径均加载模型', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网路径由上方共用用例验证');
  await page.goto(pathToFileURL(resolve(__dirname, '../../math/high/inequality.html')).href);
  await expect(page.locator('#foundation-current')).toContainText('3 > 1');
  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('math/high/inequality.html', release.base).href);
    expect(response.status()).toBe(200);
    await expect(page.locator('#foundation-current')).toContainText('3 > 1');
  } finally { await release.close(); }
});
