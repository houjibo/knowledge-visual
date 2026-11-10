const {test, expect} = require('@playwright/test');

const url = '/math/topics/pattern-sequences/index.html';

async function readUniqueOptions(page, selector) {
  const options = page.locator(selector);
  await expect(options).toHaveCount(4);
  const values = (await options.allTextContents()).map(value => value.trim());
  expect(new Set(values).size).toBe(4);
  return {options, values};
}

async function answerByTryingPracticeOptions(page, selector) {
  const {options, values} = await readUniqueOptions(page, selector);
  for (let index = 0; index < values.length; index++) {
    await options.nth(index).click();
    if ((await options.nth(index).getAttribute('class')).includes('correct')) {
      return values[index];
    }
  }
  throw new Error(`No correct option in ${selector}`);
}

async function answerFromShapeChallenge(page) {
  const spans = await page.locator('#ch-content .challenge-question + div span').allTextContents();
  const visible = spans.slice(0, -1).map(value => value.trim());
  const period = Array.from({length: Math.floor(visible.length / 2)}, (_, index) => index + 1)
    .find(size => visible.every((value, index) => index < size || value === visible[index % size]));
  expect(period).toBeTruthy();
  const answer = visible[visible.length % period];
  const {values} = await readUniqueOptions(page, '#ch-content .challenge-opt');
  expect(values.filter(value => value === answer)).toHaveLength(1);
  return answer;
}

async function completeColorGrid(page) {
  const blanks = page.locator('.color-grid .color-cell[data-blank="true"]');
  const count = await blanks.count();
  expect(count).toBeGreaterThanOrEqual(2);
  expect(count).toBeLessThanOrEqual(4);
  const coordinates = await blanks.evaluateAll(cells => cells.map(cell => `${cell.dataset.r},${cell.dataset.c}`));
  expect(new Set(coordinates).size).toBe(count);

  const rule = await page.locator('#color-instruction').innerText();
  const paletteCount = await page.locator('.palette-btn').count();
  for (let index = 0; index < count; index++) {
    const row = Number((await blanks.nth(index).getAttribute('data-r')));
    const column = Number((await blanks.nth(index).getAttribute('data-c')));
    let colorIndex;
    if (rule.includes('按列循环')) colorIndex = column % paletteCount;
    else if (rule.includes('按行循环')) colorIndex = row % paletteCount;
    else colorIndex = (row + column) % paletteCount;
    await page.locator('.palette-btn').nth(colorIndex).click();
    await blanks.nth(index).click();
  }

  await page.locator('#color-check').click();
  await expect(page.locator('#color-feedback')).toContainText('全部正确');
  await expect(page.locator('#color-next')).toBeVisible();
}

for (const seed of [0, 0.999999]) {
  test(`固定随机值 ${seed} 下规律页面初始化并完成各模式`, async ({page}) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install();
    await page.addInitScript(value => { Math.random = () => value; }, seed);
    await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 5000});

    await answerByTryingPracticeOptions(page, '#shape-options .pattern-opt');
    await page.locator('.mode-tab[data-mode="number"]').click();
    await answerByTryingPracticeOptions(page, '#num-options .num-opt');
    await page.locator('.mode-tab[data-mode="color"]').click();
    await completeColorGrid(page);

    await page.locator('.mode-tab[data-mode="challenge"]').click();
    await page.evaluate(() => { Math.random = () => 0; });
    await page.locator('#challenge-start').click({timeout: 2500, force: true});
    const answer = await answerFromShapeChallenge(page);
    await page.locator('#ch-content .challenge-opt').filter({hasText: new RegExp('^' + answer + '$')}).click();
    await expect(page.locator('#ch-score')).toHaveText('1');
    expect(errors).toEqual([]);
  });
}

test('重复候选的数字挑战仍有限生成并可正确作答', async ({page}) => {
  await page.clock.install();
  await page.goto(url);
  await page.locator('.mode-tab[data-mode="challenge"]').click();
  await page.evaluate(() => {
    const values = [0.5, 0, 0];
    let index = 0;
    Math.random = () => values[index++] ?? 0;
  });
  await page.locator('#challenge-start').click({timeout: 2500, force: true});

  const sequenceText = await page.locator('#ch-content .challenge-question + div').innerText();
  const sequence = sequenceText.match(/\d+/g).map(Number);
  const answer = sequence[sequence.length - 1] + 1;
  const {options, values} = await readUniqueOptions(page, '#ch-content .challenge-opt');
  expect(values.filter(value => Number(value) === answer)).toHaveLength(1);
  await options.filter({hasText: new RegExp('^' + answer + '$')}).click();
  await expect(page.locator('#ch-score')).toHaveText('1');
});

test('320px 窄屏下图形、数字、涂色与挑战模式均无横向溢出', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.clock.install();
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 5000});

  for (const mode of ['shape', 'number', 'color', 'challenge']) {
    await page.locator(`.mode-tab[data-mode="${mode}"]`).click();
    if (mode === 'challenge') {
      await page.locator('#challenge-start').click({timeout: 2500, force: true});
      await expect(page.locator('#ch-content .challenge-opt')).toHaveCount(4);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${mode} mode`).toBe(true);
  }
});
