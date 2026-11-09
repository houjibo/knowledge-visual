const {test, expect} = require('@playwright/test');

const url = '/math/topics/multiplication-tables/index.html';
const randomValues = [0, 0.4, 0.5, 0.999999];

function fillAnswer(problem) {
  const text = problem.replace(/\s+/g, '');
  let match = text.match(/^(\d+)×(\d+)=\?$/);
  if (match) return Number(match[1]) * Number(match[2]);
  match = text.match(/^\?×(\d+)=(\d+)$/);
  if (match) return Number(match[2]) / Number(match[1]);
  match = text.match(/^(\d+)×\?=(\d+)$/);
  if (match) return Number(match[2]) / Number(match[1]);
  throw new Error(`无法解析填空题：${problem}`);
}

async function openWithFixedRandom(page, value) {
  await page.addInitScript(fixed => { Math.random = () => fixed; }, value);
  await page.goto(url, {timeout: 2000});
}

for (const value of randomValues) {
  test(`填空练习随机值 ${value} 有限生成并能继续作答`, async ({page}) => {
    await openWithFixedRandom(page, value);
    await page.locator('.mode-tab[data-mode="fill"]').click();
    const buttons = page.locator('#fill-options .fill-opt');
    await expect(buttons).toHaveCount(4);
    const answer = fillAnswer(await page.locator('#fill-problem').innerText());
    const values = (await buttons.allTextContents()).map(Number);
    expect(new Set(values).size).toBe(4);
    expect(values.every(option => Number.isInteger(option) && option >= 1 && option <= 81)).toBe(true);
    expect(values.filter(option => option === answer)).toHaveLength(1);

    await buttons.filter({hasText: new RegExp(`^${answer}$`)}).click();
    await expect(page.locator('#fill-result')).toContainText('答对了');
    await expect(page.locator('#fill-result')).toHaveText('', {timeout: 3000});
    await expect(buttons).toHaveCount(4);
  });

  test(`看积找口诀随机值 ${value} 有限生成并保留正确口诀`, async ({page}) => {
    await openWithFixedRandom(page, value);
    await page.locator('.mode-tab[data-mode="product"]').click();
    const buttons = page.locator('#product-options .product-opt');
    await expect(buttons).toHaveCount(4);
    const product = Number(await page.locator('#product-display').innerText());
    const pairs = (await buttons.allTextContents()).map(label => {
      const match = label.replace(/\s+/g, '').match(/^(\d+)×(\d+)$/);
      if (!match) throw new Error(`无法解析口诀选项：${label}`);
      return [Number(match[1]), Number(match[2])];
    });
    const pairKey = ([a, b]) => `${a}×${b}`;
    expect(new Set(pairs.map(pairKey)).size).toBe(4);
    expect(pairs.every(([a, b]) => a >= 1 && a <= b && b <= 9)).toBe(true);

    const expectedCorrect = [];
    for (let a = 1; a <= 9; a++) {
      for (let b = a; b <= 9; b++) {
        if (a * b === product) expectedCorrect.push([a, b]);
      }
    }
    if (value === 0.4) expect(expectedCorrect.length).toBeGreaterThan(1);
    const actualCorrect = pairs.filter(([a, b]) => a * b === product).map(pairKey).sort();
    expect(actualCorrect).toEqual(expectedCorrect.map(pairKey).sort());

    await buttons.filter({hasText: new RegExp(`^${pairKey(expectedCorrect[0])}$`)}).click();
    await expect(page.locator('#product-result')).toContainText('🎉');
    await expect(page.locator('#product-result')).toHaveText('', {timeout: 3000});
    await expect(buttons).toHaveCount(4);
  });
}
