const { test, expect } = require('@playwright/test');
const url = '/math/topics/comparison-and-ordering/index.html';

for (const seed of [0, 0.4, 0.999999]) {
  test(`重复随机值 ${seed} 初始化并正确生成各类挑战`, async ({ page }) => {
    await page.clock.install({time: new Date('2026-01-01T00:00:00Z')}); await page.clock.pauseAt(new Date('2026-01-01T00:00:00Z'));
    await page.addInitScript(value => { Math.random = () => value; }, seed);
    await page.goto(url, { timeout: 10000 });
    await page.locator('[data-mode="numberline"]').click();
    const a = Number(await page.locator('#nlNum1').innerText()), b = Number(await page.locator('#nlNum2').innerText());
    const name = a > b ? '大于' : a < b ? '小于' : '等于';
    const button = page.getByRole('button', { name });
    await button.focus(); await page.keyboard.press('Enter'); await button.dispatchEvent('click');
    await expect(page.locator('#score')).toHaveText('1');
    if (a === b) {
      const circles = await page.locator('#nlSvg circle').evaluateAll(nodes => nodes.map(n => n.getAttribute('cy')));
      expect(new Set(circles).size).toBe(2);
    }
    await page.locator('[data-mode="sort"]').click();
    const items = page.locator('#sortItems button');
    const sorted = (await items.allTextContents()).map(Number).sort((x, y) => x - y);
    expect(new Set(sorted).size).toBe(sorted.length);
    for (const n of sorted) {
      const item = page.locator(`#sortItems button[data-num="${n}"]`);
      await item.focus(); await page.keyboard.press('Enter');
    }
    await expect(page.locator('#sortResult')).toContainText('完全正确');
    await page.locator('#sortCheck').click();
    await page.locator('#sortCheck').click();
    await expect(page.locator('#score')).toHaveText('3');
    await page.locator('[data-mode="position"]').click();
    const target = Number(await page.locator('#posTarget').textContent());
    const sequence = (await page.locator('#posSequence').innerText()).match(/\d+/g).map(Number);
    expect(sequence).not.toContain(target);
    const position = sequence.filter(n => n < target).length + 1;
    const positionButton = page.locator(`#posOptions button[data-pos="${position}"]`);
    await positionButton.dispatchEvent('click'); await positionButton.dispatchEvent('click');
    await expect(page.locator('#score')).toHaveText('4');
    await page.locator('[data-mode="challenge"]').click();
    await page.locator('#chStart').click();
    const options = page.locator('#chOptions button');
    const choices = await options.allTextContents();
    expect(choices.length).toBe(seed === 0.999999 ? 4 : 3);
    expect(new Set(choices).size).toBe(choices.length);
    const problem = await page.locator('#chProblem').innerText();
    let answer;
    if (seed === 0) {
      const [x, y] = problem.match(/\d+/g).map(Number);
      answer = x > y ? '>' : x < y ? '<' : '=';
    } else if (seed === 0.4) {
      answer = problem.match(/\d+/g).map(Number).sort((x, y) => x - y).join(' < ');
    } else {
      const parts = problem.match(/[\d?]+/g);
      const values = parts.map(x => x === '?' ? null : +x);
      const step = values[1] !== null ? values[1] - values[0] : values[3] - values[2];
      answer = String(values[0] + step * values.indexOf(null));
    }
    expect(choices).toContain(answer);
    const wrong = choices.find(choice => choice !== answer);
    const wrongButton = options.filter({ hasText: new RegExp(`^${wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) });
    await wrongButton.dispatchEvent('click'); await wrongButton.dispatchEvent('click');
    await expect(page.locator('#chWrong')).toHaveText('1');
    await expect(page.locator('#chFeedback')).toContainText(`正确答案：${answer}`);
    await page.clock.runFor(1600);
    await expect(page.locator('#chFeedback')).toHaveText('');
  });
}

test('切换排序方向及挑战到期不会执行过期回调', async ({ page }) => {
  await page.clock.install({time: new Date('2026-01-01T00:00:00Z')}); await page.clock.pauseAt(new Date('2026-01-01T00:00:00Z'));
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="sort"]').click();
  const descending = (await page.locator('#sortItems button').allTextContents()).map(Number).sort((a, b) => b - a);
  for (const n of descending) await page.locator(`#sortItems button[data-num="${n}"]`).click();
  await expect(page.locator('#sortResult')).toContainText('顺序不对');
  await page.locator('#dirDesc').click();
  await page.locator(`#sortItems button[data-num="${descending[0]}"]`).click();
  await page.clock.runFor(1300);
  await expect(page.locator('#sortSlots .filled')).toHaveCount(1);
  await page.locator('[data-mode="challenge"]').click();
  await page.locator('#chStart').click();
  await page.clock.runFor(59000);
  await page.locator('#chOptions button').filter({ hasText: '>' }).click();
  await page.clock.runFor(2000);
  await expect(page.locator('#chProblem')).toContainText('时间到');
  await expect(page.locator('#chOptions button')).toHaveCount(0);
  await expect(page.locator('#chStart')).toBeVisible();
});
