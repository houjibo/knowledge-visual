const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/middle/linear-equation.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/middle/linear-equation.html';
async function check(page, index, equation, domain) {
  await page.locator(`#validity-eq-${index}`).selectOption(equation ? 'yes' : 'no');
  await page.locator(`#validity-domain-${index}`).selectOption(domain ? 'yes' : 'no');
  await page.locator(`#validity-check-${index}`).click();
}
async function open(page) { await page.goto(topic); await page.getByRole('button', {name:'🔎 检验实际解'}).click(); }

test('整数解必须同时满足方程和实际件数条件', async ({page}) => {
  await open(page);
  await expect(page.locator('#validity-submit')).toBeDisabled();
  await expect(page.locator('#validity-bars-0')).toBeHidden();
  await check(page, 0, true, true);
  await expect(page.locator('#validity-feedback-0')).toContainText('至少一项不对');
  await check(page, 0, false, true);
  await expect(page.locator('#validity-feedback-0')).toContainText('11，不等于 14');
  await expect(page.locator('#validity-bars-0')).toBeVisible();
  await check(page, 1, true, true);
  await check(page, 2, false, true);
  await expect(page.locator('#validity-submit')).toBeEnabled();
  await page.locator('#validity-choice').selectOption('6');
  await page.locator('#validity-submit').click();
  await expect(page.locator('#validity-final-feedback')).toContainText('必须同时满足');
  await page.locator('#validity-choice').selectOption('8');
  await page.locator('#validity-submit').click();
  await expect(page.locator('#validity-final-feedback')).toContainText('4 件同时满足');
  const data = await page.evaluate(() => localStorage.getItem('kv-math-progress-v2'));
  expect(data === null || !JSON.parse(data)['middle:linear-equation']).toBeTruthy();
  await page.locator('#validity-domain-1').selectOption('no');
  await expect(page.locator('#validity-bars-1')).toBeHidden();
  await expect(page.locator('#validity-submit')).toBeDisabled();
});

test('小数和负数可以是代数解但没有实际方案，切题重置', async ({page}) => {
  await open(page);
  await page.locator('#validity-case').selectOption('fraction');
  await check(page, 0, false, true);
  await check(page, 1, true, false);
  await expect(page.locator('#validity-feedback-1')).toContainText('11，等于 11；4.5 不是非负整数');
  await expect(page.locator('#validity-left-1')).toHaveAttribute('value', '11');
  await expect(page.locator('#validity-right-1')).toHaveAttribute('value', '11');
  await check(page, 2, false, true);
  await page.locator('#validity-choice').selectOption('none');
  await page.locator('#validity-submit').click();
  await expect(page.locator('#validity-final-feedback')).toContainText('代数解是 4.5');
  await expect(page.locator('#validity-final-feedback')).toContainText('不是方程无解');
  await page.locator('#validity-case').selectOption('negative');
  await expect(page.locator('#validity-submit')).toBeDisabled();
  await expect(page.locator('#validity-eq-0')).toHaveValue('');
  await check(page, 0, true, false);
  await check(page, 1, false, true);
  await check(page, 2, false, true);
  await page.locator('#validity-choice').selectOption('none');
  await page.locator('#validity-submit').click();
  await expect(page.locator('#validity-final-feedback')).toContainText('代数解是 −1');
});

test('320px 文件直开和键盘操作', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '仅本地文件直开');
  await page.setViewportSize({width:320,height:740});
  await page.goto(pathToFileURL(resolve(__dirname, '../../math/middle/linear-equation.html')).href);
  const tab = page.getByRole('button', {name:'🔎 检验实际解'});
  await tab.focus(); await page.keyboard.press('Enter');
  await expect(tab).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#validity-story')).toContainText('14 元');
  await check(page, 0, false, true);
  await expect(page.locator('#validity-feedback-0')).toContainText('正确');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
