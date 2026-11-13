const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/middle/rational-numbers.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/middle/rational-numbers.html';

test('fraction power asks for factor count before result and shows exact expansion', async ({page}) => {
  await page.goto(topic);
  await page.getByRole('button', {name: /乘方探索/}).click();
  await page.locator('#powerCase').selectOption('fraction');
  await expect(page.locator('#powerExpression')).toHaveText('(1/2)³');
  await page.locator('#powerCountOptions').getByRole('button', {name: '2 次'}).click();
  await expect(page.locator('#powerCountFeedback')).toContainText('再看指数');
  await expect(page.locator('#powerResultStep')).toBeHidden();
  await page.locator('#powerCountOptions').getByRole('button', {name: '3 次'}).click();
  await expect(page.locator('#powerResultStep')).toBeVisible();
  await page.locator('#powerResultOptions').getByRole('button', {name: '1/6'}).click();
  await expect(page.locator('#powerResultFeedback')).toContainText('重试');
  await expect(page.locator('#powerTrace')).toBeHidden();
  await page.locator('#powerResultOptions').getByRole('button', {name: '1/8'}).click();
  await expect(page.locator('#powerFactors .power-factor')).toHaveText(['1/2', '1/2', '1/2']);
  await expect(page.locator('#powerConclusion')).toContainText('(1/2)³ = 1/8');
  await expect(page.locator('#powerResultOptions button:disabled')).toHaveCount(3);
});

test('negative base and outside minus expand differently; switching clears old work', async ({page}) => {
  await page.goto(topic);
  await page.getByRole('button', {name: /乘方探索/}).click();
  await page.locator('#powerCase').selectOption('negative-even');
  await page.locator('#powerCountOptions').getByRole('button', {name: '2 次'}).click();
  await page.locator('#powerResultOptions').getByRole('button', {name: '4', exact: true}).click();
  await expect(page.locator('#powerFactors .power-factor')).toHaveText(['−2', '−2']);
  await expect(page.locator('#powerConclusion')).toContainText('(−2)² = 4');

  await page.locator('#powerCase').selectOption('outside-minus');
  await expect(page.locator('#powerTrace')).toBeHidden();
  await expect(page.locator('#powerResultStep')).toBeHidden();
  await expect(page.locator('#powerCountOptions button:enabled')).toHaveCount(3);
  await page.locator('#powerReveal').click();
  await expect(page.locator('#powerCountFeedback')).toContainText('不计为独立预测');
  await expect(page.locator('#powerFactors .power-factor')).toHaveText(['2', '2']);
  await expect(page.locator('#powerFactors')).toContainText('−(');
  await expect(page.locator('#powerConclusion')).toContainText('−2² = −4');
  await expect(page.locator('#powerCountOptions button:disabled')).toHaveCount(3);

  await page.locator('#powerCase').selectOption('zero');
  await page.locator('#powerReveal').click();
  await expect(page.locator('#powerFactors .power-factor')).toHaveText(['0', '0', '0']);
  await expect(page.locator('#powerConclusion')).toContainText('0³ = 0');
});

test('320px keyboard operation and direct static file keep power feedback usable', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(topic);
  await page.getByRole('button', {name: /乘方探索/}).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#tab4')).toBeVisible();
  await page.locator('#powerCase').selectOption('zero');
  await page.locator('#powerCase').focus();
  expect(await page.evaluate(() => document.activeElement.id)).toBe('powerCase');
  await expect(page.locator('#powerExpression')).toHaveText('0³');
  await page.locator('#powerCountOptions').getByRole('button', {name: '3 次'}).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#powerResultStep')).toBeVisible();
  await page.locator('#powerResultOptions').getByRole('button', {name: '0', exact: true}).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#powerConclusion')).toContainText('0³ = 0');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

  if (!process.env.KV_PUBLISHED_BASE_URL) {
    const localUrl = pathToFileURL(resolve(__dirname, '../../math/middle/rational-numbers.html')).href;
    await page.goto(localUrl);
    await page.getByRole('button', {name: /乘方探索/}).click();
    await page.locator('#powerCase').selectOption('negative-fraction');
    await page.locator('#powerReveal').click();
    await expect(page.locator('#powerConclusion')).toContainText('(−1/2)² = 1/4');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  }
});
