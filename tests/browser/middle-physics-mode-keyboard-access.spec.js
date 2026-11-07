const {test, expect} = require('@playwright/test');

for (const slug of ['buoyancy', 'simple-machines', 'work-energy']) {
  test(`${slug} 所有模式支持键盘及指针并同步内容`, async ({page}, testInfo) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/physics/middle/${slug}.html`);
    const buttons = page.locator('.tabs button.tab');
    const count = await buttons.count();
    expect(count).toBe(slug === 'work-energy' ? 6 : 5);
    await expect(buttons.first()).toHaveAttribute('aria-pressed', 'true');
    let previous = await page.locator('#panel').innerText();
    for (let i = 1; i < count; i++) {
      const button = buttons.nth(i);
      await button.focus();
      await expect(button).toBeFocused();
      if (testInfo.project.name === 'desktop') await expect(button).toHaveCSS('outline-style', 'solid');
      await page.keyboard.press(i % 2 ? 'Enter' : 'Space');
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect(buttons.nth(i - 1)).toHaveAttribute('aria-pressed', 'false');
      expect(await page.evaluate(() => mode)).toBe(await button.getAttribute('data-mode'));
      const current = await page.locator('#panel').innerText();
      expect(current).not.toBe(previous);
      previous = current;
    }
    if (testInfo.project.name === 'mobile') await buttons.first().tap();
    else await buttons.first().click();
    await expect(buttons.first()).toHaveAttribute('aria-pressed', 'true');
    await expect(buttons.last()).toHaveAttribute('aria-pressed', 'false');
    expect(await page.evaluate(() => mode)).toBe(await buttons.first().getAttribute('data-mode'));
    expect(errors).toEqual([]);
  });
}
