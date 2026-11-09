const {test, expect} = require('@playwright/test');

const url = '/math/topics/decimal-addition-subtraction/index.html';

async function verifyAppQuestion(page, isAddition) {
  const question = await page.locator('#app-problem').innerText();
  const numbers = (question.match(/[\d]+(?:\.[\d]+)?/g) || []).map(Number);
  expect(numbers).toHaveLength(2);

  const options = page.locator('#app-options button');
  await expect(options).toHaveCount(4);
  const values = await options.evaluateAll(nodes => nodes.map(node => ({
    value: Number(node.dataset.val),
    correct: Number(node.dataset.correct),
  })));
  expect(new Set(values.map(item => item.value)).size).toBe(4);
  expect(values.filter(item => item.value === item.correct)).toHaveLength(1);
  expect(values[0].correct).toBeCloseTo(
    isAddition ? numbers[0] + numbers[1] : numbers[0] - numbers[1],
    4,
  );

  if (isAddition) {
    const match = question.match(/的([^，。]+)，又买了[\s\S]*?的([^，。]+)。/);
    expect(match).not.toBeNull();
    expect(match[1].trim()).not.toBe(match[2].trim());
  }
}

const challengeCases = [
  {roll: 0.01, type: '比较大小'},
  {roll: 0.3, type: '补全等式'},
  {roll: 0.55, type: '估算'},
  {roll: 0.8, type: '逆运算'},
];

for (const {roll, type} of challengeCases) {
  test('重复随机值下' + type + '题有限生成且答案正确', async ({page}) => {
    await page.addInitScript(() => { Math.random = () => 0; });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url, {timeout: 2500});
    await page.evaluate(value => {
      let first = true;
      Math.random = () => {
        if (first) { first = false; return value; }
        return 0;
      };
      newChallenge();
    }, roll);

    const question = await page.locator('#challenge-problem').innerText();
    const options = page.locator('#challenge-options button');
    await expect(options).toHaveCount(4);
    const choices = await options.evaluateAll(nodes => nodes.map(node => ({
      value: node.textContent.trim(),
      correct: node.dataset.correct === '1',
    })));
    expect(new Set(choices.map(choice => choice.value)).size).toBe(4);
    expect(choices.filter(choice => choice.correct)).toHaveLength(1);

    let expected;
    if (type === '比较大小') {
      const match = question.match(/([\d.]+)\s*([+−])\s*([\d.]+)\s*○\s*([\d.]+)/);
      expect(match).not.toBeNull();
      const left = match[2] === '+' ? Number(match[1]) + Number(match[3]) : Number(match[1]) - Number(match[3]);
      const right = Number(match[4]);
      expected = left > right ? '>' : (left < right ? '<' : '=');
    } else if (type === '补全等式') {
      const match = question.match(/([\d.]+)\s*\+\s*\?\s*=\s*([\d.]+)/);
      expect(match).not.toBeNull();
      expected = Number(match[2]) - Number(match[1]);
    } else if (type === '估算') {
      const match = question.match(/([\d.]+)\s*\+\s*([\d.]+)\s*最接近/);
      expect(match).not.toBeNull();
      expected = Math.round((Number(match[1]) + Number(match[2])) / 10) * 10;
    } else {
      const match = question.match(/\?\s*−\s*([\d.]+)\s*=\s*([\d.]+)/);
      expect(match).not.toBeNull();
      expected = Number(match[1]) + Number(match[2]);
    }
    const correctChoice = choices.find(choice => choice.correct).value;
    if (typeof expected === 'string') expect(correctChoice).toBe(expected);
    else expect(Number(correctChoice)).toBeCloseTo(expected, 4);
    expect(errors).toEqual([]);
  });
}

for (const {roll, isAddition, label} of [
  {roll: 0, isAddition: false, label: '减法'},
  {roll: 0.999999, isAddition: true, label: '加法'},
]) {
  test('固定随机值下' + label + '应用题显示正确答案和唯一选项', async ({page}) => {
    await page.addInitScript(() => { Math.random = () => 0; });
    await page.goto(url, {timeout: 2500});
    await page.evaluate(value => { Math.random = () => value; newAppProblem(); }, roll);
    await verifyAppQuestion(page, isAddition);
  });
}

test('最小答案附近的有限候选能补足四个不同数值', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url, {timeout: 2500});
  const values = await page.evaluate(() => fillFiniteNumericOptions(['0.1'], 0.1, 0));
  expect(values).toHaveLength(4);
  expect(new Set(values.map(Number)).size).toBe(4);
  expect(values.map(Number).every(value => value >= 0)).toBe(true);
});

test('320px 窄屏应用题与挑战选项可见且无横向溢出', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url, {timeout: 2500});
  await expect(page.locator('#app-options button')).toHaveCount(4);
  await page.locator('.mode-tab[data-mode="challenge"]').click();
  await expect(page.locator('#challenge-options button')).toHaveCount(4);
  await expect(page.locator('#challenge-options button').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
