const {test, expect} = require('@playwright/test');
const url = '/math/middle/data-analysis.html';

test('对比结论随数据变化，并说明平均水平差异', async ({page}) => {
  await page.goto(url);
  const slider = page.getByLabel('调整第 5 个数据');
  const compare = page.getByRole('button',{name:'混合对比'});
  await compare.focus(); await page.keyboard.press('Enter');
  await expect(compare).toHaveAttribute('aria-pressed','true');
  await expect(slider).toBeDisabled();
  await expect(page.locator('#comparisonSummary')).toContainText('A 组方差较小');
  await expect(page.locator('#comparisonSummary')).toContainText('平均数相同');
  await page.getByRole('button',{name:'数据集 A'}).click();
  await expect(slider).toBeEnabled(); await slider.fill('20');
  await expect(page.locator('#infoMean')).toContainText('10.4');
  await expect(page.locator('#infoVar')).toContainText('23.44');
  await expect(page.locator('#dataCanvas')).toHaveAttribute('aria-label', /7、8、8、9、20/);
  await compare.click();
  await expect(page.locator('#infoVar')).toContainText('23.44 / 4.40');
  await expect(page.locator('#comparisonSummary')).toContainText('B 组方差较小');
  await expect(page.locator('#comparisonSummary')).toContainText('平均数不同');
  await expect(page.locator('#dataCanvas')).toHaveAttribute('aria-label', /B 组方差较小/);
  const drawnText = await page.evaluate(() => {
    const p = CanvasRenderingContext2D.prototype, old = p.fillText, labels = [];
    p.fillText = function(text,...args) { labels.push(String(text)); return old.call(this,text,...args); };
    try { draw(); return labels; } finally { p.fillText = old; }
  });
  expect(drawnText).toContain('B 组方差较小，数据波动较小。');
  await page.getByRole('button',{name:'数据集 A'}).click();
  await slider.fill('3'); await compare.click();
  await expect(page.locator('#infoVar')).toContainText('4.40 / 4.40');
  await expect(page.locator('#comparisonSummary')).toContainText('方差相同');
  await page.getByRole('button',{name:'数据集 B'}).click();
  await expect(slider).toHaveValue('10');
  await slider.focus(); await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#valX')).toHaveText('9');
  await page.getByRole('button',{name:'数据集 A'}).click();
  await expect(slider).toHaveValue('3');
});
