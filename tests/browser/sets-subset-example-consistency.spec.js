const {test, expect} = require('@playwright/test');

test('元素归属可键盘选择并反馈', async ({page}) => {
  await page.goto('/math/high/sets.html');
  const two=page.getByRole('button',{name:'判断元素 2'});
  await two.focus();
  await page.keyboard.press('Enter');
  await expect(two).toBeFocused();
  await expect(page.locator('#elementResult')).toContainText('2 ∈ A');
  await page.getByRole('button',{name:'判断元素 3'}).focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#elementResult')).toContainText('3 ∉ A');
});

test('子集动画各阶段的元素与文字集合一致', async ({page}) => {
  await page.addInitScript(() => {
    window.subsetEllipses=[]; window.subsetTexts=[];
    const ellipse=CanvasRenderingContext2D.prototype.ellipse;
    const text=CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.ellipse=function(...args) {
      if (this.canvas.id==='canvasSubset') window.subsetEllipses.push(args.slice(0,4));
      return ellipse.apply(this,args);
    };
    CanvasRenderingContext2D.prototype.fillText=function(...args) {
      if (this.canvas.id==='canvasSubset' && /^[1-9]$/.test(args[0])) window.subsetTexts.push(args.slice(0,3));
      return text.apply(this,args);
    };
  });
  await page.goto('/math/high/sets.html');
  await page.getByRole('button',{name:'Venn图',exact:true}).click();
  for (const phase of [0,1,2,3,4,5,6,7,8,9,10]) {
    const result=await page.evaluate(phase => {
      window.subsetEllipses=[]; window.subsetTexts=[]; drawSubset(phase);
      return {ellipses:window.subsetEllipses, labels:window.subsetTexts};
    },phase);
    const [outer,inner]=result.ellipses;
    const contains = ([x,y,rx,ry],px,py) => ((px-x)/rx)**2 + ((py-y)/ry)**2 < 1;
    expect(result.labels.map(v=>v[0])).toEqual(phase<3 ? [] : phase<5 ? ['1','2'] : ['1','2','3','4']);
    for (const [label,x,y] of result.labels) {
      expect(contains(outer,x,y)).toBe(true);
      expect(contains(inner,x,y)).toBe(['1','2'].includes(label));
    }
  }
  await expect(page.getByText(/动画将逐步展示这些元素/)).toBeVisible();
});
