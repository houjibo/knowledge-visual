const {test, expect} = require('@playwright/test');
const url = '/math/topics/calendar-units/index.html';

test('十二个月的北半球气象季节及闰年二月', async ({page}) => {
  await page.goto(url);
  const seasons = await page.evaluate(() => {
    currentYear = 2000;
    return Array.from({length: 12}, (_, month) => {
      currentMonth = month; renderCalendar();
      return document.getElementById('season-info').textContent;
    });
  });
  const expected = ['冬季', '冬季', '春季', '春季', '春季', '夏季', '夏季', '夏季', '秋季', '秋季', '秋季', '冬季'];
  for (let i = 0; i < 12; i++) expect(seasons[i]).toContain(expected[i]);
  await page.evaluate(() => { currentYear = 2000; currentMonth = 1; renderCalendar(); });
  await expect(page.locator('#month-info')).toContainText('29');
  await expect(page.locator('#calendar-grid .calendar-day:not(.empty)')).toHaveCount(29);
  await page.evaluate(() => { currentYear = 1900; currentMonth = 1; renderCalendar(); });
  await expect(page.locator('#calendar-grid .calendar-day:not(.empty)')).toHaveCount(28);
});

test('闰年规则处理世纪年并拒绝小数年份', async ({page}) => {
  await page.goto(url);
  await page.getByRole('button', {name: '🔍 闰年'}).click();
  const input = page.getByLabel('年份');
  for (const [year, result] of [['2000','闰年'], ['1900','平年'], ['2100','平年'], ['2024','闰年'], ['2023','平年']]) {
    await input.fill(year);
    await page.getByRole('button', {name: '🔍 检测'}).click();
    await expect(page.locator('#leap-result')).toContainText(result);
  }
  await input.fill('2024.5');
  await page.getByRole('button', {name: '🔍 检测'}).click();
  await expect(page.locator('#leap-result')).toContainText('整数年份');
});

test('换算仅统计一次有效作答，日期挑战不能重复计分', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="convert"]').click();
  await page.getByRole('button', {name: '检查换算答案'}).click();
  await expect(page.locator('#unit-total')).toHaveText('0');
  await page.getByLabel('换算答案', {exact: true}).fill('36');
  await page.getByRole('button', {name: '检查换算答案'}).click();
  await expect(page.locator('#unit-check')).toBeDisabled();
  await page.getByLabel('换算答案', {exact: true}).press('Enter');
  await expect(page.locator('#unit-total')).toHaveText('1');
  await expect(page.locator('#unit-correct')).toHaveText('1');
  await page.locator('#unit-next').click();
  await expect(page.locator('#unit-check')).toBeEnabled();
  await page.locator('[data-mode="datecalc"]').click();
  await expect(page.locator('#dc-question')).toContainText('不计出发当日');
  for (let i = 0; i < 5; i++) {
    const options = page.locator('#dc-options button');
    await options.nth(1).focus(); await page.keyboard.press('Enter');
    await expect(options.nth(1)).toBeDisabled();
    await options.nth(1).dispatchEvent('click');
    await expect(page.locator('#dc-correct')).toHaveText(String(i + 1));
    if (i < 4) await page.locator('#dc-next').click();
  }
  expect(await page.evaluate(() => PageProgress.isDone('calendar-units'))).toBe(true);
  await page.reload();
  expect(await page.evaluate(() => PageProgress.isDone('calendar-units'))).toBe(true);
  await page.evaluate(() => { Math.random = () => 0.999999; });
  await page.locator('[data-mode="datecalc"]').click();
  await page.locator('#dc-next').click();
  await expect(page.locator('#dc-question')).toContainText('首尾两日都算');
  await page.locator('#dc-options button').getByText('31天', {exact: true}).click();
  await expect(page.locator('#dc-hint')).toContainText('正确');
});

test('日期挑战完成时保存失败可重试', async ({page}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('denied'); };
  });
  await page.goto(url);
  await page.locator('[data-mode="datecalc"]').click();
  for (let i = 0; i < 5; i++) {
    await page.locator('#dc-options button').nth(1).click();
    if (i < 4) await page.locator('#dc-next').click();
  }
  await expect(page.locator('#math-progress-save-notice')).toContainText('暂未保存');
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
  await page.locator('#math-progress-save-notice button').click();
  await expect(page.locator('#math-progress-save-notice')).toContainText('已保存');
  await page.reload();
  expect(await page.evaluate(() => PageProgress.isDone('calendar-units'))).toBe(true);
});
