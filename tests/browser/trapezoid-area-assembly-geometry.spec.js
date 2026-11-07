const { test, expect } = require('@playwright/test');
const points = value => value.trim().split(/\s+/).map(pair => pair.split(',').map(Number));
const near = (a, b) => { expect(a[0]).toBeCloseTo(b[0], 5); expect(a[1]).toBeCloseTo(b[1], 5); };
const area = p => Math.abs(p.reduce((sum, v, i) => sum + v[0] * p[(i + 1) % p.length][1] - v[1] * p[(i + 1) % p.length][0], 0)) / 2;

test('两个梯形旋转拼合，参数变化时面积和边界一致', async ({ page }) => {
  await page.goto('/math/topics/trapezoid-area/index.html');
  await page.locator('[data-mode="explore"]').click();
  await page.locator('#btnShowDouble').click();
  await expect(page.locator('#btnShowDouble')).toHaveAttribute('aria-pressed', 'true');
  for (const top of [2, 4, 8]) for (const bottom of [4, 9, 12]) for (const height of [2, 8]) {
    await page.getByLabel('上底长度').fill(String(top));
    await page.getByLabel('下底长度').fill(String(Math.max(bottom, top + 1)));
    await page.getByLabel('高度', {exact: true}).fill(String(height));
    const b = Math.max(bottom, top + 1);
    const p = points(await page.locator('.original-trapezoid').getAttribute('points'));
    const q = points(await page.locator('.rotated-trapezoid').getAttribute('points'));
    near(p[1], q[0]); near(p[2], q[3]);
    near([q[1][0] - q[0][0], 0], [p[2][0] - p[3][0], 0]);
    near([q[2][0] - q[3][0], 0], [p[1][0] - p[0][0], 0]);
    expect(area(p)).toBeCloseTo(area(q), 5);
    for (const [x,y] of [...p,...q]) { expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThanOrEqual(300); expect(y).toBeGreaterThanOrEqual(0); expect(y).toBeLessThanOrEqual(220); }
    await expect(page.locator('#resArea')).toHaveText(`${(top + b) * height / 2} cm²`);
  }
  await page.getByLabel('下底长度').fill('4');
  await page.getByLabel('上底长度').fill('8');
  await expect(page.getByLabel('下底长度')).toHaveValue('9');
  await expect(page.locator('#resBottom')).toHaveText('9 cm');
});

test('故事拼图共享边且两块面积相同', async ({page}) => {
  await page.goto('/math/topics/trapezoid-area/index.html');
  const polygons = page.locator('.step-card').nth(1).locator('polygon');
  const p = points(await polygons.nth(0).getAttribute('points'));
  const q = points(await polygons.nth(1).getAttribute('points'));
  near(p[1], q[0]); near(p[2], q[3]); expect(area(p)).toBe(area(q));
  const final = page.locator('.step-card').nth(2);
  const outer = points(await final.locator('polygon').getAttribute('points'));
  expect(area(outer)).toBe(area(p) + area(q));
  near(outer[0], p[0]); near(outer[1], q[1]); near(outer[2], q[2]); near(outer[3], p[3]);
});
