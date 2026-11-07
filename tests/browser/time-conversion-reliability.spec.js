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
