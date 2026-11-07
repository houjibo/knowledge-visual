const {test, expect} = require('@playwright/test');

for (const width of [320,390,1280]) test(`Venn 关系在 ${width} 像素视口完整可见且几何关系正确`, async ({page}) => {
  await page.setViewportSize({width,height:844});
  await page.goto('/math/high/sets.html');
  await page.addStyleTag({content:'.venn-circle { transition: none !important; }'});
  await page.getByRole('button',{name:'Venn图',exact:true}).click();
  const diagram = page.locator('#vennContainer');
  const rect = await diagram.boundingBox();
  expect(rect.x).toBeGreaterThanOrEqual(0);
  expect(rect.x+rect.width).toBeLessThanOrEqual(width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  await expect(page.locator('#vennDesc')).toContainText('部分重叠');
  const relation = page.locator('#vennRelationButtons');
  for (const [name,type] of [['A ⊆ B','subset'],['A ⊇ B','superset'],['A ∩ B ≠ ∅','intersect'],['A ∩ B = ∅','disjoint']]) {
    const button=relation.getByRole('button',{name,exact:true});
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('aria-pressed','true');
    const [a,b] = await Promise.all([page.locator('#vennA').boundingBox(),page.locator('#vennB').boundingBox()]);
    expect(Math.abs(a.width-a.height)).toBeLessThan(1);
    expect(Math.abs(b.width-b.height)).toBeLessThan(1);
    const ra=a.width/2, rb=b.width/2;
    const distance=Math.hypot(a.x+ra-b.x-rb,a.y+ra-b.y-rb);
    if(type==='subset') expect(distance+ra).toBeLessThan(rb);
    if(type==='superset') expect(distance+rb).toBeLessThan(ra);
    if(type==='intersect') expect(distance).toBeLessThan(ra+rb);
    if(type==='disjoint') expect(distance).toBeGreaterThan(ra+rb);
    await expect(page.locator('#vennDesc')).toContainText(name);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});
