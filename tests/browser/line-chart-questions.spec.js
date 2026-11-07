const {test, expect} = require('@playwright/test');

// Choose a theme and constant chart values, then select the desired question type.
for (const [mode, type, themeRandom, pointCount] of [
  ['read', 0.41, 0.13, 6],
  ['read', 0.61, 0, 7],
  ['read', 0.99, 0, 7],
  ['challenge', 0, 0.13, 6],
  ['challenge', 0.51, 0, 7],
]) {
  test(`${mode} 题型 ${type} 零值边界有有效选项`, async ({page}) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/math/topics/line-charts/index.html');
    await page.evaluate(({themeRandom, pointCount, type}) => {
      const values = [themeRandom, ...Array(pointCount).fill(0), type];
      Math.random = () => values.length ? values.shift() : 0;
    }, {themeRandom, pointCount, type});
    await page.locator(`.mode-tab[data-mode="${mode}"]`).click();
    if (mode === 'challenge') await page.locator('#ch-start-btn').click();
    const prefix = mode === 'read' ? 'read' : 'ch';
    const options = page.locator(`#${prefix}-${mode === 'read' ? 'options' : 'opts'} button`);
    await expect(options).toHaveCount(4);
    const values = (await options.allTextContents()).map(Number);
    expect(new Set(values).size).toBe(4);
    expect(values.every(value => Number.isInteger(value) && value >= 0)).toBe(true);
    await options.filter({hasText: /^0$/}).click();
    await expect(page.locator(`#${prefix}-feedback`)).toContainText(mode === 'read' ? '答对' : '正确');
    expect(errors).toEqual([]);
  });
}
