const { test, expect } = require('@playwright/test');

const url = '/math/topics/shapes-and-position/index.html';
const shapeNames = ['圆形', '三角形', '正方形', '长方形', '五角星', '心形'];

for (const seed of [0, 0.5, 0.999999]) {
  test(`固定随机值 ${seed} 下分类可加载、辨认并只计分一次`, async ({ page }) => {
    await page.addInitScript(value => { Math.random = () => value; }, seed);
    await page.goto(url, { timeout: 10000 });
    await page.locator('[data-mode="classify"]').click();

    const prompt = await page.locator('#classify-prompt').innerText();
    const target = prompt.replace(/^哪个是\s*/, '').replace(/[？?]$/, '').trim();
    const options = page.locator('#classify-options button');
    await expect(options).toHaveCount(4);
    const labels = await options.evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label')));
    expect(new Set(labels).size).toBe(4);
    expect(labels).toContain(target);
    expect(labels.every(name => shapeNames.includes(name))).toBe(true);
    await expect(page.getByRole('group', { name: prompt })).toBeVisible();

    const correct = page.getByRole('button', { name: target, exact: true });
    await page.evaluate(() => {
      const container = document.getElementById('classify-options');
      window.__classifyOptionRenders = 0;
      new MutationObserver(() => { window.__classifyOptionRenders += 1; })
        .observe(container, { childList: true });
    });

    if (seed === 0) {
      await correct.click();
    } else if (seed === 0.5) {
      const wrongName = labels.find(name => name !== target);
      const wrong = page.getByRole('button', { name: wrongName, exact: true });
      await wrong.focus();
      await page.keyboard.press('Space');
      await expect(wrong).toHaveClass(/wrong/);
      await expect(page.locator('#streak')).toHaveText('0');
      await correct.focus();
      await page.keyboard.press('Enter');
    } else {
      await correct.focus();
      await page.keyboard.press('Space');
    }

    await expect(correct).toHaveClass(/correct/);
    await expect(page.locator('#streak')).toHaveText('1');
    expect(await options.evaluateAll(nodes => nodes.every(node => node.disabled))).toBe(true);
    await correct.dispatchEvent('click');
    await expect(page.locator('#streak')).toHaveText('1');

    await expect.poll(() => page.evaluate(() => window.__classifyOptionRenders)).toBeGreaterThan(0);
    await expect(options).toHaveCount(4);
    const nextLabels = await options.evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-label')));
    expect(new Set(nextLabels).size).toBe(4);
    expect(nextLabels).toContain(target);
  });
}

test('320px 窄屏的图形按钮完整可见且不横向溢出', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.addInitScript(() => { Math.random = () => 0.5; });
  await page.goto(url);
  await page.locator('[data-mode="classify"]').click();
  await page.locator('#classify-options button').evaluateAll(buttons => {
    buttons.forEach(button => button.getAnimations().forEach(animation => animation.finish()));
  });

  const geometry = await page.locator('#classify-options button').evaluateAll(buttons => buttons.map(button => {
    const box = button.getBoundingClientRect();
    const svgBox = button.querySelector('svg').getBoundingClientRect();
    return {
      left: box.left, right: box.right, width: box.width, height: box.height,
      svgLeft: svgBox.left, svgRight: svgBox.right,
      svgTop: svgBox.top, svgBottom: svgBox.bottom, top: box.top, bottom: box.bottom
    };
  }));
  expect(geometry).toHaveLength(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  for (const item of geometry) {
    expect(item.left).toBeGreaterThanOrEqual(0);
    expect(item.right).toBeLessThanOrEqual(320);
    expect(item.width).toBeGreaterThanOrEqual(56);
    expect(item.height).toBeGreaterThanOrEqual(56);
    expect(item.svgLeft).toBeGreaterThanOrEqual(item.left);
    expect(item.svgRight).toBeLessThanOrEqual(item.right);
    expect(item.svgTop).toBeGreaterThanOrEqual(item.top);
    expect(item.svgBottom).toBeLessThanOrEqual(item.bottom);
  }
});
