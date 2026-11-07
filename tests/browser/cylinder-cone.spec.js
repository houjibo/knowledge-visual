const {test, expect} = require('@playwright/test');

test('固定随机值下计算题可生成并答对，圆锥公式正确', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/math/topics/cylinder-and-cone/index.html');
  await page.getByRole('button', {name: '🔍 展开图'}).click();
  await page.locator('#btn-cone-unfold').click();
  await expect(page.locator('#unfold-explain-text')).toContainText('侧面积 = πrl');
  await page.getByRole('button', {name: '🧮 计算'}).click();
  const options = page.locator('#calc-options button');
  await expect(options).toHaveCount(4);
  expect(new Set(await options.allTextContents()).size).toBe(4);
  await expect(page.locator('#calc-hint')).toContainText('π取3.14');
  await options.getByText('12.56 cm²', {exact: true}).click();
  await expect(page.locator('#calc-result')).toContainText('答对');
  expect(errors).toEqual([]);
});

test('挑战题重复候选可补齐并显示正确单位', async ({page}) => {
  await page.goto('/math/topics/cylinder-and-cone/index.html');
  const question = await page.evaluate(() => {
    const values = [.999, 0, 0];
    Math.random = () => values.length ? values.shift() : 0;
    return genChallengeQ();
  });
  expect(question.answer).toBe(3.14);
  expect(question.opts).toHaveLength(4);
  expect(new Set(question.opts).size).toBe(4);
  expect(question.opts).toContain(question.answer);
  await page.getByRole('button', {name: '🏆 挑战'}).click();
  await page.locator('#challenge-start-area button').click();
  await expect(page.locator('#ch-options button')).toHaveCount(4);
  for (const option of await page.locator('#ch-options button').allTextContents()) expect(option).toContain('cm²');
});

test('五类数值挑战题的答案与单位符合公式', async ({page}) => {
  await page.goto('/math/topics/cylinder-and-cone/index.html');
  await page.getByRole('button', {name: '🏆 挑战'}).click();
  await page.locator('#challenge-start-area button').click();
  for (const [typeRandom, answer, unit] of [[0, 12.56, 'cm²'], [.17, 6.28, 'cm³'], [.34, 2.09, 'cm³'], [.51, 18.84, 'cm²'], [.85, 3.14, 'cm²']]) {
    const question = await page.evaluate(typeRandom => {
      const values = [typeRandom, 0, 0];
      Math.random = () => values.length ? values.shift() : 0;
      const q = genChallengeQ();
      chQuestions = [q]; chIdx = 0; showChQ();
      return q;
    }, typeRandom);
    expect(question.answer).toBe(answer);
    expect(new Set(question.opts).size).toBe(4);
    await expect(page.locator('#ch-options button')).toHaveCount(4);
    for (const text of await page.locator('#ch-options button').allTextContents()) expect(text).toContain(unit);
    await page.locator('#ch-options button').getByText(`${answer} ${unit}`, {exact: true}).click();
    await expect(page.locator('#ch-result')).toContainText('正确');
  }
});
