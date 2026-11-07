const {test, expect} = require('@playwright/test');
const url = '/math/topics/number-line/index.html';

test('固定随机值正常加载，找数与比较的图形和答案一致', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="find"]').click();
  const options = page.locator('#find-options button');
  await expect(options).toHaveCount(4);
  expect(new Set(await options.allTextContents()).size).toBe(4);
  const position = Number(await page.locator('#find-svg-container circle').getAttribute('cx'));
  const labels = page.locator('#find-svg-container text.nl-number');
  const target = await labels.evaluateAll((nodes, x) => nodes.find(node => Number(node.getAttribute('x')) === x).textContent, position);
  await options.getByText(target, {exact: true}).click();
  await expect(page.locator('#find-feedback')).toHaveText('✅ 正确！');
  await expect(options.first()).toBeDisabled();
  await expect(page.locator('#find-correct')).toHaveText('1');
  await page.locator('[data-mode="compare"]').click();
  const compare = page.locator('#compare-options button');
  const values = (await compare.allTextContents()).map(Number);
  expect(new Set(values).size).toBe(2);
  const question = await page.locator('#compare-question').textContent();
  const answer = question.includes('更大') ? Math.max(...values) : Math.min(...values);
  await compare.getByText(String(answer), {exact: true}).click();
  await expect(page.locator('#compare-feedback')).toHaveText('✅ 正确！');
  await expect(compare.first()).toBeDisabled();
});

test('挑战答错只记录一次，到时显示成绩并支持重启', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.clock.install();
  await page.goto(url);
  await page.locator('[data-mode="challenge"]').click();
  await page.locator('#challenge-start').click();
  await page.clock.runFor(59000);
  const options = page.locator('#challenge-options button');
  await options.filter({hasNotText: /^0$/}).first().click();
  await expect(options.first()).toBeDisabled();
  await expect(page.locator('#challenge-wrong')).toHaveText('1');
  await page.clock.runFor(2000);
  await expect(page.locator('#challenge-result')).toHaveText('挑战结束！正确 0 题，错误 1 题');
  await expect(page.locator('#challenge-result')).toBeVisible();
  await expect(page.locator('#challenge-options button')).toHaveCount(0);
  await page.locator('#challenge-start').click();
  await expect(page.locator('#challenge-result')).toBeEmpty();
  await expect(page.locator('#challenge-time')).toHaveText('60');
  await expect(page.locator('#challenge-options button')).toHaveCount(4);
});

test('挑战比较题显示的两个点决定正确答案', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="challenge"]').click();
  await page.evaluate(() => {
    const sequence = [0, .9, 0, 0, .9];
    Math.random = () => sequence.length ? sequence.shift() : 0;
  });
  await page.locator('#challenge-start').click();
  await expect(page.locator('#challenge-question')).toHaveText('哪个数更大？');
  const labels = await page.locator('#challenge-svg-container text.nl-label').allTextContents();
  expect(labels.map(Number)).toEqual([0, 1]);
  await page.locator('#challenge-options button').getByText('1', {exact: true}).click();
  await expect(page.locator('#challenge-correct')).toHaveText('1');
  await expect(page.locator('#challenge-options button').first()).toBeDisabled();
});

test('键盘探索数轴，点位和解释随数字变化并保留状态', async ({page}) => {
  await page.goto(url);
  const slider = page.getByRole('slider', {name: '选择 0 到 10 的整数'});
  const point = page.locator('#explore-svg circle.nl-point');
  await expect(slider).toHaveValue('2');
  await expect(point).toHaveAttribute('cx', '96');
  await slider.focus();
  await page.keyboard.press('Home');
  await expect(slider).toHaveValue('0');
  await expect(point).toHaveAttribute('cx', '40');
  await expect(page.locator('#explore-description')).toContainText('原点 0');
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveValue('1');
  await expect(point).toHaveAttribute('cx', '68');
  await expect(page.locator('#explore-description')).toContainText('向右数 1 格');
  await page.keyboard.press('End');
  await expect(slider).toHaveValue('10');
  await expect(point).toHaveAttribute('cx', '320');
  await expect(page.locator('#explore-value')).toHaveText('数字：10');
  await page.locator('#learn-next').click();
  await page.locator('[data-mode="find"]').click();
  await page.locator('[data-mode="learn"]').click();
  await expect(slider).toHaveValue('10');
  await expect(point).toHaveAttribute('cx', '320');
});
