const {test, expect} = require('@playwright/test');

test('高中化学实验四模式页签具备语义、唯一停靠点和方向键导航', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/chemistry/high/12-experiment.html');

  const tablist = page.getByRole('tablist', {name: '化学实验模式'});
  const tabs = tablist.getByRole('tab');
  const panel = page.getByRole('tabpanel');
  await expect(tabs).toHaveCount(4);
  await expect(tabs.nth(0)).toHaveAttribute('id', 'tab-prep');
  await expect(tabs.nth(0)).toHaveAttribute('aria-controls', 'panel');
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.nth(0)).toHaveAttribute('tabindex', '0');
  await expect(panel).toHaveAttribute('aria-labelledby', 'tab-prep');
  await expect(panel.getByRole('heading', {name: /氯气制备实验/})).toBeVisible();
  for (let i = 1; i < 4; i++) {
    await expect(tabs.nth(i)).toHaveAttribute('aria-controls', 'panel');
    await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'false');
    await expect(tabs.nth(i)).toHaveAttribute('tabindex', '-1');
  }

  await page.keyboard.press('Tab');
  await expect(tabs.nth(0)).toBeFocused();
  await expect(tabs.nth(0)).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(panel).toHaveAttribute('aria-labelledby', 'tab-property');
  await expect(panel.getByRole('heading', {name: /氯气性质验证/})).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(tabs.nth(0)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(tabs.nth(3)).toBeFocused();
  await expect(panel.getByRole('heading', {name: /实验设计工坊/})).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(0)).toBeFocused();
  await page.keyboard.press('End');
  await expect(tabs.nth(3)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(tabs.nth(0)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(panel).toBeFocused();
  expect(errors).toEqual([]);
});

test('Enter、Space、鼠标或触屏可激活模式且实验内容保持可用', async ({page}, testInfo) => {
  await page.goto('/chemistry/high/12-experiment.html');
  const tabs = page.getByRole('tablist', {name: '化学实验模式'}).getByRole('tab');
  const panel = page.getByRole('tabpanel');

  await panel.getByRole('button', {name: /下一步/}).click();
  await expect(page.locator('#stepList .step-item.active')).toContainText('加入药品');

  await tabs.nth(1).focus();
  await page.keyboard.press('Enter');
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(panel.getByRole('heading', {name: /氯气性质验证/})).toBeVisible();
  await panel.getByRole('button', {name: /下一个/}).click();
  await expect(page.locator('#expInfo')).toContainText('Cl₂与KI反应');

  await tabs.nth(2).focus();
  await page.keyboard.press('Space');
  await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
  await expect(panel.getByRole('heading', {name: /酸碱中和滴定/})).toBeVisible();
  await panel.getByRole('button', {name: '开始滴定'}).click();

  if (testInfo.project.name === 'mobile') await tabs.nth(3).tap();
  else await tabs.nth(3).click();
  await expect(tabs.nth(3)).toHaveAttribute('aria-selected', 'true');
  await expect(panel.getByRole('heading', {name: /实验设计工坊/})).toBeVisible();
  await panel.getByRole('button', {name: '制备O₂'}).click();
  await expect(page.locator('#designPanel')).toContainText('KClO₃');
});

test('320px 窄屏四个模式页签均可见且无横向溢出', async ({page}) => {
  await page.setViewportSize({width: 320, height: 844});
  await page.goto('/chemistry/high/12-experiment.html');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const tabs = page.getByRole('tablist', {name: '化学实验模式'}).getByRole('tab');
  await expect(tabs).toHaveCount(4);
  for (let i = 0; i < 4; i++) await expect(tabs.nth(i)).toBeVisible();
});
