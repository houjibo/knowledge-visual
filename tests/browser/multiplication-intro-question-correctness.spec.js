const {test, expect} = require('@playwright/test');

for (const random of [0, .999999]) {
  test(`随机值 ${random} 下三个模式可加载并作答`, async ({page}) => {
    await page.addInitScript(v => { Math.random = () => v; }, random);
    await page.goto('/math/topics/multiplication-intro/', {timeout: 10000});
    for (const [mode, id, answer] of [['picture','pic','currentPicAnswer'], ['convert','conv','currentConvAnswer'], ['reverse','rev','currentRevAnswer']]) {
      await page.locator(`[data-mode="${mode}"]`).click();
      const options = page.locator(`#${id}-options button`);
      await expect(options).toHaveCount(4);
      expect(new Set(await options.allTextContents()).size).toBe(4);
      const value = await page.evaluate(name => ({currentPicAnswer, currentConvAnswer, currentRevAnswer})[name], answer);
      const correct = options.filter({hasText: value});
      await correct.focus();
      await page.keyboard.press('Enter');
      await expect(page.locator(`#${id}-correct`)).toHaveText('1');
      await expect(correct).toBeDisabled();
    }
    await page.locator('[data-mode="learn"]').click();
    await page.locator('#learn-next').click();
    await expect(page.locator('#learn-card')).toContainText('交换两个乘数');
  });
}

test('三类练习全部整数参数均有唯一正确选项', async ({page}) => {
  await page.goto('/math/topics/multiplication-intro/');
  const failures = await page.evaluate(() => {
    const issues = [];
    function generate(fn, first, firstRange, second, secondRange, selector) {
      let i = 0;
      Math.random = () => [ (first + .1) / firstRange, (second + .1) / secondRange ][i++] ?? 0;
      fn();
      return [...document.querySelectorAll(selector)].map(e => e.textContent);
    }
    function check(options, expected, label) {
      if (options.length !== 4 || new Set(options).size !== 4 || options.filter(x => x === expected).length !== 1) issues.push(label + ': options');
    }
    for (let g = 2; g <= 5; g++) for (let p = 1; p <= 5; p++) {
      const options = generate(nextPic, g - 2, 4, p - 1, 5, '#pic-options button');
      check(options, `${g} × ${p} = ${g*p}`, `pic ${g},${p}`);
      const valid = options.filter(s => { const m = s.match(/^(\d+) × (\d+) = (\d+)$/); return m && +m[1] * +m[2] === g*p && +m[3] === g*p; });
      if (valid.length !== 1) issues.push(`pic ${g},${p}: valid ${valid}`);
    }
    for (let a = 1; a <= 6; a++) for (let n = 2; n <= 6; n++) {
      const options = generate(nextConv, a - 1, 6, n - 2, 5, '#conv-options button');
      check(options, `${n} × ${a} = ${n*a}`, `conv ${a},${n}`);
      const valid = options.filter(s => { const m = s.match(/^(\d+) × (\d+) = (\d+)$/); return m && +m[1] * +m[2] === n*a && +m[3] === n*a; });
      if (valid.length !== 1) issues.push(`conv ${a},${n}: valid ${valid}`);
      const reversed = generate(nextRev, a - 1, 6, n - 2, 5, '#rev-options button');
      check(reversed, Array(n).fill(a).join(' + ') + ` = ${n*a}`, `reverse ${a},${n}`);
      const validSums = reversed.filter(s => { const [left, right] = s.split(' = '); const sum = left.split(' + ').reduce((x, y) => x + +y, 0); return sum === n*a && +right === n*a; });
      if (validSums.length !== 1) issues.push(`reverse ${a},${n}: valid ${validSums}`);
    }
    return issues;
  });
  expect(failures).toEqual([]);
});
