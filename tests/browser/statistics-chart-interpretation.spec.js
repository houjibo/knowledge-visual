const {test, expect} = require('@playwright/test');
const url = '/math/middle/data-statistics.html';

test('各分组统计和扇区比例一致，容量可见且可重置', async ({page}) => {
  await page.goto(url);
  const rows = page.locator('#bandTable tr');
  await expect(rows.locator('td:nth-child(2)')).toHaveText(['0','3','4','8','5']);
  await expect(rows.locator('td:nth-child(3)')).toHaveText(['0.0%','15.0%','20.0%','40.0%','25.0%']);
  const pie = page.getByRole('button',{name:'扇形图'});
  await pie.focus(); await page.keyboard.press('Enter');
  await expect(pie).toHaveAttribute('aria-pressed','true');
  const arcs = await page.evaluate(() => {
    const p=CanvasRenderingContext2D.prototype, old=p.arc, arcs=[];
    p.arc=function(x,y,r,a,b,...rest){ if (x===300 && y===230 && r===150) arcs.push(b-a); return old.call(this,x,y,r,a,b,...rest); };
    try { draw(); return arcs; } finally { p.arc=old; }
  });
  expect(arcs).toHaveLength(4);
  for (const [i, fraction] of [0.15,0.2,0.4,0.25].entries()) expect(arcs[i]).toBeCloseTo(fraction * Math.PI * 2);
  await page.evaluate(() => { Math.random=()=>0; });
  await page.locator('#btnAdd').click();
  await expect(rows.first().locator('td').first()).toHaveText('1');
  await page.evaluate(() => { Math.random=()=>0.999999; });
  const add=page.locator('#btnAdd');
  for (let i=0;i<19;i++) await add.click();
  await expect(rows.last().locator('td').first()).toHaveText('24');
  await expect(page.locator('#capacityStatus')).toContainText('40 / 40');
  await expect(add).toBeDisabled();
  await expect(page.locator('#statCanvas')).toHaveAttribute('aria-label', /共 40 人/);
  await page.locator('#btnReset').click();
  await expect(add).toBeEnabled(); await expect(page.locator('#capacityStatus')).toContainText('20 / 40');
  await expect(rows.locator('td:nth-child(2)')).toHaveText(['0','3','4','8','5']);
});

test('学号点图不把学生之间的顺序说成时间趋势', async ({page}) => {
  await page.goto(url);
  await page.getByRole('button',{name:'成绩点图'}).click();
  await expect(page.locator('#statCanvas')).toHaveAttribute('aria-label', /学号不表示时间趋势/);
  const plotted = await page.evaluate(() => {
    const p=CanvasRenderingContext2D.prototype, old={arc:p.arc,stroke:p.stroke}, points=[], strokes=[];
    p.arc=function(x,y,r,...rest){if(r===4) points.push([x,y]); return old.arc.call(this,x,y,r,...rest);};
    p.stroke=function(){strokes.push(this.strokeStyle);return old.stroke.call(this);};
    try { draw(); return {points,strokes}; } finally { Object.assign(p,old); }
  });
  expect(plotted.points).toHaveLength(20);
  expect(plotted.points[0]).toEqual([100,166]);
  expect(plotted.strokes).not.toContain('#fbbf24');
});
