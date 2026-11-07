const {test, expect} = require('@playwright/test');

test('共存平台满足等压和等面积条件，并随温度变化', async ({page}) => {
  await page.goto('/physics/uni/phase-transitions.html');
  const t = page.getByRole('slider', {name: '温度 T (K)', exact: true});
  for (const temperature of [270, 290, 300, 303]) {
    await t.fill(String(temperature));
    await expect(page.locator('#coexistence')).toContainText('模型共存压力');
    const data = await page.evaluate(T => {
      const c = coexistence(T);
      const n = 4000, h = (c.gas - c.liquid) / n;
      let integral = 0;
      for (let i = 0; i <= n; i++) {
        const v = c.liquid + h * i;
        integral += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * (vdwP(T, v) - c.pressure);
      }
      return { ...c, integral: integral * h / 3, liquidP: vdwP(T, c.liquid), gasP: vdwP(T, c.gas) };
    }, temperature);
    expect(data.liquid).toBeLessThan(data.gas);
    expect(data.liquidP).toBeCloseTo(data.pressure, 6);
    expect(data.gasP).toBeCloseTo(data.pressure, 6);
    expect(Math.abs(data.integral)).toBeLessThan(0.00001);
  }
  await t.fill('304');
  await expect(page.locator('#coexistence')).toContainText('无气液共存平台');
  await page.locator('[data-mode="practice"]').click();
  await page.getByRole('slider', {name: '练习温度 T (K)'}).fill('290');
  await expect(page.locator('#p-coexistence')).toContainText('模型共存压力');
});
