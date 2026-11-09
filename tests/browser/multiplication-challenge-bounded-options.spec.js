const {test, expect} = require('@playwright/test');

const url = '/math/topics/multiplication/index.html';

async function readOptions(page) {
  const buttons = page.locator('#challenge-options .challenge-opt');
  await expect(buttons).toHaveCount(4);
  const values = (await buttons.allTextContents()).map(Number);
  expect(values.every(value => Number.isInteger(value) && value >= 1 && value <= 81)).toBe(true);
  expect(new Set(values).size).toBe(4);
  const [a, b] = (await page.locator('#challenge-problem').innerText()).match(/\d+/g).map(Number);
  const answer = a * b;
  expect(values.filter(value => value === answer)).toHaveLength(1);
  return {buttons, answer};
}

for (const seed of [0, 0.999999]) {
  test(`固定随机值 ${seed} 下乘法挑战生成完整选项并继续下一题`, async ({page}) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install();
    await page.goto(url);
    await page.locator('.mode-tab[data-mode="challenge"]').click();
    await page.evaluate(value => { Math.random = () => value; }, seed);
    await page.locator('#btn-start-challenge').click({timeout: 2500});

    let {buttons, answer} = await readOptions(page);
    await buttons.filter({hasText: new RegExp('^' + answer + '$')}).click();
    await expect(page.locator('#ch-correct')).toHaveText('1');
    await page.clock.fastForward(800);
    await expect(page.locator('#challenge-options .challenge-opt.correct')).toHaveCount(0);
    ({buttons, answer} = await readOptions(page));
    expect(await page.locator('#ch-correct').innerText()).toBe('1');
    expect(errors).toEqual([]);
  });
}

test('320px 窄屏下四个乘法选项均可见且页面无横向溢出', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.goto(url);
  await page.locator('.mode-tab[data-mode="challenge"]').click();
  await page.evaluate(() => { Math.random = () => 0; });
  await page.locator('#btn-start-challenge').click({timeout: 2500});
  const {buttons} = await readOptions(page);
  for (let index = 0; index < await buttons.count(); index++) {
    await expect(buttons.nth(index)).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
