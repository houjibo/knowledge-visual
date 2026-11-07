const {test, expect} = require('@playwright/test');
const url = '/math/topics/arithmetic-laws/';

async function start(page) {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.clock.install();
  await page.goto(url);
  await page.clock.pauseAt(Date.now() + 1000);
  await page.locator('[data-mode="challenge"]').click();
  await page.locator('#btn-start-challenge').click();
}

test('单题计分、每题计时及超时答案', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await start(page);
  const options = page.locator('#challenge-options button');
  await expect(options).toHaveCount(4);
  expect(new Set(await options.allTextContents()).size).toBe(4);
  const correct = options.getByText('1', {exact: true});
  await correct.focus();
  await page.keyboard.press('Enter');
  await correct.click({force: true});
  await expect(page.locator('#ch-correct')).toHaveText('1');
  await page.clock.runFor(900);
  await page.clock.runFor(10100);
  await expect(page.locator('#ch-timeout')).toHaveText('1');
  let history = await page.evaluate(() => JSON.parse(localStorage.getItem('arith-challenge-history')));
  expect(history).toHaveLength(2);
  expect(history[1].answer).toBe(1);
  expect(history[1].timedOut).toBe(true);
  await page.clock.runFor(1600);
  await page.clock.runFor(10100);
  await expect(page.locator('#ch-timeout')).toHaveText('2');
  history = await page.evaluate(() => JSON.parse(localStorage.getItem('arith-challenge-history')));
  expect(history).toHaveLength(3);
  expect(errors).toEqual([]);
});

test('切换模式会暂停并恢复首题及答题后等待', async ({page}) => {
  await start(page);
  await page.clock.runFor(3000);
  await page.locator('[data-mode="exchange"]').click();
  await page.clock.runFor(20000);
  await expect(page.locator('#ch-timeout')).toHaveText('0');
  await page.locator('[data-mode="challenge"]').click();
  await page.clock.runFor(6000);
  await expect(page.locator('#ch-timeout')).toHaveText('0');
  await page.locator('#challenge-options button').getByText('1', {exact: true}).click();
  await page.locator('[data-mode="exchange"]').click();
  await page.clock.runFor(3000);
  await page.locator('[data-mode="challenge"]').click();
  await page.clock.runFor(10100);
  await expect(page.locator('#ch-correct')).toHaveText('1');
  await expect(page.locator('#ch-timeout')).toHaveText('1');
});

test('保存失败可重试并写入完成记录', async ({page}) => {
  await page.addInitScript(() => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function(...args) {
      if (!window.allowSave) throw new Error('denied');
      return set.apply(this, args);
    };
  });
  await start(page);
  for (let i = 0; i < 5; i++) {
    await page.locator('#challenge-options button').getByText('1', {exact: true}).click();
    if (i < 4) await page.clock.runFor(900);
  }
  await expect(page.locator('#math-progress-save-notice')).toContainText('暂未保存');
  await page.evaluate(() => { window.allowSave = true; });
  await page.locator('#math-progress-save-notice button').click();
  await expect(page.locator('#math-progress-save-notice')).toContainText('已保存');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-math-progress-v2'))['primary:arithmetic-laws'])).toBeTruthy();
});
