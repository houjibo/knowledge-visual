const {test, expect} = require('@playwright/test');
const url = '/math/topics/abacus/';

test('固定随机数下读数加载，各档珠子不重叠且数值一致', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url, {timeout: 10000});
  const errors = await page.evaluate(() => {
    const failures = [];
    for (let digit=0; digit<=9; digit++) {
      const state = numberToState(digit);
      drawSimpleAbacus(document.getElementById('readSvg'), state, false, 'test');
      if (stateToNumber(state) !== digit) failures.push(`value ${digit}`);
      const beads = [...document.querySelectorAll('#readSvg ellipse')].filter(e => +e.getAttribute('cx') === 255).map(e => +e.getAttribute('cy')).sort((a,b)=>a-b);
      if (beads.length !== 6 || beads.some((y,i) => i && y-beads[i-1] < 32)) failures.push(`overlap ${digit}: ${beads}`);
    }
    return failures;
  });
  expect(errors).toEqual([]);
  await page.locator('[data-mode="read"]').click();
  const options = page.locator('#readOptions button');
  await expect(options).toHaveCount(4);
  expect(new Set(await options.allTextContents()).size).toBe(4);
});

test('键盘拨数同步图示，重复检查不重复计分', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => .8; });
  await page.goto(url);
  await page.locator('[data-mode="represent"]').click();
  await page.getByLabel('个位数字').selectOption('8');
  expect(await page.evaluate(() => stateToNumber(repState))).toBe(8);
  expect(await page.evaluate(() => repState[4])).toEqual({upper:1,lower:3});
  await page.locator('#repCheck').click();
  await page.locator('#repCheck').click();
  await expect(page.locator('#repScoreVal')).toHaveText('10');
  await expect(page.locator('#repFeedback')).toContainText('正确');
  await page.locator('#repNext').click();
  await expect(page.locator('#repRound')).toHaveText('2');
  await expect(page.locator('#repFeedback')).toHaveText('');
  await expect(page.getByLabel('个位数字')).toHaveValue('0');
});

test('读数反馈可保留，限时挑战同题只提交一次', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="read"]').click();
  const answer = page.locator('#readOptions button').getByText('0',{exact:true});
  await answer.click(); await answer.click();
  await expect(page.locator('#readScoreVal')).toHaveText('10');
  await page.waitForTimeout(1700);
  await expect(page.locator('#readFeedback')).toContainText('正确');
  await page.locator('#readNext').click();
  await expect(page.locator('#readRound')).toHaveText('2');
  await page.locator('[data-mode="challenge"]').click();
  await page.locator('#chalStartBtn').click();
  await page.locator('#chalInput').fill('1');
  await page.locator('#chalSubmit').click(); await page.locator('#chalSubmit').click();
  await expect(page.locator('#chalCorrect')).toHaveText('1');
});
