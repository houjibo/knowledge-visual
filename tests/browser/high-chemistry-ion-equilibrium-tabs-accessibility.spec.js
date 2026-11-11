const {test, expect} = require('@playwright/test');

const sectionIds = ['sec1', 'sec2', 'sec3', 'sec4'];

 test('高中化学离子平衡四个主题具备语义、唯一停靠点和方向键导航', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/chemistry/high/ion-equilibrium.html');

  const tablist = page.getByRole('tablist', {name: '离子平衡主题'});
  const tabs = tablist.getByRole('tab');
  await expect(tabs).toHaveCount(4);
  await expect(tabs.nth(0)).toHaveAttribute('id', 'tab-sec1');
  await expect(tabs.nth(0)).toHaveAttribute('aria-controls', 'sec1');
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.nth(0)).toHaveAttribute('tabindex', '0');
  let panel = page.getByRole('tabpanel');
  await expect(panel).toHaveAttribute('aria-labelledby', 'tab-sec1');
  await expect(panel.getByRole('heading', {name: '弱电解质电离平衡动画'})).toBeVisible();
  for (let i = 1; i < 4; i++) {
    await expect(tabs.nth(i)).toHaveAttribute('aria-controls', sectionIds[i]);
    await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'false');
    await expect(tabs.nth(i)).toHaveAttribute('tabindex', '-1');
  }

  await page.keyboard.press('Tab');
  await expect(tabs.nth(0)).toBeFocused();
  await expect(tabs.nth(0)).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  panel = page.getByRole('tabpanel');
  await expect(panel).toHaveAttribute('aria-labelledby', 'tab-sec2');
  await expect(panel.getByRole('heading', {name: 'pH 标尺与溶液酸碱性'})).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(tabs.nth(0)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(tabs.nth(3)).toBeFocused();
  await expect(page.getByRole('tabpanel').getByRole('heading', {name: '模拟滴定实验'})).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(0)).toBeFocused();
  await page.keyboard.press('End');
  await expect(tabs.nth(3)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(tabs.nth(0)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('tabpanel')).toBeFocused();
  expect(errors).toEqual([]);
});

test('Enter、Space、鼠标或触屏可切换主题并保留已有控制', async ({page}, testInfo) => {
  await page.goto('/chemistry/high/ion-equilibrium.html');
  const tabs = page.getByRole('tablist', {name: '离子平衡主题'}).getByRole('tab');
  let panel = page.getByRole('tabpanel');

  await panel.locator('#kaSlider').focus();
  await page.keyboard.press('ArrowRight');
  await expect(panel.locator('#kaSlider')).toHaveValue('31');

  await tabs.nth(1).focus();
  await page.keyboard.press('Space');
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  panel = page.getByRole('tabpanel');
  await panel.locator('#phSlider').focus();
  await page.keyboard.press('Home');
  await expect(panel.locator('#phSlider')).toHaveValue('0');
  await expect(panel.locator('#acidBaseDisplay')).toHaveText('酸性');

  await tabs.nth(2).focus();
  await page.keyboard.press('Enter');
  await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
  panel = page.getByRole('tabpanel');
  await panel.locator('.hydro-salt[data-salt="nacl"]').click();
  await expect(panel.locator('#hydroPH')).toHaveText('= 7');
  await expect(panel.locator('#hydroNote')).toContainText('中性');

  if (testInfo.project.name === 'mobile') await tabs.nth(3).tap();
  else await tabs.nth(3).click();
  await expect(tabs.nth(3)).toHaveAttribute('aria-selected', 'true');
  panel = page.getByRole('tabpanel');
  await panel.locator('#titrateStart').click();
  await expect.poll(() => page.evaluate(() => _ionEqExplore.titrated)).toBe(true);
  await expect(panel.locator('#naohVol')).not.toHaveText('0 mL');
});

test('320px 窄屏四个主题页签均可见且各面板无横向溢出', async ({page}, testInfo) => {
  await page.setViewportSize({width: 320, height: 844});
  await page.goto('/chemistry/high/ion-equilibrium.html');
  const tabs = page.getByRole('tablist', {name: '离子平衡主题'}).getByRole('tab');
  await expect(tabs).toHaveCount(4);
  for (let i = 0; i < 4; i++) {
    await expect(tabs.nth(i)).toBeVisible();
    if (i > 0) {
      if (testInfo.project.name === 'mobile') await tabs.nth(i).tap();
      else await tabs.nth(i).click();
      await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'true');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  }
});
