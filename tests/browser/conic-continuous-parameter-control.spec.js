const {test, expect} = require('@playwright/test');

test('滑块连续键盘调节时保持焦点并更新公式', async ({page}) => {
  await page.goto('/math/high/conic-sections.html');
  await page.getByRole('button',{name:'🔴 椭圆'}).click();
  const slider = page.locator('#controls input').first();
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(slider).toBeFocused();
  await expect(slider).toHaveValue('5.3');
  await expect(page.locator('#equation')).toContainText('5.3²');
  await expect(page.getByRole('slider',{name:'横向半轴 a'})).toBeVisible();
});

test('滑块连续拖动时节点保持且公式跟随最终值', async ({page}) => {
  await page.goto('/math/high/conic-sections.html');
  await page.getByRole('button',{name:'🔴 椭圆'}).click();
  const slider = page.getByRole('slider',{name:'横向半轴 a'});
  await slider.evaluate(el => {
    window.originalSlider = el;
    window.parameterInputs = 0;
    el.addEventListener('input', () => window.parameterInputs++);
  });
  await slider.scrollIntoViewIfNeeded();
  const box = await slider.boundingBox();
  await page.mouse.move(box.x + box.width * .2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * .8, box.y + box.height / 2, {steps: 12});
  await page.mouse.up();
  expect(await page.evaluate(() => window.originalSlider === document.querySelector('#param-a'))).toBe(true);
  expect(await page.evaluate(() => window.parameterInputs)).toBeGreaterThan(1);
  const value = await slider.inputValue();
  expect(Number(value)).toBeGreaterThan(5);
  await expect(page.locator('#equation')).toContainText(`${Number(value).toFixed(1)}²`);
});
