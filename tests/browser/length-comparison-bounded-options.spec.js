const {test, expect} = require('@playwright/test');

const url = '/math/topics/length-measurement/index.html';
const equalLengthShuffle = [
  0.10007177111696068,
  0.5644635868093295,
  0.2217988731441083,
  0.4534055392506558,
  0.3387851684069192,
  0.4988641703961716,
  0.6723691935988,
  0.9333442076730282,
  0.45824858474463626,
];

async function verifyDifferentLengths(page) {
  const lines = page.locator('#compare-items .item-line');
  await expect(lines).toHaveCount(2);
  const widths = await lines.evaluateAll(nodes => nodes.map(node => Number.parseFloat(node.style.width)));
  expect(widths.every(Number.isFinite)).toBe(true);
  expect(widths[0]).not.toBe(widths[1]);
  return widths[0] > widths[1] ? 'left' : 'right';
}

test('同长度打乱对及重复随机值下有限换题并只计分一次', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('.mode-tab[data-mode="compare"]').click();
  await page.evaluate(values => {
    let index = 0;
    Math.random = () => values[index++] ?? 0;
  }, equalLengthShuffle);
  await page.locator('#btn-new-compare').click({timeout: 2500});

  const expectedSide = await verifyDifferentLengths(page);
  const correct = page.locator('.compare-btn[data-answer="' + expectedSide + '"]');
  await correct.click();
  await expect(page.locator('#compare-feedback')).toHaveText('🎉 答对了！');
  await correct.click();
  await expect(page.locator('#compare-score')).toHaveText('已答 1 题，答对 1 题');
  expect(errors).toEqual([]);
});

for (const value of [0, 0.999999]) {
  test('固定随机值 ' + value + ' 下比较对象长度不同', async ({page}) => {
    await page.goto(url);
    await page.locator('.mode-tab[data-mode="compare"]').click();
    await page.evaluate(randomValue => { Math.random = () => randomValue; }, value);
    await page.locator('#btn-new-compare').click({timeout: 2500});
    await verifyDifferentLengths(page);
  });
}

test('320px 窄屏可见比较线段且页面无横向溢出', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.goto(url);
  await page.locator('.mode-tab[data-mode="compare"]').click();
  await page.evaluate(() => { Math.random = () => 0; });
  await page.locator('#btn-new-compare').click({timeout: 2500});
  await verifyDifferentLengths(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
