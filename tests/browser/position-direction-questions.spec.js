const { test, expect } = require('@playwright/test');

const url = '/math/topics/position-and-direction/index.html';
const opposite = { 东: '西', 西: '东', 南: '北', 北: '南', 东北: '西南', 西南: '东北', 东南: '西北', 西北: '东南' };

for (const seed of [0, 0.25, 0.5, 0.999999]) {
  test(`重复随机值 ${seed} 下的方向题可判断并正确反馈`, async ({ page }) => {
    await page.addInitScript(value => { Math.random = () => value; }, seed);
    await page.goto(url, { timeout: 10000 });
    await page.locator('[data-mode="judge"]').click();
    const points = await page.locator('#judgeScene svg text').evaluateAll(nodes => nodes.filter(n => ['A', 'B'].includes(n.textContent)).map(n => ({ x: +n.getAttribute('x'), y: +n.getAttribute('y') })));
    expect(points).toHaveLength(2);
    const dx = points[1].x - points[0].x, dy = points[1].y - points[0].y;
    expect(Math.abs(dx) + Math.abs(dy)).toBeGreaterThan(0);
    const direction = (dy < 0 ? '北' : dy > 0 ? '南' : '') + (dx > 0 ? '东' : dx < 0 ? '西' : '');
    const answer = { 北东: '东北', 南东: '东南', 北西: '西北', 南西: '西南' }[direction] || direction;
    const judgeOptions = await page.locator('#judgeOptions button').allTextContents();
    expect(judgeOptions).toHaveLength(4);
    expect(new Set(judgeOptions).size).toBe(4);
    await page.locator('#judgeOptions button').filter({ hasText: new RegExp(`^${answer}$`) }).click();
    await expect(page.locator('#judgeFeedback')).toContainText('正确');

    await page.locator('[data-mode="challenge"]').click();
    const question = await page.locator('#chProblem').innerText();
    const options = await page.locator('#chOptions button').allTextContents();
    expect(options).toHaveLength(4);
    expect(new Set(options).size).toBe(4);
    let correct;
    if (seed === 0) {
      expect(question).toContain('面对面');
      correct = opposite[question.match(/面朝(东|南|西|北)方/)[1]];
    } else if (seed === 0.25) {
      correct = question.includes('早上') ? '东' : '西';
    } else if (seed === 0.5) {
      correct = opposite[question.match(/的(东北|东南|西南|西北|东|南|西|北)方向/)[1]];
    } else {
      expect(question).toContain('学校在邮局的哪个方向');
      correct = question.match(/再往(东|南|西|北)走到学校/)[1];
    }
    expect(options).toContain(correct);
    await page.locator('#chOptions button').filter({ hasText: new RegExp(`^${correct}$`) }).click();
    await expect(page.locator('#chFeedback')).toContainText('太棒');
  });
}
