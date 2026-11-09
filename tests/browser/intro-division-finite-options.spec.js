const { test, expect } = require('@playwright/test');

const url = '/math/topics/intro-to-division/index.html';
const randomValues = [0, 0.5, 0.8, 0.999999];

function expectedShareAnswer(prompt) {
  const match = prompt.match(/把\s*(\d+)\s*个.*?平均分给\s*(\d+)/);
  if (!match) throw new Error(`无法解析平均分题目：${prompt}`);
  return Number(match[1]) / Number(match[2]);
}

function expectedNearbyOptions(answer) {
  const options = [answer];
  for (let distance = 1; options.length < 3 && distance <= 8; distance += 1) {
    for (const candidate of [answer - distance, answer + distance]) {
      if (candidate >= 1 && candidate <= 9 && !options.includes(candidate)) options.push(candidate);
    }
  }
  return options.map(String).sort((a, b) => Number(a) - Number(b));
}

function expectedQuizAnswer(question) {
  let match = question.match(/^(\d+)\s*÷\s*(\d+)\s*=\s*？$/);
  if (match) return String(Number(match[1]) / Number(match[2]));

  match = question.match(/^(\d+)\s*÷\s*？\s*=\s*(\d+).*除数是多少/);
  if (match) return String(Number(match[1]) / Number(match[2]));

  match = question.match(/把\s*(\d+)\s*个苹果平均分给\s*(\d+)\s*个小朋友/);
  if (match) return `${match[1]} ÷ ${match[2]} = ${Number(match[1]) / Number(match[2])}`;

  throw new Error(`无法解析选择题：${question}`);
}

function expectedWriteAnswer(prompt) {
  let match = prompt.match(/把\s*(\d+)\s*个.*?平均分给\s*(\d+)/);
  if (match) return [Number(match[1]), Number(match[2]), Number(match[1]) / Number(match[2])];

  match = prompt.match(/(\d+)\s*个.*?每\s*(\d+)\s*个一份/);
  if (match) return [Number(match[1]), Number(match[1]) / Number(match[2]), Number(match[2])];

  match = prompt.match(/有\s*(\d+)\s*个.*?平均分成\s*(\d+)\s*份/);
  if (match) return [Number(match[1]), Number(match[2]), Number(match[1]) / Number(match[2])];

  throw new Error(`无法解析写算式题目：${prompt}`);
}

async function watchForNextOptions(page, selector) {
  await page.evaluate(optionsSelector => {
    const container = document.querySelector(optionsSelector);
    window.__optionRenders = 0;
    new MutationObserver(() => { window.__optionRenders += 1; })
      .observe(container, { childList: true });
  }, selector);
}

async function expectNextOptions(page, countSelector) {
  await expect.poll(() => page.evaluate(() => window.__optionRenders)).toBeGreaterThan(0);
  await expect(page.locator(countSelector)).toHaveCount(3);
}

for (const value of randomValues) {
  test(`固定随机值 ${value} 下除法练习可加载并生成唯一选项`, async ({ page }) => {
    await page.addInitScript(seed => { Math.random = () => seed; }, value);
    await page.goto(url, { timeout: 2500 });

    await page.locator('[data-mode="share"]').click();
    const sharePrompt = await page.locator('#share-problem').innerText();
    const shareOptions = page.locator('#share-options .share-opt');
    await expect(shareOptions).toHaveCount(3);
    const shareValues = await shareOptions.evaluateAll(nodes => nodes.map(node => node.dataset.val));
    const shareAnswer = String(expectedShareAnswer(sharePrompt));
    expect(new Set(shareValues).size).toBe(3);
    expect(shareValues.filter(value => value === shareAnswer)).toHaveLength(1);
    expect([...shareValues].sort((a, b) => Number(a) - Number(b))).toEqual(expectedNearbyOptions(Number(shareAnswer)));

    await watchForNextOptions(page, '#share-options');
    await page.locator(`#share-options .share-opt[data-val="${shareAnswer}"]`).click();
    await expect(page.locator('#share-correct')).toHaveText('1');
    await expectNextOptions(page, '#share-options .share-opt');

    await page.locator('[data-mode="quiz"]').click();
    const quizQuestion = await page.locator('#quiz-question').innerText();
    const quizOptions = page.locator('#quiz-options .quiz-opt');
    await expect(quizOptions).toHaveCount(3);
    const quizLabels = (await quizOptions.allTextContents()).map(label => label.trim());
    const quizAnswer = expectedQuizAnswer(quizQuestion);
    expect(new Set(quizLabels).size).toBe(3);
    expect(quizLabels.filter(label => label === quizAnswer)).toHaveLength(1);
    if (/^\d+\s*÷/.test(quizQuestion)) {
      expect([...quizLabels].sort((a, b) => Number(a) - Number(b))).toEqual(expectedNearbyOptions(Number(quizAnswer)));
    }

    await watchForNextOptions(page, '#quiz-options');
    await quizOptions.filter({ hasText: new RegExp(`^${quizAnswer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).click();
    await expect(page.locator('#quiz-correct')).toHaveText('1');
    await expectNextOptions(page, '#quiz-options .quiz-opt');

    await page.locator('[data-mode="write"]').click();
    const [total, divisor, quotient] = expectedWriteAnswer(await page.locator('#write-problem').innerText());
    await page.locator('#write-num1').fill(String(total));
    await page.locator('#write-num2').fill(String(divisor));
    await page.locator('#write-num3').fill(String(quotient));
    await page.locator('#write-check').click();
    await expect(page.locator('#write-correct')).toHaveText('1');
    await expect(page.locator('#write-feedback')).toContainText('完全正确');
  });
}

test('320px 窄屏下分一分选项保持完整可见', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.addInitScript(() => { Math.random = () => 0.5; });
  await page.goto(url);
  await page.locator('[data-mode="share"]').click();

  const boxes = await page.locator('#share-options .share-opt').evaluateAll(nodes => nodes.map(node => {
    const box = node.getBoundingClientRect();
    return { left: box.left, right: box.right, height: box.height };
  }));
  expect(boxes).toHaveLength(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  for (const box of boxes) {
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(320);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
});
