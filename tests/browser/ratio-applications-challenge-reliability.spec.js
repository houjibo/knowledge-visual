const { test, expect } = require('@playwright/test');

const url = '/math/topics/ratio-applications/index.html';
const randomValues = [0, 0.5, 0.999999];

async function readChallenge(page) {
  const prompt = await page.locator('#challengeText').innerText();
  const totalMatch = prompt.match(/一共[\s\S]*?了\s*(\d+)\s*(?:棵|个|颗|本|元)/u);
  const ratioMatch = prompt.match(/按\s*(\d+)\s*:\s*(\d+)/u);
  const personMatch = prompt.match(/(小明|小红)应该/u);
  expect(totalMatch).not.toBeNull();
  expect(ratioMatch).not.toBeNull();
  expect(personMatch).not.toBeNull();

  const total = Number(totalMatch[1]);
  const ratioA = Number(ratioMatch[1]);
  const ratioB = Number(ratioMatch[2]);
  const answer = total / (ratioA + ratioB) * (personMatch[1] === '小明' ? ratioA : ratioB);
  const options = await page.locator('#challengeOptions .challenge-option').evaluateAll(buttons =>
    buttons.map(button => {
      const match = button.textContent.match(/^([A-D])\.\s*(\d+)/u);
      return match ? { letter: match[1], value: Number(match[2]) } : null;
    }));

  expect(options).toHaveLength(4);
  expect(options.every(option => option !== null)).toBe(true);
  const values = options.map(option => option.value);
  expect(new Set(values).size).toBe(4);
  expect(values.every(value => Number.isInteger(value) && value > 0)).toBe(true);
  expect(values.every(value => Math.abs(value - answer) <= 10)).toBe(true);
  expect(values.filter(value => value === answer)).toHaveLength(1);
  return { prompt, answer, options, correctLetter: options.find(option => option.value === answer).letter };
}

for (const randomValue of randomValues) {
  test(`固定随机值 ${randomValue} 下挑战能加载、答题并生成下一题`, async ({ page }) => {
    await page.clock.install();
    await page.addInitScript(value => { Math.random = () => value; }, randomValue);
    const response = await page.goto(url, { timeout: 2500 });
    expect(response.status()).toBe(200);

    await page.locator('.mode-tab[data-mode="challenge"]').click();
    const challenge = await readChallenge(page);
    await page.locator(`.challenge-option[data-answer="${challenge.correctLetter}"]`).click();
    await expect(page.locator('#challengeFeedback')).toContainText('正确');
    await expect(page.locator('#challengeCorrect')).toHaveText('1');
    await expect(page.locator('#challengeWrong')).toHaveText('0');
    await expect(page.locator('#challengeOptions .challenge-option')).toHaveCount(4);
    for (const button of await page.locator('#challengeOptions .challenge-option').all()) {
      await expect(button).toBeDisabled();
    }

    await page.clock.fastForward(1500);
    await readChallenge(page);
    await expect(page.locator('#challengeCorrect')).toHaveText('1');
    await expect(page.locator('#challengeWrong')).toHaveText('0');
  });
}

test('错误作答只计一次并锁定挑战选项', async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => {
    const samples = [0, 0.2, 0.4, 0.6, 0.8, 0.1, 0.3, 0.5, 0.7, 0.9];
    let index = 0;
    Math.random = () => samples[index++ % samples.length];
  });
  await page.goto(url, { timeout: 2500 });
  await page.locator('.mode-tab[data-mode="challenge"]').click();
  const challenge = await readChallenge(page);
  const wrongOption = challenge.options.find(option => option.letter !== challenge.correctLetter);
  await page.locator(`.challenge-option[data-answer="${wrongOption.letter}"]`).click();
  await expect(page.locator('#challengeFeedback')).toContainText('答错');
  await expect(page.locator('#challengeCorrect')).toHaveText('0');
  await expect(page.locator('#challengeWrong')).toHaveText('1');
  await expect(page.locator(`.challenge-option[data-answer="${challenge.correctLetter}"]`)).toHaveClass(/correct/u);
  for (const button of await page.locator('#challengeOptions .challenge-option').all()) {
    await expect(button).toBeDisabled();
  }

  await page.clock.fastForward(1500);
  await readChallenge(page);
  await expect(page.locator('#challengeWrong')).toHaveText('1');
});

test('320px 窄屏下挑战选项可见且不横向溢出', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.addInitScript(() => { Math.random = () => 0.5; });
  await page.goto(url, { timeout: 2500 });
  await page.locator('.mode-tab[data-mode="challenge"]').click();
  await readChallenge(page);
  const boxes = await page.locator('#challengeOptions .challenge-option').evaluateAll(buttons =>
    buttons.map(button => {
      const box = button.getBoundingClientRect();
      return { left: box.left, right: box.right, height: box.height };
    }));
  expect(boxes).toHaveLength(4);
  for (const box of boxes) {
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(320);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
