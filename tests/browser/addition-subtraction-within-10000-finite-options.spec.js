const { test, expect } = require('@playwright/test');

const url = '/math/topics/addition-subtraction-within-10000/index.html';
const randomValues = [0, 0.5, 0.999999];

function parseProblem(text, suffix) {
  const match = text.match(/^(\d+)\s*([+−])\s*(\d+)/);
  if (!match) throw new Error(`无法解析${suffix}题目：${text}`);
  const a = Number(match[1]);
  const b = Number(match[3]);
  return { a, b, exact: match[2] === '+' ? a + b : a - b };
}

function expectedEstimate({ a, b, exact }, problemText) {
  const operator = problemText.includes('+') ? 1 : -1;
  return Math.round(a / 100) * 100 + operator * Math.round(b / 100) * 100;
}

async function observeOptions(page, selector) {
  await page.evaluate(optionsSelector => {
    const container = document.querySelector(optionsSelector);
    window.__optionRenders = 0;
    new MutationObserver(records => {
      if (records.some(record => record.type === 'childList')) window.__optionRenders += 1;
    }).observe(container, { childList: true });
  }, selector);
}

async function expectNextOptions(page, selector) {
  await expect.poll(() => page.evaluate(() => window.__optionRenders)).toBeGreaterThan(0);
  await expect(page.locator(selector)).toHaveCount(4);
}

for (const value of randomValues) {
  test(`固定随机值 ${value} 下挑战和估算可加载、答题并继续`, async ({ page }) => {
    await page.addInitScript(seed => { Math.random = () => seed; }, value);
    const response = await page.goto(url, { timeout: 2500 });
    expect(response.status()).toBe(200);

    await page.locator('[data-mode="choice"]').click();
    const choiceProblemText = await page.locator('#choiceProblem').textContent();
    const choiceProblem = parseProblem(choiceProblemText, '选择挑战');
    const choiceOptions = page.locator('#choiceOptions .choice-btn');
    const choiceLabels = (await choiceOptions.allTextContents()).map(label => label.trim());
    const choiceValues = choiceLabels.map(Number);
    expect(choiceValues).toHaveLength(4);
    expect(new Set(choiceValues).size).toBe(4);
    expect(choiceValues.every(option => Number.isInteger(option) && option >= 0)).toBe(true);
    expect(choiceValues).toContain(choiceProblem.exact);
    expect(choiceValues.filter(option => option === choiceProblem.exact)).toHaveLength(1);
    expect(choiceValues.every(option => Math.abs(option - choiceProblem.exact) <= 200)).toBe(true);

    await observeOptions(page, '#choiceOptions');
    await page.getByRole('button', { name: String(choiceProblem.exact), exact: true }).click();
    await expect(page.locator('#choiceScore')).toHaveText('1');
    await expectNextOptions(page, '#choiceOptions .choice-btn');

    await page.locator('[data-mode="estimate"]').click();
    const estimateText = await page.locator('#estProblem').textContent();
    const estimateProblem = parseProblem(estimateText, '估算');
    const correctEstimate = expectedEstimate(estimateProblem, estimateText);
    const estimateOptions = page.locator('#estOptions .est-btn');
    const estimateLabels = (await estimateOptions.allTextContents()).map(label => label.trim());
    const estimateValues = estimateLabels.map(Number);
    expect(estimateValues).toHaveLength(4);
    expect(new Set(estimateValues).size).toBe(4);
    expect(estimateValues.every(option => Number.isInteger(option) && option >= 0)).toBe(true);
    expect(estimateValues.filter(option => option === correctEstimate)).toHaveLength(1);
    if (estimateProblem.exact !== correctEstimate) expect(estimateValues).toContain(estimateProblem.exact);
    expect(estimateValues.every(option => Math.abs(option - estimateProblem.exact) <= 500)).toBe(true);

    await observeOptions(page, '#estOptions');
    await page.getByRole('button', { name: String(correctEstimate), exact: true }).click();
    await expect(page.locator('#estScore')).toHaveText('1');
    await expectNextOptions(page, '#estOptions .est-btn');
  });
}

test('320px 窄屏下挑战与估算选项保持可见且可触控', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url, { timeout: 2500 });

  for (const [mode, selector] of [['choice', '#choiceOptions .choice-btn'], ['estimate', '#estOptions .est-btn']]) {
    await page.locator(`[data-mode="${mode}"]`).click();
    const boxes = await page.locator(selector).evaluateAll(nodes => nodes.map(node => {
      const box = node.getBoundingClientRect();
      return { left: box.left, right: box.right, height: box.height };
    }));
    expect(boxes).toHaveLength(4);
    for (const box of boxes) {
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(320);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  }
});
