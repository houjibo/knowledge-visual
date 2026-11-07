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

for (const [mode, type, points, selected, feedback] of [
  ['read', 0, [0, .25, .25, 0, 0, 0, 0], '周三', '答对'],
  ['read', .21, [.25, 0, 0, .25, .25, .25, .25], '周三', '答对'],
  ['challenge', .18, [0, .25, .25, 0, 0, 0, 0], '周三', '正确'],
  ['challenge', .35, [.25, 0, 0, .25, .25, .25, .25], '周三', '正确'],
  ['trend', .41, [0, 0, 0, 0, 0, 0, 0], '没有上升的区间', '答对'],
  ['trend', .61, [0, 0, 0, 0, 0, 0, 0], '没有下降的区间', '答对'],
  ['trend', .41, [0, .25, 0, .25, 0, 0, 0], '周三→周四', '答对'],
  ['trend', .61, [.25, 0, .25, 0, .25, .25, .25], '周三→周四', '答对'],
  ['trend', .81, [0, 0, .25, .25, 0, .25, 0], '周三→周四', '答对'],
]) {
  test(`${mode} 题型 ${type} 并列或无趋势：${selected}`, async ({page}) => {
    await page.goto('/math/topics/line-charts/index.html');
    await page.evaluate(({points, type}) => {
      const values = [0, ...points, type];
      Math.random = () => values.length ? values.shift() : 0;
    }, {points, type});
    await page.locator(`.mode-tab[data-mode="${mode}"]`).click();
    if (mode === 'challenge') await page.locator('#ch-start-btn').click();
    const prefix = mode === 'challenge' ? 'ch' : mode;
    const options = page.locator(`#${prefix}-${mode === 'read' ? 'options' : 'opts'} button`);
    await expect(options).toHaveCount(4);
    await options.getByText(selected, {exact: true}).click();
    await expect(page.locator(`#${prefix}-feedback`)).toContainText(feedback);
  });
}

test('读图并列最大值答错时标出全部显示的正确选项', async ({page}) => {
  await page.goto('/math/topics/line-charts/index.html');
  await page.evaluate(() => {
    const values = [0, 0, .25, .25, 0, 0, 0, 0, 0];
    Math.random = () => values.length ? values.shift() : 0;
  });
  await page.locator('.mode-tab[data-mode="read"]').click();
  await page.locator('#read-options button').getByText('周一', {exact: true}).click();
  await expect(page.locator('#read-options button.correct')).toHaveCount(2);
  await expect(page.locator('#read-feedback')).toContainText('周二');
  await expect(page.locator('#read-feedback')).toContainText('周三');
});
