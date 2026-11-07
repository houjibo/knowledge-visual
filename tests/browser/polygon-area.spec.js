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

test('键盘控制剪拼步骤，切换形状及模式时停止动画', async ({page}) => {
  await page.goto(url);
  await page.locator('[data-mode="explore"]').click();
  const range = page.getByRole('slider', {name: '手动观察剪拼步骤'});
  const desc = page.locator('#stepDescription');
  await expect(desc).toContainText('初始');
  await range.focus();
  await page.keyboard.press('ArrowRight');
  await expect(range).toHaveValue('1');
  await expect(desc).toContainText('移动中');
  expect(await page.evaluate(() => animT)).toBe(.01);
  await page.keyboard.press('End');
  await expect(desc).toContainText('拼成长方形');
  await expect(page.locator('#areaCanvas')).toHaveAttribute('aria-label', /拼成长方形/);
  await expect(page.locator('#animBtn')).toContainText('重新播放');
  await page.locator('[data-shape="tri"]').click();
  await expect(range).toHaveValue('0');
  await expect(page.locator('[data-shape="tri"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(desc).toContainText('三角形重叠');
  await page.locator('#animBtn').click();
  await expect(page.locator('#animBtn')).toContainText('暂停');
  await page.locator('#animBtn').click();
  await expect(page.locator('#animBtn')).toContainText('播放');
  expect(await page.evaluate(() => animating)).toBe(false);
  await page.locator('#animBtn').click();
  await page.locator('[data-mode="practice"]').click();
  expect(await page.evaluate(() => animating)).toBe(false);
});


test('播放完成后可以重新播放', async ({page}) => {
  await page.goto(url);
  await page.locator('[data-mode="explore"]').click();
  const button = page.locator('#animBtn');
  const range = page.locator('#stepRange');
  await button.click();
  await expect(range).toHaveValue('100', {timeout: 5000});
  await expect(button).toContainText('重新播放');
  await expect(page.locator('#stepDescription')).toContainText('完成');
  await button.click();
  await expect(button).toContainText('暂停');
  expect(Number(await range.inputValue())).toBeLessThan(100);
});
