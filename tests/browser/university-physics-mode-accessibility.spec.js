const {test, expect} = require('@playwright/test');

for (const slug of ['phase-transitions', 'laser-physics', 'fluid-mechanics', 'photoelectric', 'doppler']) {
  test(`${slug} 的模式入口可用键盘操作`, async ({page}) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/physics/uni/${slug}.html`);
    const learn = page.locator('[data-mode="learn"].tab');
    const practice = page.locator('[data-mode="practice"].tab');
    const quiz = page.locator('[data-mode="quiz"].tab');
    await expect(learn).toHaveAttribute('aria-pressed', 'true');
    await practice.focus();
    await expect(practice).toBeFocused();
    await expect(practice).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Enter');
    await expect(practice).toHaveAttribute('aria-pressed', 'true');
    await expect(learn).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#sec-practice')).toBeVisible();
    await expect(page.locator('#sec-learn')).toBeHidden();
    await quiz.focus();
    await page.keyboard.press('Space');
    await expect(quiz).toHaveAttribute('aria-pressed', 'true');
    await expect(practice).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#sec-quiz')).toBeVisible();
    await expect(page.locator('#sec-practice')).toBeHidden();
    await learn.click();
    await expect(page.locator('#sec-learn')).toBeVisible();
    await expect(learn).toHaveAttribute('aria-pressed', 'true');
    expect(errors).toEqual([]);
  });
}
