const {test, expect} = require('@playwright/test');

test('坐标网格与曲线使用同一单位', async ({page}) => {
  await page.addInitScript(() => {
    window.canvasOps=[];
    for (const name of ['moveTo','lineTo','fillText']) {
      const original=CanvasRenderingContext2D.prototype[name];
      CanvasRenderingContext2D.prototype[name]=function(...args) {
        if (['graphCanvas','domainCanvas'].includes(this.canvas.id)) window.canvasOps.push({canvas:this.canvas.id, name, args, color:this.strokeStyle});
        return original.apply(this,args);
      };
    }
  });
  await page.goto('/math/high/function.html');
  const has = (canvas,name,a,b) => page.evaluate(([canvas,name,a,b]) => window.canvasOps.some(op=>op.canvas===canvas && op.name===name && op.args[0]===a && op.args[1]===b),[canvas,name,a,b]);
  const hasText = (canvas,label,x,y) => page.evaluate(([canvas,label,x,y]) => window.canvasOps.some(op=>op.canvas===canvas && op.name==='fillText' && op.args[0]===label && op.args[1]===x && op.args[2]===y),[canvas,label,x,y]);
  expect(await hasText('domainCanvas','2',240,122)).toBe(true);
  expect(await hasText('domainCanvas','2',174,63)).toBe(true);
  await page.getByRole('button',{name:'图像探索'}).click();
  expect(await has('graphCanvas','moveTo',225,0)).toBe(true);
  expect(await has('graphCanvas','lineTo',225,300)).toBe(true);
  expect(await hasText('graphCanvas','1',227,164)).toBe(true);
  expect(await hasText('graphCanvas','1',185,108.5)).toBe(true);
  expect(await has('graphCanvas','lineTo',225,112.5)).toBe(true);
  await expect(page.getByText('坐标轴每格为 1；横纵方向显示比例不同。')).toBeVisible();
});
