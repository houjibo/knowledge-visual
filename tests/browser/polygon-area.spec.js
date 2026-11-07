const {test, expect} = require('@playwright/test');
const url = '/math/topics/polygon-area/index.html';

test('三个剪拼图的实际画布顶点正确共边', async ({page}) => {
  await page.goto(url);
  await page.locator('[data-mode="explore"]').click();
  const expected = {
    para: [[[240,90],[520,90],[460,260],[240,260]],[[460,260],[520,90],[520,260]]],
    tri: [[[240,250],[420,250],[330,100]],[[510,100],[330,100],[420,250]]],
    trap: [[[230,130],[330,130],[370,250],[190,250]],[[470,250],[370,250],[330,130],[510,130]]],
  };
  for (const kind of Object.keys(expected)) {
    await page.locator(`[data-shape="${kind}"]`).click();
    const paths = await page.evaluate(() => {
      const proto = CanvasRenderingContext2D.prototype;
      const original = {beginPath: proto.beginPath, moveTo: proto.moveTo, lineTo: proto.lineTo, fill: proto.fill};
      let path = [], filled = [];
      proto.beginPath = function() { path = []; return original.beginPath.call(this); };
      for (const method of ['moveTo', 'lineTo']) proto[method] = function(x, y) {
        const point = new DOMPoint(x, y).matrixTransform(this.getTransform());
        path.push([Math.round(point.x), Math.round(point.y)]);
        return original[method].call(this, x, y);
      };
      proto.fill = function(...args) { filled.push(path.slice()); return original.fill.apply(this, args); };
      try { animT = 1; draw(); return filled; }
      finally { Object.assign(proto, original); }
    });
    expect(paths).toEqual(expected[kind]);
  }
});

test('固定随机值生成不同选项，练习及挑战反馈与图形公式一致', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="practice"]').click();
  await page.locator('#practiceNext').click();
  await expect(page.locator('#practiceText')).toContainText('底是 3 cm，高是 2 cm');
  const practice = page.locator('#practiceOpts button');
  await expect(practice).toHaveCount(4);
  expect(new Set(await practice.allTextContents()).size).toBe(4);
  await practice.getByText('6 cm²', {exact: true}).click();
  await expect(page.locator('#practiceFb')).toContainText('答对');
  await expect(practice.first()).toBeDisabled();
  await page.locator('[data-mode="challenge"]').click();
  await page.locator('#challengeStart').click();
  const challenge = page.locator('#chOpts button');
  await challenge.getByText('6 cm²', {exact: true}).click();
  await expect(challenge.first()).toBeDisabled();
  await expect(page.locator('#chCorrect')).toHaveText('1');
});
