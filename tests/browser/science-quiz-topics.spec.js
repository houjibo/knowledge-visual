const {test, expect} = require('@playwright/test');

const topics = [
  ['animals', [1, 1, 1, 2]], ['living-things', [0, 3, 1, 1]],
  ['earth-space', [1, 1, 2, 2]], ['human-body', [1, 2, 1, 1]],
  ['weather-water-cycle', [1, 1, 2, 1]], ['time-measurement', [0, 1, 1, 1]],
  ['materials', [1, 1, 2, 0]], ['environment', [1, 2, 1, 1]],
  ['simple-machines', [1, 1, 1, 2]],
];

for (const [slug, answers] of topics) {
  test(`${slug} 测验不可重复计分且可正常通关`, async ({page}) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/science/${slug}.html`);
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
    await page.goto('/science/index.html');
    await expect(page.locator(`a[href="${slug}.html"] .progress-badge`)).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}

for (const [slug, answers] of topics) {
  test(`${slug} 存储失败时如实提示`, async ({page}) => {
    await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('denied'); }; });
    await page.goto(`/science/${slug}.html`);
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
