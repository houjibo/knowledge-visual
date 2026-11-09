const { test, expect } = require('@playwright/test');

const url = '/math/topics/addition-subtraction-within-100/index.html';
const randomValues = [0, 0.5, 0.999999];

function parseProblem(text) {
  const match = text.match(/^(\d+)\s*([+−])\s*(\d+)/);
  if (!match) throw new Error(`无法解析挑战算式：${text}`);
  const a = Number(match[1]);
  const b = Number(match[3]);
  return { a, b, answer: match[2] === '+' ? a + b : a - b };
}

async function expectChallengeOptions(page) {
  const problem = parseProblem(await page.locator('#ch-problem').textContent());
  const options = page.locator('#ch-options .challenge-opt');
  const values = (await options.allTextContents()).map(value => Number(value.trim()));

  expect(values).toHaveLength(4);
  expect(new Set(values).size).toBe(4);
  expect(values.every(value => Number.isInteger(value) && value >= 0)).toBe(true);
  expect(values.filter(value => value === problem.answer)).toHaveLength(1);
  expect(values.every(value => Math.abs(value - problem.answer) <= 10)).toBe(true);
  return { problem, options };
}

async function observeNextOptions(page) {
  await page.evaluate(() => {
    const container = document.querySelector('#ch-options');
    window.__challengeOptionRenders = 0;
    new MutationObserver(records => {
      if (records.some(record => record.type === 'childList')) window.__challengeOptionRenders++;
    }).observe(container, { childList: true });
  });
}

for (const value of randomValues) {
  test(`固定随机值 ${value} 下限时挑战可启动、作答并继续`, async ({ page }) => {
    await page.clock.install();
    await page.addInitScript(seed => { Math.random = () => seed; }, value);
    const response = await page.goto(url, { timeout: 2500 });
    expect(response.status()).toBe(200);

    await page.locator('.mode-tab[data-mode="challenge"]').click();
    await page.locator('#ch-start').click({ timeout: 2500 });
    const { problem, options } = await expectChallengeOptions(page);

    await observeNextOptions(page);
    await page.getByRole('button', { name: String(problem.answer), exact: true }).click();
    await expect(page.locator('#ch-correct')).toHaveText('1');
    await page.clock.fastForward(1500);
    await expect.poll(() => page.evaluate(() => window.__challengeOptionRenders)).toBeGreaterThan(0);

    const next = await expectChallengeOptions(page);
    expect(next.problem.answer).toBe(problem.answer);
    await expect(options).toHaveCount(4);
  });
}

test('320px 窄屏下限时挑战选项可见且有触控高度', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.addInitScript(() => { Math.random = () => 0.5; });
  await page.goto(url, { timeout: 2500 });
  await page.locator('.mode-tab[data-mode="challenge"]').click();
  await page.locator('#ch-start').click({ timeout: 2500 });

  const boxes = await page.locator('#ch-options .challenge-opt').evaluateAll(nodes => nodes.map(node => {
    const box = node.getBoundingClientRect();
    return { left: box.left, right: box.right, height: box.height };
  }));
  expect(boxes).toHaveLength(4);
  for (const box of boxes) {
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(320);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
});
