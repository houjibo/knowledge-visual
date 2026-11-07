const {test, expect} = require('@playwright/test');
const url = '/math/topics/angle-measurement/index.html';

for (const value of [0, 0.999999]) {
  test(`固定随机值 ${value} 时读角和计算题均有限生成`, async ({page}) => {
    await page.addInitScript(v => { Math.random = () => v; }, value);
    await page.goto(url);
    for (const [mode, selector] of [['read', '#readOptions button'], ['calc', '#calcOptions button']]) {
      await page.locator(`[data-mode="${mode}"]`).click();
      const options = page.locator(selector);
      await expect(options).toHaveCount(4);
      expect(new Set(await options.allTextContents()).size).toBe(4);
    }
  });
}

test('绘制角的射线和标签对应角度，读角题不直接显示答案', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="draw"]').click();
  const slider = page.getByLabel('调整角度');
  for (const degrees of [0, 30, 90, 150, 180]) {
    await slider.fill(String(degrees));
    const ray = page.locator('#drawSvg line').nth(1);
    const x = Number(await ray.getAttribute('x2')), y = Number(await ray.getAttribute('y2'));
    expect(x).toBeCloseTo(120 + 120 * Math.cos(degrees * Math.PI / 180), 1);
    expect(y).toBeCloseTo(160 - 120 * Math.sin(degrees * Math.PI / 180), 1);
    await expect(page.locator('#drawValue')).toHaveText(`${degrees}°`);
  }
  await page.locator('[data-mode="read"]').click();
  await expect(page.locator('#readSvg text').filter({hasText: '°'})).toHaveCount(0);
  await expect(page.locator('#readSvg text').first()).toHaveText('0');
  await expect(page.locator('#readSvg text').last()).toHaveText('180');
});

test('读角、画角和计算只计一次，学习者主动换题', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="read"]').click();
  await page.locator('#readOptions button').getByText('30°', {exact: true}).click();
  await expect(page.locator('#readCorrect')).toHaveText('1');
  await expect(page.locator('#readOptions button').first()).toBeDisabled();
  await page.locator('#readNext').click();
  await expect(page.locator('#readNum')).toHaveText('2');
  await page.locator('[data-mode="draw"]').click();
  await page.getByLabel('调整角度').fill('30');
  await page.locator('#drawCheck').click();
  await expect(page.locator('#drawSuccess')).toHaveText('1');
  await expect(page.locator('#drawCheck')).toBeDisabled();
  await page.locator('[data-mode="calc"]').click();
  await page.locator('#calcOptions button').getByText('85°', {exact: true}).click();
  await expect(page.locator('#calcCorrect')).toHaveText('1');
  await expect(page.locator('#calcOptions button').first()).toBeDisabled();
  await page.locator('#calcNext').click();
  await expect(page.locator('#calcNum')).toHaveText('2');
});

test('八类计算题均有唯一答案，未知角不直接给出', async ({page}) => {
  await page.goto(url);
  const results = await page.evaluate(() => {
    return Array.from({length: 8}, (_, type) => {
      const values = [(type + 0.01) / 8, 0.999999, 0.999999];
      Math.random = () => values.length ? values.shift() : 0;
      const q = genCalcQuestion();
      const visual = q.visual ? drawCalcVisual(q.visual, q.visualData || {}) : '';
      return {options: q.opts, answer: q.ans, visual, maxAngle: q.visualData?.a};
    });
  });
  for (const q of results) {
    expect(q.options).toHaveLength(4);
    expect(new Set(q.options).size).toBe(4);
    expect(q.options.filter(option => option === q.answer)).toHaveLength(1);
    if (q.visual) expect(q.visual).toContain('?°');
  }
  expect(results[7].answer).toBeLessThanOrEqual(180);
});
