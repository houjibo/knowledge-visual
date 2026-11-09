const {test, expect} = require('@playwright/test');

const url = '/math/topics/set-overlap/index.html';
const zeroOverlapSequence = [0, 0, 0, 0, 0.9];

async function useRandomSequence(page, values, fallback = 0) {
  await page.evaluate(({sequence, defaultValue}) => {
    let index = 0;
    Math.random = () => sequence[index++] ?? defaultValue;
  }, {sequence: values, defaultValue: fallback});
}

async function verifyOptions(page, selector, answer) {
  const buttons = page.locator(selector + ' .answer-btn');
  await expect(buttons).toHaveCount(4);
  const values = (await buttons.allTextContents()).map(text => Number.parseInt(text, 10));
  expect(values.every(Number.isInteger)).toBe(true);
  expect(new Set(values).size).toBe(4);
  expect(values.filter(value => value === answer)).toHaveLength(1);
  return buttons.filter({hasText: new RegExp('^' + answer + ' 人$')});
}

for (const mode of ['practice', 'challenge']) {
  for (const scenario of [
    {name: '固定随机值', sequence: [], fallback: 0, answer: 10},
    {name: '零重叠答案', sequence: zeroOverlapSequence, fallback: 0.9, answer: 0},
  ]) {
    test(`${mode}模式${scenario.name}仍可生成并正确作答`, async ({page}) => {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(url);
      await page.locator('.mode-tab[data-mode="' + mode + '"]').click();
      await useRandomSequence(page, scenario.sequence, scenario.fallback);
      if (mode === 'practice') {
        await page.locator('#practiceNext').click({timeout: 2500});
        await expect(page.locator('#practiceText')).toContainText(scenario.answer === 0 ? '两组都参加的有多少人' : '一共有多少人');
        const correct = await verifyOptions(page, '#practiceOpts', scenario.answer);
        await correct.click();
        await expect(page.locator('#practiceFb')).toContainText('✅ 答对啦！');
        await expect(page.locator('#streak')).toHaveText('1');
      } else {
        await page.locator('#challengeStart').click({timeout: 2500});
        await expect(page.locator('#chText')).toContainText(scenario.answer === 0 ? '两组都参加的有多少人' : '一共有多少人');
        const correct = await verifyOptions(page, '#chOpts', scenario.answer);
        await correct.click();
        await expect(page.locator('#chCorrect')).toHaveText('1');
        await expect(page.locator('#chWrong')).toHaveText('0');
        await expect(page.locator('#chText')).toContainText('第 2 题', {timeout: 2500});
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(errors).toEqual([]);
    });
  }
}

test('320px 窄屏的练习与挑战选项均可见且没有横向溢出', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.goto(url);
  await page.locator('.mode-tab[data-mode="practice"]').click();
  await useRandomSequence(page, [], 0);
  await page.locator('#practiceNext').click({timeout: 2500});
  await verifyOptions(page, '#practiceOpts', 10);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await page.locator('.mode-tab[data-mode="challenge"]').click();
  await useRandomSequence(page, [], 0);
  await page.locator('#challengeStart').click({timeout: 2500});
  await verifyOptions(page, '#chOpts', 10);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
