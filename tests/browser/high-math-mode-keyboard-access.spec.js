const {test, expect} = require('@playwright/test');

for (const [slug, count] of [['complex-numbers', 3], ['conic-sections', 5], ['derivative', 4], ['function', 4], ['inequality', 4], ['sets', 4]]) {
  test(`${slug} 的模式入口支持键盘和指针`, async ({page}, testInfo) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/math/high/${slug}.html`);
    const buttons = page.locator('.tabs button.tab');
    await expect(buttons).toHaveCount(count);
    await buttons.first().focus();
    await page.keyboard.press('Tab');
    await expect(buttons.nth(1)).toBeFocused();
    const titles = {
      'conic-sections': ['椭圆', '双曲线', '三种圆锥曲线对比', '抛物线', '互动练习'],
      derivative: ['导数的几何意义', '求导法则', '函数分析', '互动练习'],
      inequality: ['对称性', '一元二次不等式', '均值不等式', '互动练习'],
    };
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      await button.focus();
      await expect(button).toBeFocused();
      if (testInfo.project.name === 'desktop') await expect(button).toHaveCSS('outline-style', 'solid');
      await page.keyboard.press(i % 2 ? 'Space' : 'Enter');
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('.tabs button.tab[aria-pressed="true"]')).toHaveCount(1);
      const target = await button.getAttribute('data-panel') || await button.getAttribute('data-mode');
      if (['complex-numbers', 'function', 'sets'].includes(slug)) await expect(page.locator(`#panel-${target}`)).toBeVisible();
      else await expect(page.locator('#panelTitle')).toContainText(titles[slug][i]);
    }
    if (testInfo.project.name === 'mobile') await buttons.first().tap();
    else await buttons.first().click();
    await expect(buttons.first()).toHaveAttribute('aria-pressed', 'true');
    expect(errors).toEqual([]);
  });
}
