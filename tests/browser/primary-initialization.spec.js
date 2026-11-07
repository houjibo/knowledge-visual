const {test, expect} = require('@playwright/test');

async function observeErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  return errors;
}

test('负数主题初始化温度演示', async ({page}) => {
  const errors = await observeErrors(page);
  await page.goto('/math/topics/negative-numbers/index.html');
  await expect(page.locator('#temp-slider')).toBeVisible();
  await expect(page.locator('#temp-label')).toContainText('零下');
  expect(errors).toEqual([]);
});

test('序数主题完成初始化并可打开填空', async ({page}) => {
  const errors = await observeErrors(page);
  await page.goto('/math/topics/ordinal-numbers/index.html');
  await expect(page.locator('#learnItems .item-card').first()).toBeVisible();
  await expect(page.locator('#fillItems .item-card').first()).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('平均分边界题目生成有效选项且可以答对', async ({page}) => {
  const errors = await observeErrors(page);
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto('/math/topics/equal-sharing/index.html');
  await page.locator('.mode-tab[data-mode="share"]').click();
  const options = page.locator('#share-options .share-opt');
  await expect(options).toHaveCount(4);
  expect(new Set(await options.allTextContents()).size).toBe(4);
  await page.locator('#share-options .share-opt[data-value="2"]').click();
  await expect(page.locator('#share-feedback')).toContainText('答对');
  await page.locator('.mode-tab[data-mode="fill"]').click();
  const fillOptions = page.locator('#fill-options .fill-opt');
  await expect(fillOptions).toHaveCount(4);
  expect(new Set(await fillOptions.allTextContents()).size).toBe(4);
  await page.locator('#fill-options .fill-opt[data-value="2"]').click();
  await expect(page.locator('#fill-feedback')).toContainText('答对');
  expect(errors).toEqual([]);
});

test('质量换算 500 克生成四个选项且 0.5 千克正确', async ({page}) => {
  const errors = await observeErrors(page);
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto('/math/topics/weight-units/index.html');
  await page.locator('.mode-tab[data-mode="convert"]').click();
  await expect(page.locator('.convert-problem')).toContainText('500 克');
  const options = page.locator('#convert-opts .convert-opt');
  await expect(options).toHaveCount(4);
  expect(new Set(await options.allTextContents()).size).toBe(4);
  await page.locator('.convert-opt[data-val="0.5"]').click();
  await expect(page.locator('#convert-result')).toContainText('答对');
  expect(errors).toEqual([]);
});

for (const [randomValue, expected] of [[0, 1], [0.999999, 50]]) {
  test(`认识数字边界 ${expected} 生成完整题目`, async ({page}) => {
    const errors = await observeErrors(page);
    await page.addInitScript(value => { Math.random = () => value; }, randomValue);
    await page.goto('/math/topics/numbers/index.html');
    await page.locator('#btn-more').click();
    await expect(page.locator('#count-num')).toHaveText('1');
    const left = Number(await page.locator('#cmp-left').textContent());
    const right = Number(await page.locator('#cmp-right').textContent());
    expect(left).toBeGreaterThanOrEqual(1);
    expect(left).toBeLessThanOrEqual(50);
    expect(right).toBeGreaterThanOrEqual(1);
    expect(right).toBeLessThanOrEqual(50);
    expect(right).not.toBe(left);
    await page.locator('.mode-tab[data-mode="find"]').click();
    await expect(page.locator('#find-target')).toHaveText(String(expected));
    const cells = page.locator('#find-grid .find-cell');
    await expect(cells).toHaveCount(12);
    const values = (await cells.allTextContents()).map(Number);
    expect(new Set(values).size).toBe(12);
    expect(values.every(value => value >= 1 && value <= 50)).toBe(true);
    expect(values).toContain(expected);
    await cells.filter({hasText: new RegExp(`^${expected}$`)}).click();
    await expect(page.getByText(`🎉 找到了 ${expected}！`)).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('两个数字的搭配题有四个选项且答案正确', async ({page}) => {
  const errors = await observeErrors(page);
  await page.addInitScript(() => { Math.random = () => 0.4; });
  await page.goto('/math/topics/pairing-combinations/index.html');
  await page.locator('.mode-tab[data-mode="quiz"]').click();
  await expect(page.locator('#quiz-question')).toContainText('两位数');
  const options = page.locator('#quiz-options .quiz-opt');
  await expect(options).toHaveCount(4);
  expect(new Set(await options.allTextContents()).size).toBe(4);
  await options.filter({hasText: /^2$/}).click();
  await expect(page.locator('#quiz-feedback')).toContainText('答对');
  expect(errors).toEqual([]);
});

test('四人排队的间隔题生成四个选项且答案正确', async ({page}) => {
  const errors = await observeErrors(page);
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto('/math/topics/position-basic/index.html');
  // generateQueue: count, seven shuffle calls, then question type.
  await page.evaluate(() => {
    let calls = 0;
    const original = Math.random;
    Math.random = () => calls++ === 8 ? 0.5 : 0;
    try { window.generateQueue(); } finally { Math.random = original; }
  });
  await page.locator('.mode-tab[data-mode="queue"]').click();
  await expect(page.locator('#queue-question')).toContainText('之间有几个');
  await expect(page.locator('#queue-box .queue-person')).toHaveCount(4);
  const options = page.locator('#queue-options .queue-opt');
  await expect(options).toHaveCount(4);
  expect(new Set(await options.allTextContents()).size).toBe(4);
  await options.filter({hasText: /^1$/}).click();
  await expect(page.locator('#queue-result')).toContainText('正确');
  expect(errors).toEqual([]);
});

test('二分之一与二分之一可加载并通过等号得分', async ({page}) => {
  const errors = await observeErrors(page);
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto('/math/topics/fractions/index.html');
  await page.locator('.mode-tab[data-mode="compare"]').click();
  await page.locator('#btn-start-challenge').click();
  await expect(page.locator('#compare-fracs .num')).toHaveText(['1', '1']);
  await expect(page.locator('#compare-fracs .den')).toHaveText(['2', '2']);
  await page.locator('#compare-opts .challenge-opt[data-ans="eq"]').click();
  await expect(page.locator('#ch-correct')).toHaveText('1');
  expect(errors).toEqual([]);
});
