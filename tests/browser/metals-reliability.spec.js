const {test, expect} = require('@playwright/test');

const url = '/chemistry/high/07-metals.html';

test('三个模式 tab 可切换且无脚本错误', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await expect(page).toHaveTitle(/金属/);
  await expect(page.locator('#activity')).toBeVisible();

  for (const mode of ['reaction', 'experiment']) {
    await page.locator(`.mode-tab[data-mode="${mode}"]`).click();
    await expect(page.locator(`.mode-tab[data-mode="${mode}"]`)).toHaveClass(/active/);
    await expect(page.locator(`#${mode}`)).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('反应现象模式可切换不同反应并更新方程式', async ({page}) => {
  await page.goto(url);
  await page.locator('.mode-tab[data-mode="reaction"]').click();
  const buttons = page.locator('.reaction-btn');
  expect(await buttons.count()).toBeGreaterThan(1);
  const first = await page.locator('#reactionEq').textContent();
  await buttons.nth(1).click();
  await expect(buttons.nth(1)).toHaveClass(/active/);
  await expect(page.locator('#reactionEq')).not.toHaveText(first);
});

test('实验探究未选试剂时提示先选择', async ({page}) => {
  await page.goto(url);
  await page.locator('.mode-tab[data-mode="experiment"]').click();
  await page.locator('#mixBtn').click();
  await expect(page.locator('#experimentLog')).toContainText('请先选择');
});

test('实验混合对试剂顺序不敏感并产生正确反应（回归）', async ({page}) => {
  await page.goto(url);
  await page.locator('.mode-tab[data-mode="experiment"]').click();
  // NaOH + CuSO4 has a known reaction regardless of selection order.
  await page.locator('.reagent[data-id="naoh"]').click();
  await page.locator('.reagent[data-id="cuso4"]').click();
  await page.locator('#mixBtn').click();
  await expect(page.locator('#experimentLog')).toContainText('蓝色');

  await page.locator('#resetBtn').click();
  expect(await page.locator('.reagent.selected').count()).toBe(0);
  // Reverse order must also match.
  await page.locator('.reagent[data-id="cuso4"]').click();
  await page.locator('.reagent[data-id="naoh"]').click();
  await page.locator('#mixBtn').click();
  await expect(page.locator('#experimentLog')).toContainText('蓝色');
});

test('活动性排序检查给出反馈', async ({page}) => {
  await page.goto(url);
  await page.locator('#checkOrder').click();
  await expect(page.locator('#orderResult')).toContainText(/正确|位置不对/);
});

test('320px 窄屏无横向溢出且 tab 可点', async ({page}) => {
  await page.setViewportSize({width: 320, height: 800});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(url);
  await page.locator('.mode-tab[data-mode="reaction"]').click();
  await expect(page.locator('.mode-tab[data-mode="reaction"]')).toHaveClass(/active/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
});
