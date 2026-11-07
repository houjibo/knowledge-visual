const {test, expect} = require('@playwright/test');

test('交集高亮仅在两圆交叠处', async ({page}) => {
  await page.goto('/math/high/sets.html');
  await page.getByRole('button',{name:'集合运算',exact:true}).click();
  const pixels = await page.locator('#canvasIntersect').evaluate(canvas => {
    const ctx=canvas.getContext('2d');
    return [[100,80],[160,80],[220,80],[130,45]].map(([x,y])=>Array.from(ctx.getImageData(x,y,1,1).data));
  });
  expect(pixels[1][3]).toBeGreaterThan(pixels[0][3]+60);
  expect(pixels[1][3]).toBeGreaterThan(pixels[2][3]+60);
  expect(pixels[3][0]).toBeLessThan(10);
});

test('元素键盘选择后实时更新四种集合运算', async ({page}) => {
  await page.goto('/math/high/sets.html');
  await page.getByRole('button',{name:'集合运算',exact:true}).click();
  const a1 = page.getByRole('button',{name:'集合 A 元素 1'});
  const a2 = page.getByRole('button',{name:'集合 A 元素 2'});
  const b2 = page.getByRole('button',{name:'集合 B 元素 2'});
  await a1.focus();
  await page.keyboard.press('Enter');
  await expect(a1).toBeFocused();
  await expect(a1).toHaveAttribute('aria-pressed','true');
  await a2.click();
  await b2.click();
  const controls=page.locator('#setOperationButtons');
  const result=page.locator('#setOpResult');
  await controls.getByRole('button',{name:'A ∩ B'}).click();
  await expect(result).toHaveText('A ∩ B = {2}');
  await expect(controls.getByRole('button',{name:'A ∩ B'})).toHaveAttribute('aria-pressed','true');
  await b2.focus();
  await page.keyboard.press('Space');
  await expect(b2).toBeFocused();
  await expect(result).toHaveText('A ∩ B = ∅（空集）');
  await controls.getByRole('button',{name:'A ∪ B'}).click();
  await expect(result).toHaveText('A ∪ B = {1, 2}');
  await b2.click();
  await controls.getByRole('button',{name:'A - B'}).click();
  await expect(result).toHaveText('A - B = {1}');
  await controls.getByRole('button',{name:'B - A'}).click();
  await expect(result).toHaveText('B - A = ∅（空集）');
  await a2.click();
  await expect(result).toHaveText('B - A = {2}');
  await page.getByRole('button',{name:'Venn图',exact:true}).click();
  await page.locator('#vennRelationButtons').getByRole('button',{name:'A ⊆ B'}).click();
  await page.getByRole('button',{name:'集合运算',exact:true}).click();
  await expect(controls.getByRole('button',{name:'B - A'})).toHaveAttribute('aria-pressed','true');
  await expect(controls.getByRole('button',{name:'B - A'})).toHaveClass(/active/);
  await expect(result).toHaveText('B - A = {2}');
});
