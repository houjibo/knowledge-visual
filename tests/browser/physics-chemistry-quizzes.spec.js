const {test, expect} = require('@playwright/test');

const topics = [
  ['chemistry/high/crystal-structure', [2,1,1,1]], ['chemistry/high/ionic-reactions', [2,1,0,2]],
  ['chemistry/high/mole-concept', [0,1,1,1]], ['chemistry/high/reaction-energy', [1,1,2,1]],
  ['chemistry/middle/13-metals', [1,2,0,0]], ['physics/high/alternating-current', [1,1,1,1]],
  ['physics/high/optics', [0,1,1,0]], ['physics/high/thermal', [0,1,0,1]],
  ['physics/high/vibration-waves', [0,2,1,1]], ['physics/middle/current-circuits', [0,3,2,3]],
  ['physics/middle/electric-power', [0,1,2,2]], ['physics/middle/electromagnetism', [0,1,0,1]],
  ['physics/middle/heat-engine', [2,1,1,2]], ['physics/middle/household-circuits', [1,1,0,1]],
  ['physics/middle/internal-energy', [1,0,0,0]], ['physics/middle/ohms-law', [0,2,0,1]],
  ['physics/middle/voltage-resistance', [0,2,2,0]],
];
for (const [path, answers] of topics) {
  test(`${path} 逐题计分和完成记录`, async ({page}) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/${path}.html`);
    const tab = page.locator('.tab[data-mode="quiz"]');
    await tab.focus();
    await page.keyboard.press('Enter');
    await expect(tab).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#quizStart').click();
    await page.locator('#quizOpts button').nth(answers[0]).focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#quizFb')).toContainText('✅');
    for (let i = 0; i < 4; i++) {
      await page.locator('#quizNext').click();
      await page.locator('#quizPrev').click();
      await page.locator('#quizOpts button').nth(answers[0]).click();
    }
    for (let i = 0; i < 5; i++) await page.locator('#quizNext').click();
    await expect(page.locator('#quizResult')).toContainText('1 / 5');
    await expect(page.locator('#done-mark')).toHaveText('');
    await page.locator('#quizStart').click();
    for (const answer of answers) {
      await page.locator('#quizOpts button').nth(answer).click();
      await page.locator('#quizNext').click();
    }
    await page.locator('#quizNext').click();
    await expect(page.locator('#quizResult')).toContainText('4 / 5');
    await page.reload();
    await expect(page.locator('#done-mark')).toContainText('已完成');
    expect(errors).toEqual([]);
  });
}

for (const [path, answers] of topics) {
  test(`${path} 测验写入失败时提示未保存`, async ({page}) => {
    await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('denied'); }; });
    await page.goto(`/${path}.html`);
    await page.locator('.tab[data-mode="quiz"]').click();
    await page.locator('#quizStart').click();
    for (const answer of answers) {
      await page.locator('#quizOpts button').nth(answer).click();
      await page.locator('#quizNext').click();
    }
    await page.locator('#quizNext').click();
    await expect(page.locator('#done-mark')).toContainText('进度未保存');
  });
}
