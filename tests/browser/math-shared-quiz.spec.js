const {test, expect} = require('@playwright/test');
const path = require('path');
const {pathToFileURL} = require('url');
const topics = [
  ['middle/coordinate-plane', [1,0,1,2,1]],
  ['middle/inequalities', [0,1,1,1,3]],
  ['middle/intersecting-parallel-lines', [0,1,2,0,1]],
  ['middle/data-analysis', [1,0,1,2,1]],
  ['middle/data-statistics', [1,2,1,2,0]],
  ['middle/linear-equations-2var', [1,0,1,0,1]],
  ['middle/probability-intro', [1,0,1,2,0]],
  ['high/random-variables', [1,1,1,1,2]],
];
for (const [topic, answers] of topics) {
  test(`${topic} 回看、重测和学段进度`, async ({page}) => {
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/math/${topic}.html`);
    const tab = page.locator('.tab[data-mode="quiz"]');
    await tab.focus(); await page.keyboard.press('Enter');
    await expect(tab).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#quizStart').click();
    const first = page.locator('#quizOpts button').nth(answers[0]);
    await first.focus(); await page.keyboard.press('Space');
    for (let i = 0; i < 4; i++) {
      await page.locator('#quizNext').click(); await page.locator('#quizPrev').click();
      await expect(first).toBeDisabled();
      await expect(page.locator('#quizFb')).toContainText('✅');
    }
    for (let i = 0; i < 5; i++) await page.locator('#quizNext').click();
    await expect(page.locator('#quizResult')).toContainText('1 / 5');
    await expect(page.locator('#done-mark')).toHaveText('');
    await page.locator('#quizStart').click();
    for (const answer of answers.slice(0,4)) {
      await page.locator('#quizOpts button').nth(answer).click();
      await page.locator('#quizNext').click();
    }
    await page.locator('#quizOpts button').nth((answers[4] + 1) % 4).click();
    await expect(page.locator('#quizFb')).toContainText('❌');
    await page.locator('#quizNext').click();
    await expect(page.locator('#quizResult')).toContainText('4 / 5');
    const [stage, slug] = topic.split('/');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('kv-math-progress-v2')));
    expect(saved[`${stage}:${slug}`]).toBeTruthy();
    await page.reload(); await expect(page.locator('#done-mark')).toContainText('已完成');
    expect(errors).toEqual([]);
  });
}
for (const topic of ['middle/probability-intro', 'high/random-variables']) {
  test(`${topic} 文件协议加载并提示保存失败`, async ({page}) => {
    await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('denied'); }; });
    await page.goto(pathToFileURL(path.resolve(`math/${topic}.html`)).href);
    await page.locator('.tab[data-mode="quiz"]').click();
    await page.locator('#quizStart').click();
    const answers = topics.find(([name]) => name === topic)[1];
    for (const answer of answers) {
      await page.locator('#quizOpts button').nth(answer).click();
      await page.locator('#quizNext').click();
    }
    await expect(page.locator('#quizResult')).toContainText('5 / 5');
    await expect(page.locator('#done-mark')).toContainText('进度未保存');
  });
}
