const {test, expect} = require('@playwright/test');
const url = '/math/topics/hours-minutes-seconds/index.html';

for (const value of [0, 0.999999]) {
  test(`固定随机值 ${value} 下页面和练习均可生成`, async ({page}) => {
    await page.addInitScript(v => { Math.random = () => v; }, value);
    await page.goto(url);
    await page.locator('[data-mode="elapsed"]').click();
    const elapsed = page.locator('#elapsed-options button');
    await expect(elapsed).toHaveCount(4);
    expect(new Set(await elapsed.allTextContents()).size).toBe(4);
    await page.locator('[data-mode="sort"]').click();
    const items = page.locator('#sort-pool button');
    expect(await items.count()).toBeGreaterThanOrEqual(3);
    expect(new Set(await items.allTextContents()).size).toBe(await items.count());
    await page.locator('[data-mode="challenge"]').click();
    const options = page.locator('#challenge-options button');
    await expect(options).toHaveCount(4);
    expect(new Set(await options.allTextContents()).size).toBe(4);
  });
}

test('混合换算切换可继续，单题只计分一次', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await page.locator('[data-mode="convert"]').click();
  await page.locator('#convert-answer').fill('60');
  await page.locator('#convert-check').click();
  await page.locator('#convert-check').click();
  await expect(page.locator('#score')).toHaveText('10');
  await page.evaluate(() => { Math.random = () => 0.999999; });
  await page.locator('#convert-next').click();
  await expect(page.locator('#convert-row')).toContainText('分');
  await expect(page.locator('#convert-row')).toContainText('秒');
  await page.evaluate(() => { Math.random = () => 0; });
  await page.locator('#convert-next').click();
  await expect(page.locator('#convert-input')).toHaveValue('1');
  expect(errors).toEqual([]);
});

test('经过时间和挑战题一次作答后锁定，十次正确记录完成', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="elapsed"]').click();
  const elapsed = page.locator('#elapsed-options button');
  await elapsed.getByText('30分', {exact: true}).click();
  await expect(elapsed.first()).toBeDisabled();
  await expect(page.locator('#score')).toHaveText('10');
  await page.locator('[data-mode="challenge"]').click();
  for (let i = 0; i < 10; i++) {
    const opts = page.locator('#challenge-options button');
    await opts.getByText('60', {exact: true}).click();
    await expect(opts.first()).toBeDisabled();
    if (i < 9) await page.locator('#challenge-next').click();
  }
  await expect(page.locator('#score')).toHaveText('110');
  expect(await page.evaluate(() => PageProgress.isDone('hours-minutes-seconds'))).toBe(true);
  await page.reload();
  expect(await page.evaluate(() => PageProgress.isDone('hours-minutes-seconds'))).toBe(true);
});

test('四类挑战均有四个不同选项，比较题只有一个正确关系', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="challenge"]').click();
  for (const value of [0, 0.25, 0.5, 0.75]) {
    await page.evaluate(v => { Math.random = () => v; }, value);
    await page.locator('#challenge-next').click();
    const options = await page.locator('#challenge-options button').allTextContents();
    expect(options).toHaveLength(4);
    expect(new Set(options).size).toBe(4);
    if (value === 0.75) {
      const seconds = text => {
        const value = unit => Number(text.match(new RegExp('(\\d+)' + unit))?.[1] || 0);
        return value('时') * 3600 + value('分') * 60 + value('秒');
      };
      const truths = options.map(option => {
        const [left, operator, right] = option.split(' ');
        return operator === '<' ? seconds(left) < seconds(right) : operator === '>' ? seconds(left) > seconds(right) : seconds(left) === seconds(right);
      });
      expect(truths.filter(Boolean)).toHaveLength(1);
    }
  }
});

test('完成时存储失败提示重试，恢复后记录可刷新', async ({page}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('denied'); };
  });
  await page.goto(url);
  await page.locator('[data-mode="challenge"]').click();
  for (let i = 0; i < 10; i++) {
    await page.locator('#challenge-options button').getByText('60', {exact: true}).click();
    if (i < 9) await page.locator('#challenge-next').click();
  }
  await expect(page.locator('#math-progress-save-notice')).toContainText('暂未保存');
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
  await page.locator('#math-progress-save-notice button').click();
  await expect(page.locator('#math-progress-save-notice')).toContainText('已保存');
  await page.reload();
  expect(await page.evaluate(() => PageProgress.isDone('hours-minutes-seconds'))).toBe(true);
});

test('时钟跨午夜归零，排序正确后不能重复加分', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.evaluate(() => {
    for (let i = 0; i < 23; i++) document.getElementById('exp-add1h').click();
    for (let i = 0; i < 60; i++) document.getElementById('exp-add1m').click();
  });
  await expect(page.locator('#exp-time-display')).toHaveText('00:00:00');
  await page.locator('[data-mode="sort"]').click();
  const values = await page.locator('#sort-pool button').allTextContents();
  const seconds = text => {
    const unit = u => Number(text.match(new RegExp('(\\d+)' + u))?.[1] || 0);
    return unit('时') * 3600 + unit('分') * 60 + unit('秒');
  };
  for (const value of values.sort((a, b) => seconds(a) - seconds(b)))
    await page.locator('#sort-pool button').getByText(value, {exact: true}).click();
  await page.locator('#sort-check').click();
  await expect(page.locator('#sort-feedback')).toContainText('完全正确');
  await expect(page.locator('#sort-check')).toBeDisabled();
  await expect(page.locator('#score')).toHaveText('15');
});
