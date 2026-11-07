const {test, expect} = require('@playwright/test');
const url = '/chemistry/high/chemical-bond.html';
async function keyboardClick(page, locator) { await locator.focus(); await page.keyboard.press('Enter'); }
async function sixCorrect(page) {
  for (const [i, answer] of [0, 1, 2].entries()) {
    await keyboardClick(page, page.locator('#bondOpts button').nth(answer));
    if (i < 2) await page.locator('#bondNext').click();
  }
  await keyboardClick(page, page.locator('[data-tab="hybrid"]'));
  for (const [i, answer] of [2, 1, 0].entries()) {
    await keyboardClick(page, page.locator('#hybridOpts button').nth(answer));
    if (i < 2) await page.locator('#hybridNext').click();
  }
}

test('键盘切换模式、杂化和分子，说明遵循偶极矩判断', async ({page}) => {
  await page.goto(url);
  await keyboardClick(page, page.locator('[data-mode="polar"]'));
  await expect(page.locator('[data-mode="polar"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#bondConcept')).toContainText('极性共价键');
  await expect(page.locator('#stage-bond .info-box')).toContainText('不能作为绝对分界');
  await keyboardClick(page, page.locator('[data-tab="hybrid"]'));
  await keyboardClick(page, page.locator('[data-hybrid="sp2"]'));
  await expect(page.locator('#hybridEq')).toContainText('sp²');
  await page.getByLabel('旋转角度').fill('90');
  await expect(page.locator('#hybridRotVal')).toHaveText('90°');
  await keyboardClick(page, page.locator('[data-tab="geometry"]'));
  await expect(page.locator('#geomConcept')).toContainText('CH₄');
  const water = page.locator('#molGrid button').filter({hasText:'H₂O'});
  await keyboardClick(page, water);
  await expect(water).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#geomConcept')).toContainText('V形');
  await keyboardClick(page, page.locator('[data-tab="polarity"]'));
  await keyboardClick(page, page.locator('[data-polar="co2"]'));
  await expect(page.locator('#polarEq')).toContainText('非极性');
  await expect(page.locator('#polarInfo')).toContainText('矢量和');
});

test('六道不同题目完成并在刷新后保留', async ({page}) => {
  await page.goto(url);
  await expect(page.locator('#bondProgress')).toContainText('6 题');
  await sixCorrect(page);
  await expect(page.locator('#bondProgress')).toContainText('已完成');
  await page.locator('#hybridPrev').click();
  await expect(page.locator('#hybridOpts button').first()).toBeDisabled();
  await expect(page.locator('#hybridFb')).toContainText('正确');
  await page.reload();
  await expect(page.locator('#bondProgress')).toContainText('已完成');
});

test('写入失败显示未保存，恢复后重试', async ({page}) => {
  await page.addInitScript(() => {
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('denied'); };
  });
  await page.goto(url);
  await sixCorrect(page);
  await expect(page.locator('#bondProgress')).toContainText('进度未保存');
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
  await keyboardClick(page, page.locator('#bondRetrySave'));
  await expect(page.locator('#bondProgress')).toContainText('已完成');
  await page.reload();
  await expect(page.locator('#bondProgress')).toContainText('已完成');
});

async function coloredLines(page, drawName, color) {
  return page.evaluate(({drawName, color}) => {
    const proto = CanvasRenderingContext2D.prototype;
    const old = {beginPath: proto.beginPath, moveTo: proto.moveTo, lineTo: proto.lineTo, stroke: proto.stroke};
    let points = [], lines = [];
    proto.beginPath = function() { points = []; return old.beginPath.call(this); };
    proto.moveTo = function(x, y) { points.push([x, y]); return old.moveTo.call(this, x, y); };
    proto.lineTo = function(x, y) { points.push([x, y]); return old.lineTo.call(this, x, y); };
    proto.stroke = function(...args) {
      if (this.strokeStyle === color && points.length === 2) lines.push(points.slice());
      return old.stroke.apply(this, args);
    };
    try { if (drawName === 'geometry') drawMolecule(); else drawPolar(); return lines; }
    finally { Object.assign(proto, old); }
  }, {drawName, color});
}
function lineAngle(a, b) {
  const av = [a[1][0] - a[0][0], a[1][1] - a[0][1]];
  const bv = [b[1][0] - b[0][0], b[1][1] - b[0][1]];
  return Math.acos((av[0] * bv[0] + av[1] * bv[1]) / (Math.hypot(...av) * Math.hypot(...bv))) * 180 / Math.PI;
}

test('水和 BF₃ 的画布键角与标注一致', async ({page}) => {
  await page.goto(url);
  await page.locator('[data-tab="geometry"]').click();
  await page.locator('#molGrid button').filter({hasText:'H₂O'}).click();
  let lines = await coloredLines(page, 'geometry', '#ef4444');
  expect(lines).toHaveLength(2);
  expect(lineAngle(lines[0], lines[1])).toBeCloseTo(104.5, 5);
  await expect(page.locator('#geomInfo')).toContainText('二维示意');
  await page.locator('#molGrid button').filter({hasText:'BF₃'}).click();
  lines = await coloredLines(page, 'geometry', '#f59e0b');
  expect(lines).toHaveLength(3);
  expect(lineAngle(lines[0], lines[1])).toBeCloseTo(120, 5);
  expect(lineAngle(lines[1], lines[2])).toBeCloseTo(120, 5);
});

test('水、二氧化碳与氯化氢的化学偶极箭头指向负电端', async ({page}) => {
  await page.goto(url);
  await page.locator('[data-tab="polarity"]').click();
  await expect(page.locator('#stage-polarity .legend')).toContainText('δ⁺ → δ⁻');
  const longArrows = async () => (await coloredLines(page, 'polar', '#fbbf24')).filter(([a,b]) => Math.hypot(b[0]-a[0], b[1]-a[1]) > 20);
  let arrows = await longArrows();
  expect(arrows).toHaveLength(3);
  expect(arrows.every(([a,b]) => b[1] < a[1])).toBe(true);
  expect(arrows[0][1][0]).toBeGreaterThan(arrows[0][0][0]);
  expect(arrows[1][1][0]).toBeLessThan(arrows[1][0][0]);
  await page.locator('[data-polar="co2"]').click();
  arrows = await longArrows();
  expect(arrows).toHaveLength(2);
  expect(arrows[0][1][0]).toBeLessThan(arrows[0][0][0]);
  expect(arrows[1][1][0]).toBeGreaterThan(arrows[1][0][0]);
  await page.locator('[data-polar="hcl"]').click();
  arrows = await longArrows();
  expect(arrows).toHaveLength(1);
  expect(arrows[0][1][0]).toBeGreaterThan(arrows[0][0][0]);
});
