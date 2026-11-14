const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');

const base = process.env.KV_PUBLISHED_BASE_URL;
const realTopic = base
  ? new URL('math/middle/real-numbers.html', base.replace(/\/?$/, '/')).href
  : '/math/middle/real-numbers.html';
const radicalTopic = base
  ? new URL('math/middle/quadratic-radicals.html', base.replace(/\/?$/, '/')).href
  : '/math/middle/quadratic-radicals.html';

async function plot(page, text) {
  await page.locator('#numberInput').fill(text);
  await page.locator('#numberInput').press('Enter');
}

test('number line classifies equivalent roots, fractions and irrational transforms', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(realTopic);
  await page.getByRole('button', {name: /实数与数轴/}).click();

  for (const input of ['√4', '4/2', '√1.44', 'π/2', 'e-1', '√1.3', 'π*0']) await plot(page, input);
  await expect(page.locator('#naturalBox .classify-item')).toHaveText(['√4', '4/2', 'π*0']);
  await expect(page.locator('#integerBox .classify-item')).toHaveText(['√4', '4/2', 'π*0']);
  await expect(page.locator('#rationalBox .classify-item')).toHaveText(['√4', '4/2', '√1.44', 'π*0']);
  await expect(page.locator('#irrationalBox .classify-item')).toHaveText(['π/2', 'e-1', '√1.3']);
  await expect(page.locator('#numberLineCanvas')).toHaveAttribute('aria-label', /√4 约在 2.*π\/2 约在 1\.571/);
  await expect(page.locator('#numberInputFeedback')).toContainText('π*0 已标在数轴上，属于有理数');
  expect(errors).toEqual([]);
});

test('invalid expressions and out-of-range values leave the learning model unchanged', async ({page}) => {
  await page.goto(realTopic);
  await page.getByRole('button', {name: /实数与数轴/}).click();
  const before = await page.locator('.classify-item').count();
  await plot(page, 'π/0');
  await expect(page.locator('#numberInputFeedback')).toContainText('分母不能为零');
  await plot(page, 'π+globalThis.realNumberInjection');
  await expect(page.locator('#numberInputFeedback')).toContainText('格式不支持');
  await plot(page, '√36');
  await expect(page.locator('#numberInputFeedback')).toContainText('超出 −5 到 5');
  expect(await page.locator('.classify-item').count()).toBe(before);
  expect(await page.evaluate(() => window.realNumberInjection)).toBeUndefined();
});

test('square area uses current exact value and radical wording includes zero', async ({page}) => {
  await page.goto(realTopic);
  await page.locator('#areaSlider').fill('2');
  await expect(page.locator('#sqrt2Box')).toBeVisible();
  await page.locator('#areaSlider').fill('1.3');
  await expect(page.locator('#sqrt2Box')).toBeHidden();
  await expect(page.locator('#sideExplanation')).toContainText('√1.3 ≈');
  await expect(page.locator('#sideExplanation')).toContainText('无理数');
  await expect(page.locator('#sideRelation')).toHaveText('≈');
  await page.locator('#areaSlider').fill('2.1');
  await expect(page.locator('#sqrt2Box')).toBeHidden();
  await expect(page.locator('#sideExplanation')).toContainText('√2.1 ≈');
  await page.locator('#areaSlider').fill('4');
  await expect(page.locator('#sideExplanation')).toContainText('√4 = 2，是有理数');
  await expect(page.locator('#sideRelation')).toHaveText('=');
  await page.locator('#areaSlider').focus();
  await page.locator('#areaSlider').press('ArrowRight');
  await expect(page.locator('#sideExplanation')).toContainText('√4.1 ≈');

  await page.goto(radicalTopic);
  await expect(page.getByText('八年级 · 数与代数', {exact: false})).toBeVisible();
  await expect(page.getByText('面积为 a（a≥0）的正方形，边长为 √a。')).toBeVisible();
  await page.getByRole('button', {name: /性质探索/}).click();
  await expect(page.getByText('当 a=0 时，√0=0', {exact: false})).toBeVisible();
});

test('320px and direct file opening preserve the corrected model', async ({page}) => {
  test.skip(!!base, 'public site is checked through the published URL in the other cases');
  await page.setViewportSize({width: 320, height: 640});
  await page.goto(realTopic);
  await page.locator('#areaSlider').fill('1.3');
  await expect(page.locator('#sideExplanation')).toContainText('无理数');
  await page.getByRole('button', {name: /实数与数轴/}).click();
  await plot(page, '√4');
  await expect(page.locator('#rationalBox .classify-item')).toHaveText(['√4']);
  expect(await page.locator('#numberLineCanvas').evaluate(canvas => canvas.width)).toBeGreaterThan(200);
  await expect(page.locator('#plottedNumbers')).toContainText('√2（示例）');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

  await page.goto(pathToFileURL(resolve(__dirname, '../../math/middle/real-numbers.html')).href);
  await page.getByRole('button', {name: /实数与数轴/}).click();
  await plot(page, 'π/2');
  await expect(page.locator('#irrationalBox .classify-item')).toHaveText(['π/2']);
});
