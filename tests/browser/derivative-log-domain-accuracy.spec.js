const {test, expect} = require('@playwright/test');

test('对数在非正数处提示未定义，回到定义域后恢复', async ({page}) => {
  const errors=[];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    window.invalidText = [];
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function(text,...args) {
      if (String(text).includes('NaN')) window.invalidText.push(text);
      return original.call(this,text,...args);
    };
  });
  await page.goto('/math/high/derivative.html');
  await page.getByRole('button',{name:'ln(x)', exact:true}).click();
  await expect(page.locator('#domainNote')).toContainText('x > 0');
  const x = page.getByRole('slider',{name:'切点 x₀'});
  for (const value of ['0','-1']) {
    await x.fill(value);
    await expect(page.locator('#equation')).toContainText('未定义');
    await expect(page.locator('#infoGrid')).toContainText('切线斜率 = 未定义');
    await expect(page.locator('#infoGrid')).toContainText('割线斜率 = 未定义');
    await expect(page.locator('#infoGrid')).not.toContainText(/NaN|Infinity/);
  }
  await x.fill('0.1');
  await expect(page.locator('#infoGrid')).toContainText('f(0.1) = -2.303');
  await expect(page.locator('#infoGrid')).toContainText('切线斜率 = 10.000');
  await expect(page.locator('#infoGrid')).toContainText('割线斜率 = 2.398');
  await page.getByRole('button',{name:'🔢 求导法则'}).click();
  await page.getByRole('slider',{name:'观察点 x'}).fill('0');
  await expect(page.locator('#infoGrid')).toContainText('切线斜率 = 未定义');
  await expect(page.locator('#infoGrid')).not.toContainText(/NaN|Infinity/);
  await page.getByRole('button',{name:'x²', exact:true}).click();
  await expect(page.locator('#domainNote')).toBeHidden();
  await expect(page.locator('#infoGrid')).toContainText('切线斜率 = 0.000');
  expect(await page.evaluate(() => window.invalidText)).toEqual([]);
  expect(errors).toEqual([]);
});
