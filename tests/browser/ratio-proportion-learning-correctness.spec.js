const {test, expect} = require('@playwright/test');

for (const random of [0, .21, .41, .61, .81, .999999]) {
  test(`重复随机值 ${random} 时图示与挑战一致`, async ({page}) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(value => { Math.random = () => value; }, random);
    await page.goto('/math/topics/ratio-and-proportion/', {timeout: 10000});
    const groups = page.locator('#ratio-visual .ratio-group');
    for (let i = 0; i < 2; i++) {
      const group = groups.nth(i);
      const text = await group.innerText();
      const count = Number(text.match(/(\d+) 个/)[1]);
      expect(await group.locator('.ratio-block').count()).toBe(count);
    }
    await page.locator('[data-mode="challenge"]').click();
    const question = await page.locator('#challenge-problem').innerText();
    const options = page.locator('#challenge-options button');
    await expect(options).toHaveCount(4);
    const values = await options.allTextContents();
    expect(new Set(values).size).toBe(4);
    let correct;
    let match;
    if ((match = question.match(/化简比：(\d+)\s*:\s*(\d+)/))) {
      let a = +match[1], b = +match[2];
      const gcd = (x, y) => y ? gcd(y, x % y) : x;
      const g = gcd(a, b); correct = `${a/g}:${b/g}`;
    } else if ((match = question.match(/买 (\d+) 个物品共花 (\d+) 元，买 (\d+) 个/))) {
      correct = String(+match[2] / +match[1] * +match[3]);
    } else if ((match = question.match(/面积 (\d+) cm²，长 (\d+) cm/))) {
      correct = String(+match[1] / +match[2]);
    } else if ((match = question.match(/比例尺 1:(\d+)，图上 (\d+) cm/))) {
      correct = String(+match[1] * +match[2] / 100);
      expect(question).toContain('换成米');
    } else if ((match = question.match(/解比例：(\d+)\s*:\s*(\d+)\s*=\s*(\d+)\s*:\s*x/))) {
      correct = String(+match[2] * +match[3] / +match[1]);
    } else throw new Error(`未识别题目：${question}`);
    expect(values.filter(v => v === correct)).toHaveLength(1);
    const answer = options.filter({hasText: new RegExp(`^${correct}$`)});
    await answer.focus();
    await page.keyboard.press('Enter');
    await answer.click({force: true});
    await expect(page.locator('#streak')).toHaveText('1');
    expect(errors).toEqual([]);
  });
}
