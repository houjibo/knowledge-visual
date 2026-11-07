const {test, expect} = require('@playwright/test');
const topics = [
  ['fluid-mechanics', '#r1', '40'],
  ['photoelectric', '#nu', '8'],
  ['doppler', '#vs', '-100'],
];
for (const [slug, selector, value] of topics) {
  test(`${slug} 暂停后画面稳定且参数仍可更新`, async ({page}) => {
    await page.goto(`/physics/uni/${slug}.html`);
    const toggle = page.locator('#animation-toggle');
    await toggle.focus(); await page.keyboard.press('Enter');
    await expect(page.locator('#animation-status')).toHaveText('动画已暂停');
    const canvas = page.locator('#learnCanvas');
    const before = await canvas.evaluate(c => c.toDataURL());
    await page.waitForTimeout(180);
    expect(await canvas.evaluate(c => c.toDataURL())).toBe(before);
    await page.locator(selector).fill(value);
    const updated = await canvas.evaluate(c => c.toDataURL());
    expect(updated).not.toBe(before);
    await page.waitForTimeout(180);
    expect(await canvas.evaluate(c => c.toDataURL())).toBe(updated);
    await page.keyboard.press('Tab');
    await toggle.click();
    await expect(page.locator('#animation-status')).toHaveText('动画播放中');
    await expect.poll(() => canvas.evaluate(c => c.toDataURL()), {timeout: 2000}).not.toBe(updated);
  });
  test(`${slug} 遵循减少动态效果并可主动播放`, async ({page}) => {
    await page.emulateMedia({reducedMotion: 'reduce'});
    await page.goto(`/physics/uni/${slug}.html`);
    await expect(page.locator('#animation-status')).toHaveText('动画已暂停');
    await page.getByRole('button', {name: '继续动画'}).click();
    await expect(page.locator('#animation-status')).toHaveText('动画播放中');
  });
}
