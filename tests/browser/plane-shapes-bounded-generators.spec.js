const { test, expect } = require('@playwright/test');

const url = '/math/topics/plane-shapes/index.html';
const shapeNames = {
  rect: '长方形',
  square: '正方形',
  triangle: '三角形',
  circle: '圆',
  parallelogram: '平行四边形',
  trapezoid: '梯形',
};
const shapeColors = {
  rect: '#4A90D9',
  square: '#7B1FA2',
  triangle: '#FF9500',
  circle: '#34C759',
  parallelogram: '#E91E63',
  trapezoid: '#00BCD4',
};
const clues = {
  rect: [
    '我有4条边，对边一样长，4个角都是直角。',
    '我的形状像一扇门，也像一本书。',
    '我有2条长边、2条短边，4个角一样大。',
  ],
  square: [
    '我有4条边，4条边都一样长，4个角都是直角。',
    '我的形状像魔方的每一面，也像一块手帕。',
    '我是特殊的长方形，我的长和宽一样长。',
  ],
  triangle: [
    '我有3条边、3个角，像一座小山。',
    '我的形状像切开的三明治，也像屋顶。',
    '我是边最少的多边形，我有3个尖尖的角。',
  ],
  circle: [
    '我没有角，也没有直的边，全身光滑。',
    '我的形状像硬币，也像太阳。',
    '我从圆心到边上处处一样远，像一个大圆圈。',
  ],
  parallelogram: [
    '我有4条边，对边平行且一样长，但我没有直角。',
    '我像被推歪了的长方形。',
    '我的对面一模一样，但我站不直。',
  ],
  trapezoid: [
    '我有4条边，只有2条边是平行的。',
    '我像一座水坝的截面，上面短下面长。',
    '我有一对平行边，另一对边不平行。',
  ],
};

async function readFindQuestion(page) {
  const question = await page.locator('#findProblem').innerText();
  const match = question.match(/找出所有的(.+?)（点击编号）/u);
  expect(match).not.toBeNull();
  const targetShape = Object.keys(shapeNames).find(shape => shapeNames[shape] === match[1]);
  expect(targetShape).toBeTruthy();

  const strokes = await page.locator('#findSvgWrap svg rect, #findSvgWrap svg polygon, #findSvgWrap svg circle')
    .evaluateAll(nodes => nodes.map(node => node.getAttribute('stroke')));
  expect(strokes.length).toBeGreaterThanOrEqual(4);
  expect(strokes.length).toBeLessThanOrEqual(6);
  expect(strokes).toContain(shapeColors[targetShape]);
  expect(strokes.some(stroke => stroke !== shapeColors[targetShape])).toBe(true);
  await expect(page.locator('#findOptions .find-opt')).toHaveCount(strokes.length);
}

async function readGuessQuestion(page) {
  const clue = (await page.locator('#guessClue').innerText()).split('\n').pop().trim();
  const answerShape = Object.keys(clues).find(shape => clues[shape].includes(clue));
  expect(answerShape).toBeTruthy();

  const options = await page.locator('#guessOptions .guess-opt').evaluateAll(nodes =>
    nodes.map(node => node.dataset.shape));
  expect(options).toHaveLength(4);
  expect(new Set(options).size).toBe(4);
  expect(options).toContain(answerShape);
}

for (const randomValue of [0, 0.5, 0.999999]) {
  test(`固定随机值 ${randomValue} 下平面图形练习能初始化并生成下一题`, async ({ page }) => {
    await page.addInitScript(value => { Math.random = () => value; }, randomValue);
    const response = await page.goto(url, { timeout: 2500 });
    expect(response.status()).toBe(200);

    await page.locator('.mode-tab[data-mode="find"]').click();
    await readFindQuestion(page);
    await page.locator('#btnFindNext').click();
    await readFindQuestion(page);

    await page.locator('.mode-tab[data-mode="guess"]').click();
    await readGuessQuestion(page);
    await page.locator('#btnGuessNext').click();
    await readGuessQuestion(page);
  });
}

test('320px 窄屏下猜图形的四个选项均可见且不横向溢出', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url, { timeout: 2500 });
  await page.locator('.mode-tab[data-mode="guess"]').click();

  const boxes = await page.locator('#guessOptions .guess-opt').evaluateAll(nodes => nodes.map(node => {
    const box = node.getBoundingClientRect();
    return { left: box.left, right: box.right, width: box.width };
  }));
  expect(boxes).toHaveLength(4);
  for (const box of boxes) {
    expect(box.width).toBeGreaterThan(0);
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(320);
  }
});
