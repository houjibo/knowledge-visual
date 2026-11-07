const {test, expect} = require('@playwright/test');

test('扇形图滑块始终组成整体并提示人数估算', async ({page}) => {
  await page.goto('/math/topics/sector-statistics/index.html');
  await page.getByRole('button', {name: /探索/}).click();
  const football = page.getByLabel('⚽ 足球');
  const basketball = page.getByLabel('🏀 篮球');
  await football.focus();
  await page.keyboard.press('End');
  await basketball.focus();
  await page.keyboard.press('End');
  expect(Number(await football.inputValue()) + Number(await basketball.inputValue())).toBeLessThanOrEqual(100);
  const entries = await page.locator('#legendList .legend-item').allTextContents();
  const percentages = entries.map(text => Number(text.match(/：(\d+)%/)[1]));
  expect(percentages.reduce((a, b) => a + b, 0)).toBe(100);
  expect(percentages.every(value => value >= 0)).toBe(true);
  await expect(page.locator('#factLine')).toContainText('估算');
  await expect(page.locator('#factLine')).toContainText('可能有偏差');
});

test('扇形图题目在边界随机值下有限生成且数学关系正确', async ({page}) => {
  await page.goto('/math/topics/sector-statistics/index.html');
  const results = await page.evaluate(() => {
    const questions = [];
    const original = Math.random;
    try {
      for (let scenario = 0; scenario < 3; scenario++) {
        for (let total = 0; total < 4; total++) {
          for (let percent = 0; percent < 9; percent++) {
            for (const kind of [0.1, 0.9]) {
              const sequence = [(scenario + 0.01) / 3, (total + 0.01) / 4, (percent + 0.01) / 9, kind];
              let i = 0;
              Math.random = () => sequence[i++] ?? 0;
              questions.push(window.genQ());
            }
          }
        }
      }
    } finally { Math.random = original; }
    return questions;
  });
  expect(results).toHaveLength(216);
  for (const item of results) {
    const total = Number(item.q.match(/共 (\d+)/)[1]);
    expect(Number.isInteger(item.ans)).toBe(true);
    expect(new Set(item.opts).size).toBe(4);
    expect(item.opts).toContain(item.ans);
    expect(item.opts.every(value => Number.isInteger(value) && value > 0 && value <= (item.unit === '%' ? 100 : total))).toBe(true);
    const part = item.q.match(/其中一类有 ([\d.]+)/);
    if (part) {
      expect(Number.isInteger(Number(part[1]))).toBe(true);
      expect(Number(part[1]) / total * 100).toBeCloseTo(item.ans, 8);
    } else {
      const percent = Number(item.q.match(/占 (\d+)%/)[1]);
      expect(total * percent / 100).toBe(item.ans);
    }
  }
  await page.getByRole('button', {name: /练习/}).click();
  await page.evaluate(() => { Math.random = () => 0; });
  await page.locator('#practiceNext').click();
  await expect(page.locator('#practiceOpts button')).toHaveCount(4);
  await page.locator('#practiceOpts button').filter({hasText: /^4 人$/}).click();
  await expect(page.locator('#practiceFb')).toContainText('答对');
});
