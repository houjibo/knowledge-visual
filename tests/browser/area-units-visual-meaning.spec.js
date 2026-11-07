const {test, expect} = require('@playwright/test');

test('单位示意图的方格数与说明一致', async ({page}) => {
  await page.goto('/math/topics/area-units/index.html');
  await expect(page.locator('#dm-unit-grid .unit-cell')).toHaveCount(100);
  await expect(page.locator('#meter-unit-grid .unit-cell')).toHaveCount(100);
  await expect(page.locator('#dm-unit-grid')).toHaveAccessibleName(/100 个 1 平方厘米/);
  await expect(page.locator('#meter-unit-grid')).toHaveAccessibleName(/100 个 1 平方分米/);
  await expect(page.locator('.section-desc').first()).toContainText('不按实际尺寸');
  for (const id of ['dm-unit-grid','meter-unit-grid']) {
    const columns = await page.locator('#' + id).evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(10);
  }
});

test('四个相邻单位换算方向提供正确提示', async ({page}) => {
  await page.goto('/math/topics/area-units/index.html');
  await page.locator('.mode-tab[data-mode="convert"]').click();
  for (const [random, hint, answer] of [[0,'1 平方分米 = 100 平方厘米','1'],[.21,'1 平方分米 = 100 平方厘米','100'],[.41,'1 平方米 = 100 平方分米','1'],[.61,'1 平方米 = 100 平方分米','100']]) {
    await page.evaluate(value => { let first = true; Math.random = () => { if (first) { first = false; return value; } return 0; }; newConvert(); }, random);
    await expect(page.locator('#convert-hint')).toContainText(hint);
    await page.locator('#convert-options button').getByText(answer,{exact:true}).click();
    await expect(page.locator('#btn-next-convert')).toBeVisible();
  }
});
