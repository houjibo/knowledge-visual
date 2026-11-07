const {test, expect} = require('@playwright/test');

for (const [slug, count] of [['04-atom-element', 5], ['05-formula', 4], ['06-equation', 3]]) {
  test(`${slug} 每个模式支持键盘与指针操作`, async ({page}, testInfo) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/chemistry/middle/${slug}.html`);
    const buttons = page.locator('.tabs button.tab');
    await expect(buttons).toHaveCount(count);
    await expect(buttons.first()).toHaveAttribute('aria-pressed', 'true');
    let previous = slug === '04-atom-element' ? await page.locator('#panel').innerText() : null;
    for (let i = 1; i < count; i++) {
      const button = buttons.nth(i);
      await button.focus();
      await expect(button).toBeFocused();
      if (testInfo.project.name === 'desktop') await expect(button).toHaveCSS('outline-style', 'solid');
      await page.keyboard.press(i % 2 ? 'Enter' : 'Space');
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect(buttons.nth(i - 1)).toHaveAttribute('aria-pressed', 'false');
      if (slug === '04-atom-element') {
        expect(await page.evaluate(() => mode)).toBe(await button.getAttribute('data-mode'));
        const current = await page.locator('#panel').innerText();
        expect(current).not.toBe(previous);
        previous = current;
      } else {
        await expect(page.locator('.section').nth(i)).toBeVisible();
        await expect(page.locator('.section').nth(i - 1)).toBeHidden();
      }
    }
    if (testInfo.project.name === 'mobile') await buttons.first().tap();
    else await buttons.first().click();
    await expect(buttons.first()).toHaveAttribute('aria-pressed', 'true');
    await expect(buttons.last()).toHaveAttribute('aria-pressed', 'false');
    if (slug !== '04-atom-element') await expect(page.locator('.section').first()).toBeVisible();
    else expect(await page.evaluate(() => mode)).toBe(await buttons.first().getAttribute('data-mode'));
    expect(errors).toEqual([]);
  });
}
