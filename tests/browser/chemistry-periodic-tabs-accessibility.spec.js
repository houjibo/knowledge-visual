const {test, expect} = require('@playwright/test');

test('高中化学元素周期律页签支持语义和键盘导航', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/chemistry/high/02-periodic.html');

  const tablist = page.getByRole('tablist', {name: '元素周期律主题'});
  const tabs = tablist.getByRole('tab');
  await expect(tabs).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    await expect(tabs.nth(i)).toHaveAttribute('aria-controls', `sec${i}`);
    await expect(page.locator(`#sec${i}`)).toHaveAttribute('aria-labelledby', `tab${i}`);
  }
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.nth(0)).toHaveAttribute('tabindex', '0');
  await expect(tabs.nth(1)).toHaveAttribute('tabindex', '-1');
  await expect(page.locator('#sec0')).toBeVisible();
  await expect(page.locator('#sec1')).toBeHidden();

  await page.keyboard.press('Tab');
  await expect(tabs.nth(0)).toBeFocused();
  await expect(tabs.nth(0)).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#sec1')).toBeVisible();
  await expect(page.locator('#sec0')).toBeHidden();
  await page.keyboard.press('ArrowLeft');
  await expect(tabs.nth(0)).toBeFocused();
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowLeft');
  await expect(tabs.nth(2)).toBeFocused();
  await expect(page.locator('#sec2')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(0)).toBeFocused();
  await page.keyboard.press('End');
  await expect(tabs.nth(2)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(tabs.nth(0)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#sec0')).toBeFocused();
  expect(errors).toEqual([]);
});

test('页签保留 Enter、Space 和指针激活', async ({page}, testInfo) => {
  await page.goto('/chemistry/high/02-periodic.html');
  const tabs = page.getByRole('tablist', {name: '元素周期律主题'}).getByRole('tab');

  await tabs.nth(1).focus();
  await page.keyboard.press('Enter');
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#sec1')).toBeVisible();
  await tabs.nth(0).focus();
  await page.keyboard.press('Space');
  await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#sec0')).toBeVisible();

  if (testInfo.project.name === 'mobile') await tabs.nth(2).tap();
  else await tabs.nth(2).click();
  await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#sec2')).toBeVisible();
});

test('320px 窄屏仍可访问三个主题页签', async ({page}) => {
  await page.setViewportSize({width: 320, height: 844});
  await page.goto('/chemistry/high/02-periodic.html');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const tabs = page.getByRole('tablist', {name: '元素周期律主题'}).getByRole('tab');
  await expect(tabs).toHaveCount(3);
  for (let i = 0; i < 3; i++) await expect(tabs.nth(i)).toBeVisible();
});
