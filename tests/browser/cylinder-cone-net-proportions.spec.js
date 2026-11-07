const {test,expect}=require('@playwright/test');
const url='/math/topics/cylinder-and-cone/index.html';

test('圆柱展开图侧面宽度等于底面周长',async({page})=>{
  await page.addInitScript(()=>{window.netCalls=[];for(const name of ['arc','strokeRect']){const old=CanvasRenderingContext2D.prototype[name];CanvasRenderingContext2D.prototype[name]=function(...args){window.netCalls.push({name,args});return old.apply(this,args);};}});
  await page.goto(url); await page.getByRole('button',{name:'🔍 展开图'}).click(); await page.evaluate(()=>{window.netCalls=[];});
  await page.locator('#btn-cylinder-unfold').click();
  const calls=await page.evaluate(()=>window.netCalls); const arcs=calls.filter(x=>x.name==='arc'); const rect=calls.find(x=>x.name==='strokeRect');
  expect(arcs).toHaveLength(2); expect(arcs[0].args[2]).toBe(arcs[1].args[2]);
  expect(rect.args[2]).toBeCloseTo(2*Math.PI*arcs[0].args[2],8);
  await expect(page.locator('#btn-cylinder-unfold')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#unfoldCanvas')).toHaveAccessibleName(/长等于底面周长/);
});

test('圆锥扇形弧长等于底面周长',async({page})=>{
  await page.addInitScript(()=>{window.netCalls=[];const old=CanvasRenderingContext2D.prototype.arc;CanvasRenderingContext2D.prototype.arc=function(...args){window.netCalls.push(args);return old.apply(this,args);};});
  await page.goto(url); await page.getByRole('button',{name:'🔍 展开图'}).click(); await page.evaluate(()=>{window.netCalls=[];});
  await page.locator('#btn-cone-unfold').click();
  const [sector,base]=await page.evaluate(()=>window.netCalls);
  expect(sector[2]*(sector[4]-sector[3])).toBeCloseTo(2*Math.PI*base[2],8);
  await expect(page.locator('#btn-cone-unfold')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#btn-cylinder-unfold')).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('#unfoldCanvas')).toHaveAccessibleName(/扇形弧长等于底面周长/);
  await expect(page.locator('#unfold-explain-text')).toContainText('侧面积 = πrl');
});
