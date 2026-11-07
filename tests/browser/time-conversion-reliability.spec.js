const {test, expect} = require('@playwright/test');
const url = '/math/topics/24h-time/index.html';

for (const random of [0, 0.999999]) {
  test(`固定随机值 ${random} 时题目和配对有限且不重复`, async ({page}) => {
    await page.addInitScript(value => { Math.random = () => value; }, random);
    await page.goto(url);
    await page.locator('[data-mode="quiz"]').click();
    const options = page.locator('#quiz-options button');
    await expect(options).toHaveCount(4);
    expect(new Set(await options.allTextContents()).size).toBe(4);
    const correct = random === 0 ? '00:00' : '晚上 11:45';
    await options.getByText(correct, {exact: true}).click();
    await expect(page.locator('#quiz-score')).toHaveText('1');
    await expect(options.first()).toBeDisabled();
    await page.locator('[data-mode="timeline"]').click();
    const tlOptions = page.locator('#tl-options button');
    await expect(tlOptions).toHaveCount(4);
    expect(new Set(await tlOptions.allTextContents()).size).toBe(4);
    await page.locator('[data-mode="match"]').click();
    const left = page.locator('#match-left button');
    const right = page.locator('#match-right button');
    await expect(left).toHaveCount(5);
    expect(new Set(await left.allTextContents()).size).toBe(5);
    expect(new Set(await right.allTextContents()).size).toBe(5);
    const firstId = await left.first().getAttribute('data-id');
    await left.first().click();
    await page.locator(`#match-right button:not([data-id="${firstId}"])`).first().click();
    await expect(page.locator('#match-count')).toHaveText('0');
    await expect(left.first()).not.toHaveClass(/selected/, {timeout: 2000});
    for (const card of await left.all()) {
      const id = await card.getAttribute('data-id');
      await card.focus(); await page.keyboard.press('Enter');
      const other = page.locator(`#match-right button[data-id="${id}"]`);
      await other.focus(); await page.keyboard.press('Enter');
      await expect(card).toBeDisabled();
    }
    await expect(page.locator('#match-complete')).toContainText('全部配对成功');
    await page.locator('#match-restart').click();
    await expect(page.locator('#match-count')).toHaveText('0');
  });
}

test('午夜、中午与晚上转换和动态钟面说明一致', async ({page}) => {
  await page.goto(url);
  const slider = page.getByLabel('选择一天中的时间');
  for (const [minutes, text, explanation] of [
    ['0', '00:00 = 凌晨 12:00', '凌晨12时对应00时'],
    ['60', '01:00 = 凌晨 01:00', '小时数不变'],
    ['720', '12:00 = 中午 12:00', '中午12时对应12时'],
    ['900', '15:00 = 下午 03:00', '15 = 12 + 3'],
    ['1200', '20:00 = 晚上 08:00', '20 = 12 + 8'],
  ]) {
    await slider.fill(minutes);
    await expect(page.locator('#slider-info')).toHaveText(text);
    await expect(page.locator('#conversion-explanation')).toHaveText(explanation);
  }
  await expect(page.locator('#ticks-24 text').first()).toHaveText('12');
  await expect(page.locator('.convert-rule-box')).toContainText('午夜12时');
  await expect(page.locator('.convert-rule-box')).toContainText('中午12时');
});

test('时间线键盘选择的事件决定题目，反馈保持到主动换题', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.clock.install();
  await page.goto(url);
  await page.locator('[data-mode="timeline"]').click();
  const noon = page.locator('.timeline-card[data-idx="6"]');
  await noon.focus(); await page.keyboard.press('Enter');
  await expect(noon).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#tl-question')).toContainText('午餐是中午 12:00');
  await page.locator('#tl-options button').getByText('12:00', {exact: true}).click();
  await expect(page.locator('#tl-feedback')).toContainText('答对');
  await page.clock.fastForward(2000);
  await expect(page.locator('#tl-feedback')).toContainText('答对');
  const dinner = page.locator('.timeline-card[data-idx="11"]');
  await dinner.focus(); await page.keyboard.press('Space');
  await expect(noon).toHaveAttribute('aria-pressed', 'false');
  await expect(dinner).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#tl-question')).toContainText('晚餐是晚上 07:00');
  await expect(page.locator('#tl-feedback')).toBeEmpty();
  await page.clock.fastForward(2000);
  await expect(page.locator('#tl-question')).toContainText('晚餐');
  await page.locator('#tl-next').click();
  await expect(dinner).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#tl-question')).toContainText('午夜');
});

async function completeTimeActivities(page) {
  await page.getByLabel('选择一天中的时间').fill('720');
  await page.locator('[data-mode="quiz"]').click();
  await page.locator('#quiz-options button').getByText('00:00', {exact: true}).click();
  await page.locator('[data-mode="timeline"]').click();
  await page.locator('#tl-options button').getByText('00:00', {exact: true}).click();
  await page.locator('[data-mode="match"]').click();
  for (const card of await page.locator('#match-left button').all()) {
    const id = await card.getAttribute('data-id');
    await card.click();
    await page.locator(`#match-right button[data-id="${id}"]`).click();
  }
}

test('四项活动达标后保存并在知识地图显示完成', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await expect(page.locator('#learning-progress')).toContainText('0/4');
  await page.getByLabel('选择一天中的时间').fill('720');
  await expect(page.locator('#learning-progress')).toContainText('1/4');
  expect(await page.evaluate(() => PageProgress.isDone('24h-time'))).toBe(false);
  await completeTimeActivities(page);
  await expect(page.locator('#learning-progress')).toHaveText('✓ 本主题已完成');
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('kv-math-progress-v2')))['primary:24h-time']).toBeTruthy();
  await page.reload();
  await expect(page.locator('#learning-progress')).toHaveText('✓ 本主题已完成');
  await page.goto('/math/index.html');
  await expect(page.locator('a.topic-card[href="topics/24h-time/index.html"] .progress-badge')).toHaveText('✓');
});

test('进度保存失败时可重试且不误报已保存', async ({page}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('denied'); };
  });
  await page.goto(url);
  await completeTimeActivities(page);
  await expect(page.locator('#learning-progress')).toContainText('尚未保存');
  await expect(page.locator('#math-progress-save-notice')).toContainText('暂未保存');
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
  await page.locator('#math-progress-save-notice button').click();
  await expect(page.locator('#learning-progress')).toHaveText('✓ 本主题已完成');
  await page.reload();
  await expect(page.locator('#learning-progress')).toHaveText('✓ 本主题已完成');
});
