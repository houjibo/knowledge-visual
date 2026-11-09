const {test, expect} = require('@playwright/test');

const url = '/math/topics/multi-digit-multiplication/index.html';

async function startChallenge(page) {
  await page.clock.install();
  await page.addInitScript(() => { Math.random = () => 0.5; });
  await page.goto(url);
  await page.locator('.mode-tab[data-mode="challenge"]').click();
  await page.locator('#btn-start-challenge').click();
}

test('Enter 作答只计一次，实时反馈后焦点进入新题', async ({page}) => {
  await startChallenge(page);
  const problem = await page.locator('#challenge-problem').innerText();
  const [a, b] = problem.match(/\d+/g).map(Number);
  const answer = a * b;
  const group = page.getByRole('group', {name: problem});
  const options = group.getByRole('button');
  await expect(options).toHaveCount(4);

  const correct = options.filter({hasText: new RegExp(`^${answer}$`)});
  const values = (await options.allTextContents()).map(Number);
  const correctIndex = values.indexOf(answer);
  await options.first().focus();
  await page.keyboard.press('Tab');
  await expect(options.nth(1)).toBeFocused();
  expect(await options.nth(1).evaluate(element => element.matches(':focus-visible'))).toBe(true);
  await page.keyboard.press('Shift+Tab');
  for (let index = 0; index < correctIndex; index++) await page.keyboard.press('Tab');
  await expect(correct).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.locator('#ch-correct')).toHaveText('1');
  await expect(page.getByRole('status')).toContainText('正确');
  await expect(options).toHaveCount(4);
  for (const option of await options.all()) await expect(option).toBeDisabled();
  await correct.dispatchEvent('click');
  await expect(page.locator('#ch-correct')).toHaveText('1');

  await page.clock.fastForward(1500);
  const nextProblem = await page.locator('#challenge-problem').innerText();
  const nextOptions = page.getByRole('group', {name: nextProblem}).getByRole('button');
  await expect(nextOptions).toHaveCount(4);
  await expect(nextOptions.first()).toBeFocused();
  await expect(nextOptions.first()).toBeEnabled();
});

test('Space 答错后保留反馈并锁定当前题', async ({page}) => {
  await startChallenge(page);
  const problem = await page.locator('#challenge-problem').innerText();
  const [a, b] = problem.match(/\d+/g).map(Number);
  const answer = a * b;
  const options = page.getByRole('group', {name: problem}).getByRole('button');
  const wrong = options.filter({hasNotText: new RegExp(`^${answer}$`)}).first();
  await wrong.focus();
  await page.keyboard.press('Space');

  await expect(page.locator('#ch-wrong')).toHaveText('1');
  await expect(page.getByRole('status')).toContainText(`正确答案是 ${answer}`);
  for (const option of await options.all()) await expect(option).toBeDisabled();
  await wrong.dispatchEvent('click');
  await expect(page.locator('#ch-wrong')).toHaveText('1');
});

test('计时结束锁定选项并拒绝迟到作答', async ({page}) => {
  await startChallenge(page);
  const options = page.locator('#challenge-options button');
  await page.clock.runFor(10000);

  await expect(page.getByRole('status')).toContainText('时间到');
  for (const option of await options.all()) await expect(option).toBeDisabled();
  await options.first().dispatchEvent('click');
  await expect(page.locator('#ch-correct')).toHaveText('0');
  await expect(page.locator('#ch-wrong')).toHaveText('0');

  await page.clock.fastForward(1500);
  await expect(page.locator('#challenge-options button')).toHaveCount(4);
  await expect(page.locator('#challenge-options button').first()).toBeEnabled();
});
