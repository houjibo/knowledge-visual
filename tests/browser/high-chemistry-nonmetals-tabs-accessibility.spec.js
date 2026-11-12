const {test, expect} = require('@playwright/test');

test('高中化学非金属四个主题具有语义、唯一停靠点和方向键导航', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/chemistry/high/nonmetals.html');

  const tablist = page.getByRole('tablist', {name: '非金属学习主题'});
  const tabs = tablist.getByRole('tab');
  const panels = page.locator('[role="tabpanel"]');
  await expect(tabs).toHaveCount(4);
  await expect(panels).toHaveCount(4);
  await expect(tabs.nth(0)).toHaveAttribute('id', 'tab-elements');
  await expect(tabs.nth(0)).toHaveAttribute('aria-controls', 'stage-elements');
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.nth(0)).toHaveAttribute('tabindex', '0');
  await expect(page.locator('#stage-elements')).toBeVisible();
  await expect(page.locator('#stage-elements')).toHaveAttribute('aria-labelledby', 'tab-elements');
  for (let i = 1; i < 4; i++) {
    await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'false');
    await expect(tabs.nth(i)).toHaveAttribute('tabindex', '-1');
    await expect(page.locator(`#stage-${['elements', 'chlorine', 'transforms', 'quiz'][i]}`)).toBeHidden();
  }

  await page.keyboard.press('Tab');
  await expect(tabs.nth(0)).toBeFocused();
  await expect(tabs.nth(0)).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#stage-chlorine')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(2)).toBeFocused();
  await expect(page.locator('#stage-transforms')).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(tabs.nth(1)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(tabs.nth(0)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(tabs.nth(3)).toBeFocused();
  await page.keyboard.press('End');
  await expect(tabs.nth(3)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(tabs.nth(0)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#stage-elements')).toBeFocused();
  expect(errors).toEqual([]);
});

test('Enter、Space、鼠标或触屏可切换主题', async ({page}, testInfo) => {
  await page.goto('/chemistry/high/nonmetals.html');
  const tabs = page.getByRole('tablist', {name: '非金属学习主题'}).getByRole('tab');

  await tabs.nth(1).focus();
  await page.keyboard.press('Enter');
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#stage-chlorine')).toBeVisible();

  await tabs.nth(2).focus();
  await page.keyboard.press('Space');
  await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#stage-transforms')).toBeVisible();

  if (testInfo.project.name === 'mobile') await tabs.nth(3).tap();
  else await tabs.nth(3).click();
  await expect(tabs.nth(3)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#stage-quiz')).toBeVisible();
});

test('氮硫单选组、关系图、转化列表和摘要保持同一系列', async ({page}, testInfo) => {
  await page.goto('/chemistry/high/nonmetals.html');
  await page.getByRole('tab', {name: /转化关系/}).click();

  const group = page.getByRole('radiogroup', {name: '转化关系系列'});
  const options = group.getByRole('radio');
  await expect(options).toHaveCount(2);
  await expect(options.nth(0)).toHaveAttribute('aria-checked', 'true');
  await expect(options.nth(0)).toHaveAttribute('tabindex', '0');
  await expect(page.locator('#transform-summary-title')).toHaveText('氮及其化合物转化');
  await expect(page.locator('#transform-summary')).toHaveText('N₂ → NH₃\nNH₃ → NO\nNO → NO₂\nNO₂ → HNO₃\nHNO₃ → NO₂\nN₂ → NO');
  await expect(page.locator('#canvas-transforms')).toHaveAttribute('aria-label', /氮及其化合物转化关系图.*N₂.*NH₃/);
  await expect(page.locator('#transform-list .transform-item')).toHaveCount(6);

  await options.nth(0).focus();
  await page.keyboard.press('End');
  await expect(options.nth(1)).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Home');
  await expect(options.nth(0)).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(options.nth(1)).toBeFocused();
  await expect(options.nth(1)).toHaveAttribute('aria-checked', 'true');
  await expect(options.nth(1)).toHaveAttribute('tabindex', '0');
  await expect(page.locator('#transform-summary-title')).toHaveText('硫及其化合物转化');
  await expect(page.locator('#reaction-detail')).toHaveText('尚未选择转化。聚焦一项后按 Enter 或空格查看详情。');
  await expect(page.locator('#transform-summary')).toHaveText('S → SO₂\nSO₂ → SO₃\nSO₃ → H₂SO₄\nH₂SO₄ → SO₂\nSO₂ → H₂SO₃\nS → H₂S');
  await expect(page.locator('#transform-summary')).not.toContainText('N₂');
  await expect(page.locator('#canvas-transforms')).toHaveAttribute('aria-label', /硫及其化合物转化关系图.*S.*SO₂.*SO₃/);
  await expect(page.locator('#canvas-transforms')).not.toHaveAttribute('aria-label', /N₂|NH₃/);
  await expect(page.locator('#transform-list .transform-item')).toHaveCount(6);
  await expect(page.locator('#transform-list .transform-item').first()).toContainText('S');
  await expect(page.locator('#transform-list .transform-item').first()).toContainText('SO₂');

  await page.locator('#transform-list .transform-item').first().click();
  await expect(page.locator('#reaction-detail')).toContainText('S + O₂ → SO₂');
  await options.nth(1).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(options.nth(0)).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('#transform-summary-title')).toHaveText('氮及其化合物转化');
  await expect(page.locator('#transform-summary')).toHaveText('N₂ → NH₃\nNH₃ → NO\nNO → NO₂\nNO₂ → HNO₃\nHNO₃ → NO₂\nN₂ → NO');
  await expect(page.locator('#reaction-detail')).toHaveText('尚未选择转化。聚焦一项后按 Enter 或空格查看详情。');

  if (testInfo.project.name === 'mobile') await options.nth(1).tap();
  else await options.nth(1).click();
  await expect(options.nth(1)).toHaveAttribute('aria-checked', 'true');
  await options.nth(0).focus();
  await page.keyboard.press('Enter');
  await expect(options.nth(0)).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('#transform-summary-title')).toHaveText('氮及其化合物转化');

  if (testInfo.project.name === 'mobile') await options.nth(1).tap();
  else await options.nth(1).click();
  await options.nth(1).focus();
  await page.keyboard.press('Space');
  await expect(options.nth(1)).toHaveAttribute('aria-checked', 'true');
});

test('320px 下四个主题与两个系列选项均可见且页面无横向溢出', async ({page}, testInfo) => {
  await page.setViewportSize({width: 320, height: 844});
  await page.goto('/chemistry/high/nonmetals.html');
  const tabs = page.getByRole('tablist', {name: '非金属学习主题'}).getByRole('tab');

  for (let i = 0; i < 4; i++) {
    await expect(tabs.nth(i)).toBeVisible();
    if (i > 0) {
      if (testInfo.project.name === 'mobile') await tabs.nth(i).tap();
      else await tabs.nth(i).click();
      await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'true');
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  }

  if (testInfo.project.name === 'mobile') await tabs.nth(2).tap();
  else await tabs.nth(2).click();
  const options = page.getByRole('radiogroup', {name: '转化关系系列'}).getByRole('radio');
  await expect(options).toHaveCount(2);
  for (let i = 0; i < 2; i++) {
    await expect(options.nth(i)).toBeVisible();
    if (i > 0) {
      if (testInfo.project.name === 'mobile') await options.nth(i).tap();
      else await options.nth(i).click();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  }
});
