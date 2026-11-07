const {test, expect} = require('@playwright/test');
const url = '/math/topics/triangles/index.html';
async function sequence(page, values) {
  await page.evaluate(sequence => {
    const pending = [...sequence]; Math.random = () => pending.length ? pending.shift() : 0;
  }, values);
}

for (const value of [0, 0.999999]) {
  test(`重复随机值 ${value} 时所有练习都可加载`, async ({page}) => {
    await page.addInitScript(v => { Math.random = () => v; }, value);
    await page.goto(url);
    await page.locator('[data-mode="challenge"]').click();
    await expect(page.locator('#ch-options button')).toHaveCount(4);
    expect(new Set(await page.locator('#ch-options button').allTextContents()).size).toBe(4);
    await page.locator('[data-mode="sides"]').click();
    expect(await page.locator('#sides-options button').count()).toBeGreaterThanOrEqual(2);
  });
}

test('六种三角形图形符合角和边的分类', async ({page}) => {
  await page.goto(url);
  const triangles = await page.evaluate(() => ['acute','right','obtuse','equilateral','isosceles','scalene'].map(type => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    drawTriangle(svg, type);
    return {type, points: svg.querySelector('polygon').getAttribute('points').split(' ').map(pair => pair.split(',').map(Number))};
  }));
  for (const {type, points} of triangles) {
    const lengths = points.map((p, i) => Math.hypot(p[0] - points[(i+1)%3][0], p[1] - points[(i+1)%3][1])).sort((a,b)=>a-b);
    const delta = lengths[0]**2 + lengths[1]**2 - lengths[2]**2;
    if (type === 'acute') expect(delta).toBeGreaterThan(0);
    if (type === 'right') expect(Math.abs(delta)).toBeLessThan(1);
    if (type === 'obtuse') expect(delta).toBeLessThan(0);
    if (type === 'equilateral') expect(lengths[2] - lengths[0]).toBeLessThan(0.1);
    if (type === 'isosceles') expect(Math.min(lengths[1]-lengths[0], lengths[2]-lengths[1])).toBeLessThan(0.1);
    if (type === 'scalene') expect(Math.min(lengths[1]-lengths[0], lengths[2]-lengths[1])).toBeGreaterThan(1);
  }
});

test('第三边范围限定整数并有唯一正确选项', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="sides"]').click();
  await sequence(page, [0.99, 0, 0]);
  await page.locator('#sides-next').click();
  await expect(page.locator('#sides-question')).toContainText('整数厘米');
  const opts = page.locator('#sides-options button');
  await expect(opts).toHaveCount(4);
  expect(new Set(await opts.allTextContents()).size).toBe(4);
  await opts.getByText('1~5cm', {exact: true}).click();
  await expect(page.locator('#sides-feedback')).toContainText('正确');
  await expect(opts.first()).toBeDisabled();
});

test('四类挑战题和等腰特殊边界可作答', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="challenge"]').click();
  for (const [values, correct] of [
    [[0, 0, 0], '120°'], [[0.26, 0], '锐角三角形'],
    [[0.51, 0, 0, 0, 0], '能'], [[0.76, 0, 0.75], '60°'],
  ]) {
    await sequence(page, values);
    await page.locator('#ch-next').click();
    const opts = page.locator('#ch-options button');
    await expect(opts).toHaveCount(4);
    expect(new Set(await opts.allTextContents()).size).toBe(4);
    await opts.getByText(correct, {exact:true}).click();
    await expect(page.locator('#ch-feedback')).toHaveClass(/correct-fb/);
    await expect(opts.first()).toBeDisabled();
  }
});

test('八次答对后进度保存失败可重试', async ({page}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('denied'); };
  });
  await page.goto(url);
  await page.locator('[data-mode="classify"]').click();
  for (let i = 0; i < 8; i++) {
    await page.locator('#cls-options button').getByText('锐角三角形', {exact:true}).click();
    if (i < 7) await page.locator('#cls-next').click();
  }
  await expect(page.locator('#math-progress-save-notice')).toContainText('暂未保存');
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
  await page.locator('#math-progress-save-notice button').click();
  await expect(page.locator('#math-progress-save-notice')).toContainText('已保存');
  await page.reload();
  expect(await page.evaluate(() => PageProgress.isDone('triangles'))).toBe(true);
});
