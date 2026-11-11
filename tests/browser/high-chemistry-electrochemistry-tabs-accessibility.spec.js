const {test, expect} = require('@playwright/test');

test('高中化学电化学四个主题具备语义、唯一停靠点和方向键导航', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/chemistry/high/electrochemistry.html');

  const tablist = page.getByRole('tablist', {name: '电化学主题'});
  const tabs = tablist.getByRole('tab');
  await expect(tabs).toHaveCount(4);
  await expect(tabs.nth(0)).toHaveAttribute('id', 'tab-galvanic');
  await expect(tabs.nth(0)).toHaveAttribute('aria-controls', 'sec-galvanic');
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.nth(0)).toHaveAttribute('tabindex', '0');
  const panel = page.getByRole('tabpanel');
  await expect(panel).toHaveAttribute('aria-labelledby', 'tab-galvanic');
  await expect(panel.getByRole('heading', {name: '原电池工作原理'})).toBeVisible();
  for (let i = 1; i < 4; i++) {
    await expect(tabs.nth(i)).toHaveAttribute('aria-controls', `sec-${['galvanic', 'electrolysis', 'corrosion', 'quiz'][i]}`);
    await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'false');
    await expect(tabs.nth(i)).toHaveAttribute('tabindex', '-1');
  }

  await page.keyboard.press('Tab');
  await expect(tabs.nth(0)).toBeFocused();
  await expect(tabs.nth(0)).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'tab-electrolysis');
  await expect(page.getByRole('tabpanel').getByRole('heading', {name: '电解池工作原理'})).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(tabs.nth(0)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(tabs.nth(3)).toBeFocused();
  await expect(page.getByRole('tabpanel').getByRole('heading', {name: '电化学互动练习'})).toBeVisible();
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

test('原生键盘、指针及触屏切换保留各主题实验内容', async ({page}, testInfo) => {
  await page.goto('/chemistry/high/electrochemistry.html');
  const tabs = page.getByRole('tablist', {name: '电化学主题'}).getByRole('tab');
  const panel = page.getByRole('tabpanel');

  await panel.locator('#galvType').selectOption('zn-ag');
  await expect(panel.locator('#galvType')).toHaveValue('zn-ag');
  await panel.locator('#galvPlay').click();
  await expect.poll(() => page.evaluate(() => galvanic.running)).toBe(true);
  await panel.locator('#galvReset').click();

  await tabs.nth(1).focus();
  await page.keyboard.press('Enter');
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(panel.getByRole('heading', {name: '电解池工作原理'})).toBeVisible();
  await panel.locator('#elecType').selectOption('nacl');
  await expect(panel.locator('#elecType')).toHaveValue('nacl');

  await tabs.nth(2).focus();
  await page.keyboard.press('Space');
  await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
  await expect(panel.getByRole('heading', {name: '金属腐蚀与防护'})).toBeVisible();
  await panel.locator('#corrMethod').selectOption('sacrifice');
  await expect(panel.locator('#corrMethod')).toHaveValue('sacrifice');

  if (testInfo.project.name === 'mobile') await tabs.nth(3).tap();
  else await tabs.nth(3).click();
  await expect(tabs.nth(3)).toHaveAttribute('aria-selected', 'true');
  await expect(panel.getByRole('heading', {name: '电化学互动练习'})).toBeVisible();
  await panel.locator('.quiz-opt').nth(1).click();
  await expect(page.locator('#quizScore')).toContainText('得分：1 / 1');
});

test('320px 窄屏四个主题页签均可见且各面板无横向溢出', async ({page}, testInfo) => {
  await page.setViewportSize({width: 320, height: 844});
  await page.goto('/chemistry/high/electrochemistry.html');
  const tabs = page.getByRole('tablist', {name: '电化学主题'}).getByRole('tab');
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
