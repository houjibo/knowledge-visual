const {test, expect} = require('@playwright/test');
const url = '/math/high/random-variables.html';
async function normalCurve(page) {
  return page.evaluate(() => {
    const p = CanvasRenderingContext2D.prototype, original = {beginPath:p.beginPath, moveTo:p.moveTo, lineTo:p.lineTo, stroke:p.stroke};
    let path = [], curve;
    p.beginPath = function() { path = []; return original.beginPath.call(this); };
    for (const name of ['moveTo','lineTo']) p[name] = function(x,y) { path.push([x,y]); return original[name].call(this,x,y); };
    p.stroke = function() { if (this.strokeStyle === '#22d3ee' && path.length > 100) curve = path.slice(); return original.stroke.call(this); };
    try { draw(); return curve; } finally { Object.assign(p, original); }
  });
}
test('固定坐标体现正态曲线随标准差变宽变矮', async ({page}) => {
  await page.goto(url);
  const normal = page.getByRole('button',{name:'正态分布'});
  await normal.focus(); await page.keyboard.press('Enter');
  await expect(normal).toHaveAttribute('aria-pressed','true');
  const sigma = page.getByLabel('标准差 σ (μ=0)');
  await sigma.fill('0.5'); const narrow = await normalCurve(page);
  await sigma.fill('3'); const wide = await normalCurve(page);
  expect(narrow).toHaveLength(401); expect(wide).toHaveLength(401);
  expect(narrow[200][0]).toBeCloseTo(wide[200][0]);
  expect(narrow[200][1]).toBeLessThan(wide[200][1]);
  expect(wide[250][1]).toBeLessThan(narrow[250][1]);
  await expect(page.locator('#distCanvas')).toHaveAttribute('aria-label', /标准差3.0.*68.27%/);
  await expect(page.locator('#infoD')).toContainText('68.27%');
  const scroll = page.getByRole('region',{name:'分布图，可左右滚动'});
  const d = await scroll.evaluate(el => ({width:el.clientWidth, content:el.scrollWidth, page:document.documentElement.scrollWidth, screen:innerWidth}));
  expect(d.page).toBeLessThanOrEqual(d.screen);
  if (d.width < 640) expect(d.content).toBeGreaterThan(d.width);
});

test('超几何样本数有效，离散图正确描述期望与计算题', async ({page}) => {
  await page.goto(url);
  const n = page.getByLabel('试验次数 n');
  await n.fill('30');
  await page.getByRole('button',{name:'超几何分布'}).click();
  await expect(n).toHaveAttribute('max','20'); await expect(n).toHaveValue('20');
  await expect(page.locator('#valN')).toHaveText('20');
  await expect(page.locator('#infoE')).toContainText('5.00');
  await expect(page.locator('#distCanvas')).toHaveAttribute('aria-label', /抽取20/);
  await page.getByRole('button',{name:'二项分布'}).click();
  await expect(n).toHaveAttribute('max','30');
  await n.fill('2'); await page.getByLabel('概率 p').fill('0.30');
  await expect(page.locator('#infoE')).toContainText('0.60');
  const labels = await page.evaluate(() => {
    const p=CanvasRenderingContext2D.prototype, old=p.fillText, texts=[];
    p.fillText=function(text,...args){texts.push(String(text)); return old.call(this,text,...args);};
    try { draw(); return texts; } finally { p.fillText=old; }
  });
  expect(labels.some(t => t.includes('最接近期望 0.60'))).toBe(true);
  await page.getByRole('button',{name:'🧪 计算'}).click();
  await page.locator('#a3').fill('0.467'); await page.locator('[data-check="a3"]').click();
  await expect(page.locator('#fb-a3')).toContainText('3×7/45');
  await page.locator('#a3').fill('0.45'); await page.locator('[data-check="a3"]').click();
  await expect(page.locator('#fb-a3')).toContainText('C(7,1)');
  await page.locator('#a1').fill('0.33'); await page.locator('[data-check="a1"]').click();
  await expect(page.locator('#fb-a1')).toContainText('提示');
});
