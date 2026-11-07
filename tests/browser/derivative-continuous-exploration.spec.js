const {test, expect} = require('@playwright/test');

test('导数参数可连续键盘调节并保持焦点', async ({page}) => {
  await page.goto('/math/high/derivative.html');
  const slider = page.locator('#controls input').first();
  await slider.focus();
  for (let i=0; i<3; i++) await page.keyboard.press('ArrowRight');
  await expect(slider).toBeFocused();
  await expect(slider).toHaveValue('1.3');
  await expect(page.locator('#infoGrid')).toContainText('切线斜率 = 2.600');
  await expect(page.getByRole('slider',{name:'切点 x₀'})).toBeVisible();
});

test('函数按钮键盘选择与连续指针拖动保持同步', async ({page}) => {
  await page.goto('/math/high/derivative.html');
  const cube = page.getByRole('button', {name:'x³', exact:true});
  await cube.focus();
  await page.keyboard.press('Enter');
  await expect(cube).toBeFocused();
  await expect(cube).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('button',{name:'x²', exact:true})).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('#infoGrid')).toContainText('切线斜率 = 3.000');
  const slider = page.getByRole('slider',{name:'切点 x₀'});
  await slider.scrollIntoViewIfNeeded();
  await slider.evaluate(el => { window.originalSlider=el; window.inputCount=0; el.addEventListener('input',()=>window.inputCount++); });
  const box = await slider.boundingBox();
  await page.mouse.move(box.x+box.width*.2,box.y+box.height/2);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width*.8,box.y+box.height/2,{steps:12});
  await page.mouse.up();
  expect(await page.evaluate(() => window.originalSlider === document.querySelector('#derivative-x'))).toBe(true);
  expect(await page.evaluate(() => window.inputCount)).toBeGreaterThan(1);
  const value = Number(await slider.inputValue());
  await expect(page.locator('#infoGrid')).toContainText(`切线斜率 = ${(3*value*value).toFixed(3)}`);
  await page.getByRole('button',{name:'🔢 求导法则'}).click();
  await expect(page.getByRole('slider',{name:'观察点 x'})).toHaveValue(String(value));
  await expect(page.locator('#equation')).toContainText('3x²');
});
