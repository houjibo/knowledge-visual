const { test, expect } = require('@playwright/test');
const url = '/math/topics/perimeter/index.html';

for (const seed of [0, 0.2, 0.4, 0.6, 0.999999]) {
  test(`固定随机值 ${seed} 的周长题选项及解释一致`, async ({ page }) => {
    await page.addInitScript(value => { Math.random = () => value; }, seed);
    await page.goto(url, { timeout: 10000 });
    await page.locator('[data-mode="calc"]').click();
    const question = await page.locator('#calc-question').innerText();
    const nums = (question.match(/\d+/g) || []).map(Number);
    const options = page.locator('#calc-options button');
    const values = await options.evaluateAll(nodes => nodes.map(n => +n.dataset.val));
    expect(values).toHaveLength(4);
    expect(new Set(values).size).toBe(4);
    let answer;
    if (question.startsWith('三角形')) {
      expect(nums[0] + nums[1]).toBeGreaterThan(nums[2]);
      expect(nums[0] + nums[2]).toBeGreaterThan(nums[1]);
      expect(nums[1] + nums[2]).toBeGreaterThan(nums[0]);
      answer = nums.reduce((a, b) => a + b, 0);
    } else if (question.startsWith('长方形')) answer = 2 * (nums[0] + nums[1]);
    else if (question.startsWith('正方形')) answer = 4 * nums[0];
    else if (question.startsWith('四边形')) answer = nums.reduce((a, b) => a + b, 0);
    else answer = 5 * nums[0];
    expect(values).toContain(answer);
    await page.locator(`#calc-options button[data-val="${answer}"]`).click();
    await expect(page.locator('#calc-explain')).toContainText(`= ${answer} cm`);
  });
}

test('闯关花坛题以米作答并正确反馈', async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => { Math.random = () => 0.999999; });
  await page.goto(url);
  await page.locator('[data-mode="quiz"]').click();
  for (let level = 1; level <= 5; level++) {
    const options = page.locator('#quiz-options button');
    const values = await options.evaluateAll(nodes => nodes.map(n => +n.dataset.val));
    expect(new Set(values).size).toBe(4);
    const answer = await options.first().getAttribute('data-answer');
    if (level === 5) {
      await expect(page.locator('#quiz-question')).toContainText('花坛');
      for (const label of await options.allTextContents()) expect(label).toMatch(/ m$/);
    }
    await page.locator(`#quiz-options button[data-val="${answer}"]`).click();
    await expect(page.locator('#quiz-feedback')).toContainText(level === 5 ? `${answer} m` : `${answer} cm`);
    await page.clock.fastForward(1600);
  }
  await expect(page.locator('#quiz-question')).toContainText('闯关成功');
});

test('测量可通过键盘查看各边并重新开始', async ({ page }) => {
  await page.goto(url);
  await page.locator('[data-mode="measure"]').click();
  const buttons = page.locator('#measure-side-buttons button');
  await expect(buttons).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    await buttons.nth(i).focus();
    await page.keyboard.press('Enter');
    await expect(buttons.nth(i)).toBeDisabled();
  }
  await expect(page.locator('#measure-total')).toHaveText('18 cm');
  await page.getByRole('button', { name: '↩ 重新量' }).click();
  await expect(page.locator('#measure-total')).toHaveText('? cm');
  await expect(buttons.first()).toBeEnabled();
});

test('描边过程中切换形状可重新演示', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(url);
  await page.locator('#walk-btn').click();
  await page.clock.fastForward(200);
  await page.locator('[data-shape="circle"]').click();
  await page.clock.fastForward(2500);
  expect(errors).toEqual([]);
  await expect(page.locator('#ant-demo')).toContainText('小蚂蚁');
  await page.locator('#walk-btn').click();
  await page.clock.fastForward(2200);
  await expect(page.locator('#ant-demo')).toContainText('走完了');
});
