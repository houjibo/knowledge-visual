const {test, expect} = require('@playwright/test');

for (const random of [0, .999999]) {
  test(`固定随机值 ${random} 下排除法唯一、键盘可完成`, async ({page}) => {
    await page.addInitScript(v => { Math.random = () => v; }, random);
    await page.goto('/math/topics/simple-reasoning/', {timeout: 10000});
    await page.locator('[data-mode="eliminate"]').click();
    const data = await page.evaluate(() => ({...eliminateState}));
    const permute = arr => arr.length ? arr.flatMap((v, i) => permute(arr.filter((_, j) => i !== j)).map(rest => [v, ...rest])) : [[]];
    const possible = permute(data.items).filter(p => data.clues.every(c => p[data.names.indexOf(c.name)] !== c.not));
    expect(possible).toHaveLength(1);
    expect(possible[0]).toEqual(data.names.map(n => data.assignment[n]));
    for (const name of data.names) {
      const button = page.locator(`[id="ec-${name}-${data.assignment[name]}"]`);
      await expect(button).toHaveAttribute('aria-label', `${name}，${data.assignment[name]}：未标记`);
      await button.focus();
      await page.keyboard.press('Enter');
      await page.keyboard.press('Space');
      await expect(button).toHaveAttribute('aria-label', `${name}，${data.assignment[name]}：确定`);
    }
    const check = page.getByRole('button', {name: '✅ 检查答案'});
    await check.click();
    await check.click();
    await expect(page.locator('#scoreText')).toHaveText('答对 1 题');
    await expect(page.locator('#eliminateNext')).toBeVisible();
  });
}

test('全部代换参数的图示、已知条件和答案一致', async ({page}) => {
  await page.goto('/math/topics/simple-reasoning/');
  const failures = await page.evaluate(() => {
    const issues = [];
    for (let ratio = 2; ratio <= 4; ratio++) for (let val = 1; val <= 3; val++) for (let count = 1; count <= 3; count++) {
      const seq = [0, 0, (ratio-2+.1)/3, (val-1+.1)/3, (count-1+.1)/3]; let i = 0;
      Math.random = () => seq[i++] ?? 0;
      loadSubstitute();
      const s = substituteState;
      const opts = [...document.querySelectorAll('#substituteOptions button')].map(x => +x.textContent);
      if (s.answer !== val * ratio * count || !document.querySelector('#substituteEq').textContent.includes(`1个${s.f1} = ${val}`) || opts.length !== 4 || new Set(opts).size !== 4 || !opts.includes(s.answer)) issues.push([ratio,val,count]);
    }
    return issues;
  });
  expect(failures).toEqual([]);
});

test('逻辑题可键盘答题且修正后的答案和解释一致', async ({page}) => {
  await page.goto('/math/topics/simple-reasoning/');
  await page.locator('[data-mode="logic"]').click();
  for (const [index, expected] of [[4, '红球'], [6, '油条']]) {
    await page.evaluate(index => { Math.random = () => (index + .1) / logicProblems.length; loadLogic(); }, index);
    const option = page.getByRole('button', {name: expected, exact: true});
    await option.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#logicExplain')).toContainText(expected);
    await expect(page.locator('#logicExplain')).not.toContainText('矛盾');
  }
});
