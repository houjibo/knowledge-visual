const {test, expect} = require('@playwright/test');
const url = '/math/topics/time-and-date/index.html';

for (const value of [0, 0.999999]) {
  test(`固定随机值 ${value} 时两类题目均可生成`, async ({page}) => {
    await page.addInitScript(v => { Math.random = () => v; }, value);
    await page.goto(url);
    for (const [mode, selector] of [['quiz', '#quiz-options button'], ['calc', '#calc-options button']]) {
      await page.locator(`[data-mode="${mode}"]`).click();
      const options = page.locator(selector);
      await expect(options).toHaveCount(4);
      expect(new Set(await options.allTextContents()).size).toBe(4);
    }
  });
}

async function setRandomSequence(page, values) {
  await page.evaluate(sequence => {
    const pending = [...sequence];
    Math.random = () => pending.length ? pending.shift() : 0;
  }, values);
}

test('整点、半点、减法和半小时题与答案一致', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="calc"]').click();
  for (const [values, question, correct] of [
    [[0, 0, 0], '1:00，过了 1 小时', '02:00'],
    [[0.26, 0, 0.99, 0], '2:30，过了 1 小时', '03:30'],
    [[0.51, 0, 0], '1:00，1 小时前', '12:00'],
    [[0.76, 0], '1:00，过了 30 分钟', '01:30'],
  ]) {
    await setRandomSequence(page, values);
    await page.locator('#btn-new-calc').click();
    await expect(page.locator('#calc-question')).toContainText(question);
    const options = page.locator('#calc-options button');
    await expect(options).toHaveCount(4);
    await options.getByText(correct, {exact: true}).click();
    await expect(page.locator('#calc-explain')).toContainText('✅');
    await expect(page.locator('#calc-explain')).toContainText(correct);
    await expect(options.first()).toBeDisabled();
  }
});

test('日历日期可用键盘选择，换月清除旧日期', async ({page}) => {
  await page.goto(url);
  await page.locator('[data-mode="calendar"]').click();
  const first = page.locator('#cal-grid button.cal-day').first();
  const label = await first.getAttribute('aria-label');
  await first.focus(); await page.keyboard.press('Enter');
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#date-info')).toContainText(label);
  await page.getByLabel('下个月').click();
  await expect(page.locator('#date-info')).toHaveText('选择日期查看详细信息');
});

test('实际时钟跨小时调整，作答不被定时器重置', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.clock.install({time: new Date('2026-11-08T03:58:00Z')});
  await page.goto(url);
  const actualHour = await page.evaluate(() => new Date().getHours());
  await page.locator('#btn-now').click();
  await page.locator('#btn-min-up').click();
  await expect(page.locator('#time-display')).toHaveText(`${String((actualHour + 1) % 12 || 12).padStart(2, '0')}:03`);
  await page.locator('[data-mode="quiz"]').click();
  await page.locator('#quiz-options button').getByText('01:00', {exact:true}).click();
  await expect(page.locator('#quiz-feedback')).toContainText('答对');
  await page.clock.fastForward(3000);
  await expect(page.locator('#quiz-feedback')).toContainText('答对');
});

test('八题答对后存储失败可重试且刷新恢复', async ({page}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('denied'); };
  });
  await page.goto(url);
  await page.locator('[data-mode="quiz"]').click();
  for (let i = 0; i < 8; i++) {
    await page.locator('#quiz-options button').getByText('01:00', {exact: true}).click();
    if (i < 7) await page.locator('#btn-new-quiz').click();
  }
  await expect(page.locator('#math-progress-save-notice')).toContainText('暂未保存');
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
  await page.locator('#math-progress-save-notice button').click();
  await expect(page.locator('#math-progress-save-notice')).toContainText('已保存');
  await page.reload();
  expect(await page.evaluate(() => PageProgress.isDone('time-and-date'))).toBe(true);
});
