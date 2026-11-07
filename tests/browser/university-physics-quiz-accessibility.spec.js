const {test, expect} = require('@playwright/test');
const topics = [
  ['phase-transitions', [2, 1, 1, 1]], ['laser-physics', [1, 1, 1, 3]],
  ['fluid-mechanics', [2, 1, 0, 3]], ['photoelectric', [1, 3, 1, 0]], ['doppler', [1, 1, 1, 2]],
];

for (const [slug, answers] of topics) {
  test(`${slug} 键盘答题、修改及保存恢复`, async ({page}) => {
    await page.goto(`/physics/uni/${slug}.html`);
    await page.locator('[data-mode="quiz"]').click();
    const options = page.locator('#quiz-opts button');
    await options.nth((answers[0] + 1) % 4).focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#quiz-fb')).toContainText('❌');
    await options.nth(answers[0]).focus();
    await page.keyboard.press('Enter');
    await expect(options.nth(answers[0])).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#quiz-fb')).toContainText('✅');
    for (let i = 1; i < 4; i++) {
      await page.locator('#quiz-next').click();
      await options.nth(answers[i]).click();
    }
    await page.locator('#quiz-submit').click();
    await expect(page.locator('#quiz-result')).toContainText('4/4');
    await expect(page.locator('#quiz-result')).toContainText('进度已保存');
    await expect(options.first()).toBeDisabled();
    await page.reload();
    await expect(page.locator('#done-mark')).toContainText('已完成');
  });

  test(`${slug} 保存失败时可重试`, async ({page}) => {
    await page.addInitScript(() => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function(...args) { if (!window.allowProgressSave) throw new Error('denied'); return set.apply(this, args); };
    });
    await page.goto(`/physics/uni/${slug}.html`);
    await page.locator('[data-mode="quiz"]').click();
    for (let i = 0; i < 4; i++) {
      await page.locator('#quiz-opts button').nth(answers[i]).click();
      if (i < 3) await page.locator('#quiz-next').click();
    }
    await page.locator('#quiz-submit').click();
    await expect(page.locator('#quiz-result')).toContainText('进度未保存');
    await expect(page.locator('#done-mark')).toContainText('进度未保存');
    await page.evaluate(() => { window.allowProgressSave = true; });
    await page.locator('#quiz-save').click();
    await expect(page.locator('#quiz-result')).toContainText('进度已保存');
    await page.reload();
    await expect(page.locator('#done-mark')).toContainText('已完成');
  });
}
