const {test, expect} = require('@playwright/test');

test('固定随机值下练习的完整图形数量与标签一致', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/math/topics/one-to-one-correspondence/index.html');
  await page.locator('.mode-tab[data-mode="practice"]').click();
  const groups = page.locator('#practice-area .game-group');
  await expect(groups).toHaveCount(2);
  for (let i = 0; i < 2; i++) {
    await expect(groups.nth(i).locator('.game-group-item')).toHaveCount(2);
    const values = await groups.nth(i).locator('.game-group-item').allTextContents();
    expect(values.every(value => Array.from(value).length === 1 && !value.includes('�'))).toBe(true);
    await expect(groups.nth(i).locator('.game-group-label')).toContainText('2个');
  }
  const equal = page.locator('#practice-area .opt-btn[data-val="="]');
  await equal.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#p-feedback')).toContainText('答对');
  await expect(equal).toBeDisabled();
  await expect(page.locator('#p-correct')).toHaveText('1');
  expect(errors).toEqual([]);
});

test('固定随机值下配对游戏及挑战可生成不同选项并答对', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => .5; });
  await page.goto('/math/topics/one-to-one-correspondence/index.html');
  await page.locator('.mode-tab[data-mode="game"]').click();
  const options = page.locator('#game-area .game-opt');
  await expect(options).toHaveCount(4);
  expect(new Set(await options.allTextContents()).size).toBe(4);
  await options.filter({hasText: /^2 个$/}).click();
  await expect(page.locator('#g-correct')).toHaveText('1');
  await expect(options.first()).toBeDisabled();
  await page.locator('.mode-tab[data-mode="challenge"]').click();
  await page.locator('#btn-start-challenge').click();
  const challenge = page.locator('#ch-content .game-opt');
  await expect(challenge).toHaveCount(4);
  expect(new Set(await challenge.allTextContents()).size).toBe(4);
  await challenge.filter({hasText: /^2$/}).click();
  await expect(page.locator('#ch-correct')).toHaveText('1');
  await expect(challenge.first()).toBeDisabled();
});

test('随机上限下比较游戏不会因相同数量卡住', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => .999999; });
  await page.goto('/math/topics/one-to-one-correspondence/index.html');
  await page.locator('.mode-tab[data-mode="practice"]').click();
  await expect(page.locator('#practice-area .game-group').first().locator('.game-group-item')).toHaveCount(6);
  await page.locator('.mode-tab[data-mode="game"]').click();
  const labels = await page.locator('#game-area .game-group-label').allTextContents();
  const counts = labels.map(text => Number(text.match(/(\d+)个/)[1]));
  expect(counts[0]).not.toBe(counts[1]);
  await page.locator(`#game-area .game-opt[data-val="${counts[0] > counts[1] ? 'A' : 'B'}"]`).click();
  await expect(page.locator('#g-correct')).toHaveText('1');
});
