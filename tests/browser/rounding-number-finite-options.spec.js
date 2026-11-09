const { test, expect } = require('@playwright/test');

const url = '/math/topics/rounding-numbers/index.html';
const randomValues = [0, 0.5, 0.8, 0.999999];

function parseFormattedNumber(value) {
  return Number(value.replace(/,/g, ''));
}

function parseRoundOption(value) {
  if (value.endsWith('亿')) return Number(value.slice(0, -1)) * 100000000;
  if (value.endsWith('万')) return Number(value.slice(0, -1)) * 10000;
  return parseFormattedNumber(value);
}

function expectedRoundAnswer(number, target) {
  const unit = target.includes('亿位') ? 100000000 : target.includes('万位') ? 10000 : 1000;
  const rounded = Math.floor(number / unit + 0.5) * unit;
  if (unit === 100000000) return `${rounded / unit}亿`;
  if (unit === 10000) return `${rounded / unit}万`;
  return rounded.toLocaleString('zh-CN');
}

function expectedAppAnswer(question, highlights) {
  if (question.includes('用"万"作单位约是')) {
    return `${parseFormattedNumber(highlights[0]) / 10000}万`;
  }
  if (question.includes('哪个数最接近')) {
    return `${Math.round(parseFormattedNumber(highlights[0]) / 10000)}万`;
  }
  const priceInTenThousands = Number(highlights[0].replace('万', ''));
  const count = Number(highlights[1]);
  return `${priceInTenThousands * count}万元`;
}

async function expectFourUniqueOptions(locator, answer, parseOption) {
  const labels = (await locator.allTextContents()).map(label => label.trim());
  expect(labels).toHaveLength(4);
  expect(new Set(labels).size).toBe(4);
  expect(labels.filter(label => label === answer)).toHaveLength(1);
  return labels.map(parseOption);
}

async function watchForOptionUpdates(page, selector) {
  await page.evaluate(optionsSelector => {
    const container = document.querySelector(optionsSelector);
    window.__optionRenders = 0;
    new MutationObserver(records => {
      if (records.some(record => record.type === 'childList')) window.__optionRenders += 1;
    }).observe(container, { childList: true });
  }, selector);
}

async function expectNextQuestion(page) {
  await expect.poll(() => page.evaluate(() => window.__optionRenders)).toBeGreaterThan(0);
}

for (const value of randomValues) {
  test(`固定随机值 ${value} 下近似数练习能加载、答题并继续`, async ({ page }) => {
    await page.addInitScript(seed => { Math.random = () => seed; }, value);
    const response = await page.goto(url, { timeout: 2500 });
    expect(response.status()).toBe(200);

    const roundNumber = parseFormattedNumber(await page.locator('#round-num').textContent());
    const roundTarget = await page.locator('#round-target').textContent();
    const roundAnswer = expectedRoundAnswer(roundNumber, roundTarget);
    const roundOptions = page.locator('#round-options .round-opt');
    const roundValues = await expectFourUniqueOptions(roundOptions, roundAnswer, parseRoundOption);
    const roundUnit = roundTarget.includes('亿位') ? 100000000 : roundTarget.includes('万位') ? 10000 : 1000;
    expect(roundValues.every(option => Math.abs(option - parseRoundOption(roundAnswer)) <= 3 * roundUnit)).toBe(true);

    await page.locator('[data-mode="round"]').click();
    await watchForOptionUpdates(page, '#round-options');
    await page.getByRole('button', { name: roundAnswer, exact: true }).click();
    await expect(page.locator('#round-correct')).toHaveText('1');
    await expectNextQuestion(page);
    await expect(page.locator('#round-options .round-opt')).toHaveCount(4);

    const appQuestion = await page.locator('#app-question').innerText();
    const appHighlights = await page.locator('#app-question .highlight-num').allTextContents();
    const appAnswer = expectedAppAnswer(appQuestion, appHighlights.map(value => value.trim()));
    const appOptions = page.locator('#app-options .app-opt');
    const appLabels = (await appOptions.allTextContents()).map(label => label.trim());
    expect(appLabels).toHaveLength(4);
    expect(new Set(appLabels).size).toBe(4);
    expect(appLabels.filter(label => label === appAnswer)).toHaveLength(1);

    if (appQuestion.includes('用"万"作单位约是')) {
      const answer = Number(appAnswer.replace('万', ''));
      const values = appLabels.map(label => Number(label.replace('万', '')));
      expect(values.every(option => Math.abs(option - answer) <= 3)).toBe(true);
    } else if (appQuestion.includes('哪个数最接近')) {
      const answer = Number(appAnswer.replace('万', ''));
      const values = appLabels.map(label => Number(label.replace('万', '')));
      expect(values.every(option => Math.abs(option - answer) <= 5)).toBe(true);
    } else {
      const answer = Number(appAnswer.replace('万元', ''));
      const price = Number(appHighlights[0].trim().replace('万', ''));
      const values = appLabels.map(label => Number(label.replace('万元', '')));
      expect(values.every(option => option > 0 && Math.abs(option - answer) <= 2 * price)).toBe(true);
      expect(values.every(option => Number.isInteger((option - answer) / price))).toBe(true);
    }

    await page.locator('[data-mode="app"]').click();
    await watchForOptionUpdates(page, '#app-options');
    await page.getByRole('button', { name: appAnswer, exact: true }).click();
    await expect(page.locator('#app-correct')).toHaveText('1');
    await expectNextQuestion(page);
    await expect(page.locator('#app-options .app-opt')).toHaveCount(4);
  });
}

test('320px 窄屏下近似数与应用选项没有横向溢出', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.addInitScript(() => { Math.random = () => 0.5; });
  await page.goto(url, { timeout: 2500 });

  for (const [mode, selector] of [['round', '#round-options .round-opt'], ['app', '#app-options .app-opt']]) {
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
